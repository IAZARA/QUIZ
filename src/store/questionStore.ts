import { create } from 'zustand';
import * as api from '../lib/api';
import { connectSocket } from '../lib/api';

// Definición de tipos
interface Question {
  _id: string;
  content: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option?: string;
  explanation?: string;
  explanation_image?: string; // URL de la imagen para la explicación
  is_active: boolean;
  timer?: number;
  endTime?: Date | null;
  votingClosed?: boolean;
  created_at?: Date;
}

// Tipo para actualizar preguntas (incluye endTime)
interface QuestionInput {
  content?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  correct_option?: string;
  explanation?: string;
  explanation_image?: string;
  is_active?: boolean;
  timer?: number;
  endTime?: Date | null;
  votingClosed?: boolean;
}

interface QuestionState {
  questions: Question[];
  currentQuestion: Question | null;
  votes: Record<string, number>;
  timeRemaining: number | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  // Acciones
  initialize: () => Promise<void>;
  setCurrentQuestion: (question: Question | null) => void;
  createQuestion: (question: Omit<Question, '_id' | 'is_active' | 'created_at'>) => Promise<void>;
  updateQuestion: (id: string, question: QuestionInput) => Promise<void>;
  startVoting: (questionId: string) => Promise<void>;
  stopVoting: (questionId: string, correctOption: string) => Promise<void>;
  closeVoting: (questionId: string) => Promise<void>;
  submitVote: (questionId: string, option: string) => Promise<void>;
  deleteQuestion: (questionId: string) => Promise<void>;
  updateQuestionTimer: (questionId: string, timer: number) => Promise<void>;
  setTimeRemaining: (time: number | null) => void;
  checkTimeRemaining: () => void;
  fetchActiveQuestion: () => Promise<void>;
  clearView: () => Promise<void>; // Nueva función para limpiar la vista
}

// Crear el store
export const useQuestionStore = create<QuestionState>()((set, get) => {
  // Inicializar socket.io
  const socket = connectSocket();
  
  // Configurar listeners de socket
  if (socket) {
    // Cuando se limpia la vista
    socket.on('clear_view', () => {
      set({
        currentQuestion: null,
        votes: {},
        timeRemaining: null
      });
    });
    
    // Cuando se crea una nueva pregunta
    socket.on('question_created', (question: Question) => {
      set(state => ({
        questions: [...state.questions, question]
      }));
    });
    
    // Cuando se actualiza una pregunta
    socket.on('question_updated', (updatedQuestion: Question) => {
      set(state => ({
        questions: state.questions.map(q => 
          q._id === updatedQuestion._id ? updatedQuestion : q
        ),
        currentQuestion: state.currentQuestion?._id === updatedQuestion._id 
          ? updatedQuestion 
          : state.currentQuestion
      }));
    });
    
    // Cuando se elimina una pregunta
    socket.on('question_deleted', (questionId: string) => {
      set(state => ({
        questions: state.questions.filter(q => q._id !== questionId),
        currentQuestion: state.currentQuestion?._id === questionId 
          ? null 
          : state.currentQuestion
      }));
    });
    
    // Cuando comienza una votación
    socket.on('voting_started', ({ question, votes }: { question: Question, votes: { total: number, counts: Record<string, number> } }) => {
      set(state => ({
        currentQuestion: question,
        votes: votes.counts,
        timeRemaining: question.timer || null,
        // Actualizar también la lista de preguntas para reflejar el cambio de estado
        questions: state.questions.map(q => 
          q._id === question._id ? { ...q, is_active: true, votingClosed: false } : q
        )
      }));
      
      // Iniciar el temporizador también para los clientes de la audiencia
      if (question.timer) {
        const timerInterval = setInterval(() => {
          const currentTimeRemaining = get().timeRemaining;
          
          if (currentTimeRemaining === null || currentTimeRemaining <= 0) {
            clearInterval(timerInterval);
            return;
          }
          
          set({ timeRemaining: currentTimeRemaining - 1 });
        }, 1000);
      }
    });
    
    // Cuando se cierra una votación
    socket.on('voting_closed', ({ question, votes }: { question: Question, votes: { total: number, counts: Record<string, number> } }) => {
      set(state => ({
        currentQuestion: question,
        votes: votes.counts,
        timeRemaining: null,
        // Actualizar también la lista de preguntas para reflejar el cambio de estado
        questions: state.questions.map(q => 
          q._id === question._id ? { ...q, votingClosed: true } : q
        )
      }));
    });
    
    // Cuando se detiene una votación y se establece la respuesta correcta
    socket.on('voting_stopped', ({ question, votes }: { question: Question, votes: { total: number, counts: Record<string, number> } }) => {
      // Asegurarnos de que tenemos toda la información de la pregunta, incluida la explicación
      set(state => {
        // Buscar la pregunta original para obtener la explicación si no viene en el evento
        const originalQuestion = state.questions.find(q => q._id === question._id);
        const mergedQuestion = {
          ...originalQuestion,
          ...question,
          // Asegurarnos de que estos campos estén correctamente establecidos
          is_active: false,
          votingClosed: true
        };
        
        return {
          currentQuestion: mergedQuestion,
          votes: votes.counts,
          timeRemaining: null,
          // Actualizar también la lista de preguntas para reflejar el cambio de estado
          questions: state.questions.map(q => 
            q._id === question._id ? mergedQuestion : q
          )
        };
      });
    });
    
    // Cuando se recibe un nuevo voto
    socket.on('vote_submitted', ({ question_id, votes }: { question_id: string, votes: { total: number, counts: Record<string, number> } }) => {
      const { currentQuestion } = get();
      if (currentQuestion && currentQuestion._id === question_id) {
        set({ votes: votes.counts });
      }
    });
  }
  
  return {
    // Estado
    questions: [],
    currentQuestion: null,
    votes: {},
    timeRemaining: null,
    loading: false,
    error: null,
    initialized: false,
    
    // Inicializar el store
    initialize: async () => {
      if (get().initialized) return;
      
      set({ loading: true, error: null });
      try {
        // Cargar preguntas y eliminar duplicados
        const allQuestions = await api.getQuestions();
        
        // Eliminar posibles duplicados por ID
        const uniqueQuestions = [];
        const seenIds = new Set();
        
        for (const q of allQuestions) {
          if (!seenIds.has(q._id)) {
            seenIds.add(q._id);
            uniqueQuestions.push(q);
          } else {
            console.warn(`Pregunta duplicada detectada con ID: ${q._id}`);
          }
        }
        
        // Cargar pregunta activa y votos
        const { question, votes } = await api.getActiveQuestion();
        
        set({ 
          questions: uniqueQuestions, 
          currentQuestion: question, 
          votes: votes?.counts || {},
          timeRemaining: question?.timer ? question.timer : null,
          initialized: true,
          loading: false 
        });
        
        // Si hay una pregunta activa con temporizador, iniciar el temporizador
        if (question?.timer && question.is_active && !question.votingClosed) {
          const checkInterval = setInterval(() => {
            get().checkTimeRemaining();
          }, 1000);
          
          setTimeout(() => {
            clearInterval(checkInterval);
          }, (question.timer * 1000) + 1000);
        }
      } catch (error) {
        console.error('Error al inicializar:', error);
        set({ error: 'Error al cargar los datos', loading: false });
      }
    },
    
    // Obtener la pregunta activa
    fetchActiveQuestion: async () => {
      set({ loading: true, error: null });
      try {
        const { question, votes } = await api.getActiveQuestion();
        set({ 
          currentQuestion: question, 
          votes: votes?.counts || {},
          timeRemaining: question?.timer ? question.timer : null,
          loading: false 
        });
      } catch (error) {
        console.error('Error al obtener pregunta activa:', error);
        set({ error: 'Error al cargar la pregunta activa', loading: false });
      }
    },
    
    // Establecer la pregunta actual
    setCurrentQuestion: (question) => set({ currentQuestion: question }),
    
    // Crear una nueva pregunta
    createQuestion: async (question) => {
      set({ loading: true, error: null });
      try {
        const newQuestion = await api.createQuestion(question);
        set(state => ({ 
          questions: [...state.questions, newQuestion],
          loading: false
        }));
        return newQuestion;
      } catch (error) {
        console.error('Error al crear pregunta:', error);
        set({ error: 'Error al crear la pregunta', loading: false });
        throw error;
      }
    },
    
    // Actualizar una pregunta
    updateQuestion: async (id, questionUpdate) => {
      set({ loading: true, error: null });
      try {
        const updatedQuestion = await api.updateQuestion(id, questionUpdate);
        set(state => {
          // Actualizar la pregunta en la lista de preguntas
          const updatedQuestions = state.questions.map(q =>
            q._id === id ? updatedQuestion : q
          );
          
          // Si la pregunta actual es la que estamos actualizando, actualizarla también
          const updatedCurrentQuestion = state.currentQuestion?._id === id
            ? updatedQuestion
            : state.currentQuestion;
            
          return {
            questions: updatedQuestions,
            currentQuestion: updatedCurrentQuestion,
            loading: false
          };
        });
        return updatedQuestion;
      } catch (error) {
        console.error('Error al actualizar pregunta:', error);
        set({ error: 'Error al actualizar la pregunta', loading: false });
        throw error;
      }
    },
    
    // Iniciar votación
    startVoting: async (questionId) => {
      set({ loading: true, error: null });
      try {
        const result = await api.startVoting(questionId);
        
        // Actualizar el estado con la pregunta actualizada
        set(state => {
          // Buscar la pregunta en el estado actual
          const updatedQuestions = state.questions.map(q => 
            q._id === questionId 
              ? { ...q, is_active: true, votingClosed: false }
              : q
          );
          
          const activeQuestion = updatedQuestions.find(q => q._id === questionId);
          
          // Establecer el tiempo restante si hay un temporizador
          // Usar el valor del temporizador de la pregunta actualizada
          const timeRemaining = activeQuestion?.timer || null;
          
          return {
            loading: false,
            questions: updatedQuestions,
            currentQuestion: activeQuestion || state.currentQuestion,
            timeRemaining
          };
        });
        
        // Iniciar el temporizador si hay uno configurado
        const updatedQuestion = get().questions.find(q => q._id === questionId);
        if (updatedQuestion && updatedQuestion.timer) {
          // Establecer la hora de finalización
          const endTime = new Date(Date.now() + updatedQuestion.timer * 1000);
          
          // Actualizar la pregunta con la hora de finalización
          await api.updateQuestion(questionId, { endTime });
          
          // Emitir un evento de consola para depuración
          console.log(`Temporizador iniciado: ${updatedQuestion.timer} segundos`);
          console.log(`Hora de finalización: ${endTime.toISOString()}`);
          
          // Crear un intervalo global para el temporizador
          const timerInterval = setInterval(() => {
            // Calcular el tiempo restante basado en la hora actual y la hora de finalización
            const now = Date.now();
            const endTimeMs = endTime.getTime();
            const remainingMs = Math.max(0, endTimeMs - now);
            const remainingSeconds = Math.ceil(remainingMs / 1000);
            
            // Actualizar el tiempo restante en el estado
            set({ timeRemaining: remainingSeconds });
            
            // Si el tiempo llega a 0, cerrar la votación
            if (remainingSeconds <= 0) {
              get().closeVoting(questionId);
              clearInterval(timerInterval);
            }
          }, 500); // Verificar cada medio segundo para mayor precisión
        }
        
        return result;
      } catch (error) {
        console.error('Error al iniciar votación:', error);
        set({ error: 'Error al iniciar la votación', loading: false });
        throw error;
      }
    },
    
    // Detener votación y establecer respuesta correcta
    stopVoting: async (questionId, correctOption) => {
      set({ loading: true, error: null });
      try {
        // Asegurarse de que tenemos una opción correcta válida
        if (!correctOption || !['A', 'B', 'C'].includes(correctOption)) {
          // Si no hay opción correcta válida, buscar la pregunta actual
          const currentQuestions = get().questions;
          const currentQuestion = currentQuestions.find(q => q._id === questionId);
          
          // Si la pregunta tiene una opción correcta predefinida, usarla
          if (currentQuestion?.correct_option) {
            correctOption = currentQuestion.correct_option;
          } else {
            // Si no hay opción correcta, usar 'A' por defecto
            correctOption = 'A';
          }
        }
        
        // Llamar a la API para detener la votación
        const result = await api.stopVoting(questionId, correctOption);
        
        // Actualizar el estado con la pregunta actualizada
        set(state => {
          // Buscar la pregunta original para mantener la explicación
          const originalQuestion = state.questions.find(q => q._id === questionId);
          
          // Combinar la pregunta original con la actualizada para mantener todos los campos
          const updatedQuestion = {
            ...originalQuestion,
            ...result.question,
            is_active: true, // Mantener la pregunta activa para mostrar los resultados
            votingClosed: true,
            correct_option: correctOption
          };
          
          // Actualizar la lista de preguntas
          const updatedQuestions = state.questions.map(q => 
            q._id === questionId ? updatedQuestion : q
          );
          
          return {
            loading: false,
            timeRemaining: null,
            currentQuestion: updatedQuestion,
            questions: updatedQuestions,
            votes: { ...state.votes, ...result.votes.counts }
          };
        });
        
        return result;
      } catch (error) {
        console.error('Error al detener votación:', error);
        set({ error: 'Error al detener la votación', loading: false });
        throw error;
      }
    },
    
    // Cerrar votación sin mostrar respuesta correcta
    closeVoting: async (questionId) => {
      set({ loading: true, error: null });
      try {
        await api.closeVoting(questionId);
        set({ loading: false, timeRemaining: null });
      } catch (error) {
        console.error('Error al cerrar votación:', error);
        set({ error: 'Error al cerrar la votación', loading: false });
        throw error;
      }
    },
    
    // Enviar un voto
    submitVote: async (questionId, option) => {
      set({ loading: true, error: null });
      try {
        const result = await api.submitVote(questionId, option);
        
        // Actualizar los votos en el estado
        set(state => ({
          loading: false,
          votes: { ...state.votes, ...result.votes.counts }
        }));
        
        return result;
      } catch (error) {
        console.error('Error al enviar voto:', error);
        set({ error: 'Error al enviar el voto', loading: false });
        throw error;
      }
    },
    
    // Eliminar una pregunta
    deleteQuestion: async (questionId) => {
      set({ loading: true, error: null });
      try {
        await api.deleteQuestion(questionId);
        set(state => ({
          questions: state.questions.filter(q => q._id !== questionId),
          currentQuestion: state.currentQuestion?._id === questionId ? null : state.currentQuestion,
          loading: false
        }));
      } catch (error) {
        console.error('Error al eliminar pregunta:', error);
        set({ error: 'Error al eliminar la pregunta', loading: false });
        throw error;
      }
    },
    
    // Actualizar el temporizador de una pregunta
    updateQuestionTimer: async (questionId, timer) => {
      set({ loading: true, error: null });
      try {
        await api.updateQuestion(questionId, { timer });
        set(state => ({
          questions: state.questions.map(q =>
            q._id === questionId ? { ...q, timer } : q
          ),
          loading: false
        }));
      } catch (error) {
        console.error('Error al actualizar temporizador:', error);
        set({ error: 'Error al actualizar el temporizador', loading: false });
        throw error;
      }
    },
    
    // Establecer tiempo restante
    setTimeRemaining: (time) => set({ timeRemaining: time }),
    
    // Verificar tiempo restante
    checkTimeRemaining: () => {
      const { currentQuestion, closeVoting, timeRemaining } = get();
      
      // Solo verificar si hay una pregunta activa y no cerrada
      if (currentQuestion?.is_active && !currentQuestion.votingClosed) {
        if (timeRemaining !== null && timeRemaining > 0) {
          // No decrementamos aquí porque ya lo hacemos en el intervalo de startVoting
          // Solo verificamos si debemos cerrar la votación
          if (timeRemaining <= 0) {
            closeVoting(currentQuestion._id);
          }
        } else if (timeRemaining === 0) {
          // Si el tiempo ya llegó a cero, cerrar la votación
          closeVoting(currentQuestion._id);
        }
      }
    },
    
    // Limpiar la vista de audiencia
    clearView: async () => {
      try {
        await api.clearView();
        // La actualización del estado se maneja en el listener de socket.io
      } catch (error) {
        console.error('Error al limpiar la vista:', error);
      }
    }
  };
});