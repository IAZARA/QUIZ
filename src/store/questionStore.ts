import { create } from 'zustand';
import { QuestionState, Question, Votes } from '../types';
import io from 'socket.io-client';
import { useQuizConfigStore } from './quizConfigStore';

let socket: ReturnType<typeof io> | null = null;

export const useQuestionStore = create<QuestionState>((set, get) => ({
  questions: [],
  currentQuestion: null,
  votes: { a: 0, b: 0, c: 0 },
  hasVoted: false,
  timeRemaining: null,
  initialized: false,
  lastSelectedOption: null,
  
  initialize: async () => {
    try {
      if (!socket) {
        // Conectar al servidor Socket.io usando el proxy
        socket = io({
          path: '/socket.io',
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });
  
  // Configurar listeners de socket
        socket.on('question_created', (newQuestion: Question) => {
          set((state) => ({
            ...state,
            questions: [newQuestion, ...state.questions]
      }));
    });
    
    socket.on('question_updated', (updatedQuestion: Question) => {
          set((state) => ({
            ...state,
        questions: state.questions.map(q => 
          q._id === updatedQuestion._id ? updatedQuestion : q
        ),
            currentQuestion: state.currentQuestion?._id === updatedQuestion._id ? 
              updatedQuestion : state.currentQuestion
      }));
    });
    
        socket.on('question_deleted', (id: string) => {
          set((state) => ({
            ...state,
            questions: state.questions.filter(q => q._id !== id),
            currentQuestion: state.currentQuestion?._id === id ? null : state.currentQuestion
      }));
    });
    
        socket.on('voting_started', (data: { question: Question, votes: { total: number, counts: Record<string, number> } }) => {
          const votesData: Votes = { a: 0, b: 0, c: 0, ...data.votes.counts };
          set({
            currentQuestion: data.question,
            votes: votesData,
            hasVoted: false,
            timeRemaining: data.question.timer || 30
          });
          
          // Limpiar cualquier selección previa en localStorage para la nueva pregunta
          try {
            // Obtener el participante actual
            const participantData = localStorage.getItem('quiz_participant');
            if (participantData) {
              const participant = JSON.parse(participantData);
              
              // Limpiar todas las claves de votación para esta pregunta
              const voteStorageKey = `vote_${data.question._id}`;
              const hasVotedKey = `hasVoted_${data.question._id}`;
              const selectedOptionKey = `selectedOption_${data.question._id}`;
              
              localStorage.removeItem(voteStorageKey);
              localStorage.removeItem(hasVotedKey);
              localStorage.removeItem(selectedOptionKey);
              
              console.log(`Limpiado estado de votación previo para pregunta ${data.question._id}`);
            }
          } catch (error) {
            console.error("Error al limpiar datos de votación previa:", error);
          }
        });
        
        socket.on('voting_stopped', (data: { question: Question, votes: { total: number, counts: Record<string, number> } }) => {
          const votesData: Votes = { a: 0, b: 0, c: 0, ...data.votes.counts };
          set({
            currentQuestion: data.question,
            votes: votesData,
            timeRemaining: null
          });
        });
    
        socket.on('voting_closed', (data: { question: Question, votes: { total: number, counts: Record<string, number> } }) => {
          const votesData: Votes = { a: 0, b: 0, c: 0, ...data.votes.counts };
          set({
            currentQuestion: data.question,
            votes: votesData,
            timeRemaining: null
          });
        });
    
        // Evento para audiencia - solo confirmación de voto sin estadísticas
        socket.on('vote_submitted', (data: { question_id: string }) => {
          // Solo confirmar que el voto fue recibido, sin actualizar estadísticas
          console.log('Voto confirmado para pregunta:', data.question_id);
        });

        // Evento para presentador - estadísticas en tiempo real
        socket.on('presenter_stats_update', (data: { question_id: string, votes: { total: number, counts: Record<string, number> } }) => {
          set((state) => {
            if (state.currentQuestion?._id === data.question_id) {
              const votesData: Votes = { a: 0, b: 0, c: 0, ...data.votes.counts };
              return {
                ...state,
                votes: votesData
              };
            }
            return state;
          });
        });

        // Evento para mostrar resultados a la audiencia (NUEVO)
        socket.on('show_question_results', (data: { question: Question, votes: { total: number, counts: Record<string, number> }, showStatistics: boolean }) => {
          const votesData: Votes = { a: 0, b: 0, c: 0, ...data.votes.counts };
          set({
            currentQuestion: data.question,
            votes: votesData,
            timeRemaining: null
          });
        });

        // Mantener compatibilidad con evento anterior
        socket.on('show_results', (data: { question: Question, votes: { total: number, counts: Record<string, number> }, showStatistics: boolean }) => {
          const votesData: Votes = { a: 0, b: 0, c: 0, ...data.votes.counts };
          set({
            currentQuestion: data.question,
            votes: votesData,
            timeRemaining: null
          });
        });
        
        socket.on('clear_view', () => {
          set({
            currentQuestion: null,
            votes: { a: 0, b: 0, c: 0 },
            hasVoted: false,
            timeRemaining: null
      });
    });
    
        socket.on('quiz_config_updated', () => {
          // Actualizar la configuración global
          useQuizConfigStore.getState().getConfig();
        });
      }
      
      // Obtener todas las preguntas
      const response = await fetch('/api/questions');
      if (!response.ok) throw new Error('Error al cargar preguntas');
      const questions: Question[] = await response.json();
      
      // Obtener pregunta activa
      const activeResponse = await fetch('/api/questions/active');
      if (!activeResponse.ok) throw new Error('Error al cargar pregunta activa');
      const activeData = await activeResponse.json();
      
      const votesData: Votes = { a: 0, b: 0, c: 0, ...(activeData.votes?.counts || {}) };
        
        set({ 
        questions, 
        currentQuestion: activeData.question,
        votes: votesData,
        timeRemaining: activeData.question?.timer || null,
        initialized: true
      });
        
      // Iniciar el temporizador si hay uno configurado
      if (activeData.question?.timer && !activeData.question.votingClosed) {
        const endTime = new Date(activeData.question.endTime);
        const now = new Date();
        const remainingMilliseconds = Math.max(0, endTime.getTime() - now.getTime());
        set({ timeRemaining: Math.ceil(remainingMilliseconds / 1000) });
        }
      } catch (error) {
      console.error('Error initializing store:', error);
      throw error;
    }
  },
    
  createQuestion: async (question) => {
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(question),
      });
      
      if (!response.ok) throw new Error('Error creating question');
      
      // No actualizamos el estado aquí, dejamos que el evento 'question_created' lo maneje
      const newQuestion = await response.json();
      return newQuestion;
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  },
    
    updateQuestion: async (id, updates) => {
    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Error updating question');
      
      const updatedQuestion = await response.json();
      set((state) => ({
        ...state,
        questions: state.questions.map(q => 
          q._id === updatedQuestion._id ? updatedQuestion : q
        ),
        currentQuestion: state.currentQuestion?._id === updatedQuestion._id ? 
          updatedQuestion : state.currentQuestion
      }));
      } catch (error) {
      console.error('Error updating question:', error);
        throw error;
      }
    },
    
  deleteQuestion: async (id) => {
    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Error deleting question');
      
      set((state) => ({
        ...state,
        questions: state.questions.filter(q => q._id !== id),
        currentQuestion: state.currentQuestion?._id === id ? null : state.currentQuestion
      }));
      } catch (error) {
      console.error('Error deleting question:', error);
        throw error;
      }
    },
    
  startVoting: async (id) => {
    try {
      const response = await fetch(`/api/questions/${id}/start`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Error starting voting');
      
      const updatedQuestion = await response.json();
      
      // Limpiar todas las claves de localStorage relacionadas con esta pregunta
      try {
        const voteStorageKey = `vote_${id}`;
        const hasVotedKey = `hasVoted_${id}`;
        const selectedOptionKey = `selectedOption_${id}`;
        
        localStorage.removeItem(voteStorageKey);
        localStorage.removeItem(hasVotedKey);
        localStorage.removeItem(selectedOptionKey);
        
        console.log(`Limpiado estado de votación previo para pregunta ${id} desde startVoting`);
      } catch (error) {
        console.error("Error al limpiar datos de votación previa:", error);
      }
      
      // Limpiar el estado de votación del usuario
      get().clearUserVoteState();
      
      // Actualizar el estado local para que:
      // 1. Esta pregunta esté activa
      // 2. Todas las demás preguntas estén inactivas
      set((state) => {
        // Actualizar todas las preguntas, asegurando que solo la actual esté activa
        const updatedQuestions = state.questions.map(q => 
          q._id === id 
            ? { ...q, is_active: true, votingClosed: false } 
            : { ...q, is_active: false }
        );
        
        return {
          ...state,
          questions: updatedQuestions,
          currentQuestion: {
            ...updatedQuestion,
            is_active: true,
            votingClosed: false
          },
          hasVoted: false, // Asegurarse de que el usuario no haya votado aún
          lastSelectedOption: null, // Limpiar la última opción seleccionada
          votes: { a: 0, b: 0, c: 0 },
          timeRemaining: updatedQuestion.timer || 30
        };
      });
    } catch (error) {
      console.error('Error starting voting:', error);
      throw error;
    }
  },
    
  stopVoting: async (id, correctOption) => {
    try {
      const response = await fetch(`/api/questions/${id}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correctOption }),
      });
      
      if (!response.ok) throw new Error('Error stopping voting');
      
      const data = await response.json();
      const votesData: Votes = { a: 0, b: 0, c: 0, ...data.votes.counts };
      
      // Actualizar el estado local para que la pregunta deje de estar activa inmediatamente
      set((state) => {
        // Actualizar la pregunta específica en la lista de preguntas
        const updatedQuestions = state.questions.map(q => 
          q._id === id ? { ...q, is_active: false, votingClosed: true } : q
        );
        
        return {
          ...state,
          questions: updatedQuestions,
          currentQuestion: data.question ? { ...data.question, is_active: false, votingClosed: true } : null,
          votes: votesData,
          timeRemaining: null
        };
      });
    } catch (error) {
      console.error('Error stopping voting:', error);
      throw error;
    }
  },

  showResults: async (id: string, correctOption: string) => {
    try {
      const response = await fetch(`/api/questions/${id}/show-results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correctOption }),
      });
      
      if (!response.ok) throw new Error('Error al mostrar resultados');
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error showing results:', error);
      throw error;
    }
  },
    
    submitVote: async (questionId, option) => {
    try {
      // Verificar que la pregunta aún está activa
      const state = get();
      if (!state.currentQuestion || state.currentQuestion._id !== questionId || state.currentQuestion.votingClosed) {
        throw new Error('No se puede votar en esta pregunta');
      }
      
      const participant = JSON.parse(localStorage.getItem('quiz_participant') || '{}');
      if (!participant || !participant._id) {
        throw new Error('Debes iniciar sesión para votar');
      }

      // Normalizar la opción a minúscula para consistencia con el servidor
      const normalizedOption = option.toLowerCase();

      const response = await fetch(`/api/questions/${questionId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          option: normalizedOption, 
          voter_id: participant._id 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar voto');
      }
      
      const data = await response.json();
      
      // Asegurarnos de que los contadores de votos estén correctos
      const votesData: Votes = {
        a: 0,
        b: 0,
        c: 0,
        ...data.votes.counts
      };
      
      console.log("Votos actualizados:", votesData);
      
      // Actualizar el estado con los nuevos votos
      set((state) => {
        return {
          ...state,
          votes: votesData,
          hasVoted: true,
          lastSelectedOption: normalizedOption
        };
      });
      
      // Guardar en localStorage la opción seleccionada para esta pregunta específica
      try {
        const voteStorageKey = `vote_${questionId}`;
        localStorage.setItem(voteStorageKey, normalizedOption);
      } catch (error) {
        console.error("Error al guardar voto en localStorage:", error);
      }
      
      } catch (error) {
        console.error('Error submitting vote:', error);
        throw error;
      }
    },
    
  setHasVoted: (value) => {
    set({ hasVoted: value });
  },
  
  updateQuestionTimer: async (id, seconds) => {
    try {
      set((state) => {
        const updatedQuestions = state.questions.map(q => 
          q._id === id ? { ...q, timer: seconds } : q
        );
        
        const updatedCurrentQuestion = state.currentQuestion && state.currentQuestion._id === id
          ? { ...state.currentQuestion, timer: seconds }
          : state.currentQuestion;
        
        return {
          ...state,
          questions: updatedQuestions,
          currentQuestion: updatedCurrentQuestion
        };
      });
      
      // Guardar cambio en el servidor
      await fetch(`/api/questions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timer: seconds }),
      });
      } catch (error) {
      console.error('Error updating timer:', error);
      }
    },
    
    checkTimeRemaining: () => {
    const { currentQuestion, timeRemaining } = get();
      
    if (currentQuestion && !currentQuestion.votingClosed && timeRemaining !== null && timeRemaining > 0) {
      set({ timeRemaining: timeRemaining - 1 });
        } else if (timeRemaining === 0) {
      // El temporizador ha terminado
      set({ timeRemaining: null });
      
      // Cuando el temporizador llega a cero, marcamos la pregunta como finalizada
      if (currentQuestion && !currentQuestion.votingClosed) {
        // Realizar una actualización silenciosa para cambiar el estado visual
        set(state => ({
          ...state,
          currentQuestion: currentQuestion ? {
            ...currentQuestion,
            votingClosed: true
          } : null
        }));
      }
      }
    },
    
    clearView: async () => {
      try {
      const response = await fetch('/api/questions/clear', {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Error clearing view');
      
      // Actualizar el estado para desactivar todas las preguntas activas
      set((state) => {
        // Marcar todas las preguntas activas como inactivas
        const updatedQuestions = state.questions.map(q => 
          q.is_active ? { ...q, is_active: false, votingClosed: true } : q
        );
        
        return {
          ...state,
          questions: updatedQuestions,
          currentQuestion: null,
          votes: { a: 0, b: 0, c: 0 },
          hasVoted: false,
          timeRemaining: null
        };
      });
      } catch (error) {
      console.error('Error clearing view:', error);
      throw error;
    }
  },
  
  // Añadir función para limpiar el estado de votación de usuario
  clearUserVoteState: () => {
    set(state => ({
      ...state,
      hasVoted: false,
      lastSelectedOption: null
    }));
    
    // Si hay una pregunta activa, limpiar su estado de votación específico
    const { currentQuestion } = get();
    if (currentQuestion) {
      try {
        const voteStorageKey = `vote_${currentQuestion._id}`;
        const hasVotedKey = `hasVoted_${currentQuestion._id}`;
        const selectedOptionKey = `selectedOption_${currentQuestion._id}`;
        
        localStorage.removeItem(voteStorageKey);
        localStorage.removeItem(hasVotedKey);
        localStorage.removeItem(selectedOptionKey);
        
        console.log(`Limpiado estado de votación para pregunta actual ${currentQuestion._id}`);
      } catch (error) {
        console.error("Error al limpiar datos de votación:", error);
      }
    }
  }
}));

// Efecto global para actualizar el temporizador cada segundo
if (typeof window !== 'undefined') {
  setInterval(() => {
    useQuestionStore.getState().checkTimeRemaining();
  }, 1000);
}