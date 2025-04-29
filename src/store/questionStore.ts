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
    
        socket.on('vote_submitted', (data: { question_id: string, votes: { total: number, counts: Record<string, number> } }) => {
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
      
      const newQuestion = await response.json();
      set((state) => ({
        ...state,
        questions: [newQuestion, ...state.questions]
      }));
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
      
      set({
            currentQuestion: updatedQuestion,
        hasVoted: false,
        votes: { a: 0, b: 0, c: 0 },
        timeRemaining: updatedQuestion.timer || 30
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
      
      set({
        currentQuestion: data.question,
        votes: votesData,
        timeRemaining: null
      });
      } catch (error) {
      console.error('Error stopping voting:', error);
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
      
      const response = await fetch(`/api/questions/${questionId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ option, voter_id: participant._id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar voto');
      }
      
      const data = await response.json();
      const votesData: Votes = { a: 0, b: 0, c: 0, ...data.votes.counts };
      
      set({
        votes: votesData,
        hasVoted: true
      });
      // La interfaz QuestionState espera que submitVote devuelva Promise<void>
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
      }
    },
    
    clearView: async () => {
      try {
      const response = await fetch('/api/questions/clear', {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Error clearing view');
      
      set({
        currentQuestion: null,
        votes: { a: 0, b: 0, c: 0 },
        hasVoted: false,
        timeRemaining: null
      });
      } catch (error) {
      console.error('Error clearing view:', error);
      throw error;
    }
  }
}));

// Efecto global para actualizar el temporizador cada segundo
if (typeof window !== 'undefined') {
  setInterval(() => {
    useQuestionStore.getState().checkTimeRemaining();
  }, 1000);
}