import { create } from 'zustand';
import io from 'socket.io-client';
import { AudienceQuestion } from '../types';

interface AudienceQAState {
  questions: AudienceQuestion[];
  isLoading: boolean;
  error: string | null;
  fetchQuestions: () => Promise<void>;
  submitQuestion: (text: string, author?: string) => Promise<void>; // Added author
  markAsAnswered: (id: string) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  upvoteQuestion: (id: string, userId: string) => Promise<void>; // Added upvoteQuestion
  initializeSocket: () => void;
  isAudienceQAActive: boolean;
  activateAudienceQA: () => Promise<void>;
  deactivateAudienceQA: () => Promise<void>;
}

let socket: ReturnType<typeof io> | null = null;

const API_BASE_URL = '/api/audience-questions';

export const useAudienceQAStore = create<AudienceQAState>((set, get) => ({
  questions: [],
  isLoading: false,
  error: null,
  isAudienceQAActive: false,

  initializeSocket: () => {
    if (!socket) {
      socket = io({
        path: '/socket.io', // Assuming the same path as other stores
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        console.log('AudienceQA Socket connected');
      });

      socket.on('disconnect', () => {
        console.log('AudienceQA Socket disconnected');
      });

      socket.on('new_audience_question', (newQuestion: AudienceQuestion) => {
        set((state) => ({
          questions: [newQuestion, ...state.questions],
        }));
      });

      socket.on('question_answered', (updatedQuestion: AudienceQuestion) => {
        set((state) => ({
          questions: state.questions.map((q) =>
            q._id === updatedQuestion._id ? updatedQuestion : q
          ),
        }));
      });

      socket.on('question_deleted', (deletedQuestionId: string) => {
        set((state) => ({
          questions: state.questions.filter((q) => q._id !== deletedQuestionId),
        }));
      });

      socket.on('question_upvoted', (upvotedQuestion: AudienceQuestion) => {
        set((state) => ({
          questions: state.questions.map((q) =>
            q._id === upvotedQuestion._id ? upvotedQuestion : q
          ).sort((a, b) => b.upvotes - a.upvotes || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), // Keep sorted
        }));
      });

      socket.on('audienceQA:status', (data: { isActive: boolean }) => {
        console.log('Evento audienceQA:status recibido:', data);
        set({ isAudienceQAActive: data.isActive });
      });
    }
  },

  fetchQuestions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar las preguntas de la audiencia');
      }
      const data = await response.json();
      set({
        questions: data.questions || data, // Handle both new format {questions, isActive} and old format (array)
        isAudienceQAActive: data.isActive !== undefined ? data.isActive : get().isAudienceQAActive,
        isLoading: false
      });
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
      console.error('Error fetching audience questions:', error);
    }
  },

  submitQuestion: async (text: string, author?: string) => { // Added author
    set({ isLoading: true, error: null });
    try {
      const payload: { text: string; author?: string } = { text };
      if (author && author.trim() !== '') {
        payload.author = author;
      }

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), // Send payload with author
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar la pregunta');
      }
      // The new question will be added via Socket.io event 'new_audience_question'
      // No need to update state directly here, but set loading to false
      set({ isLoading: false });
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
      console.error('Error submitting audience question:', error);
      throw error; // Re-throw to allow components to handle it
    }
  },

  markAsAnswered: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/${id}/answer`, {
        method: 'PUT',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al marcar como respondida');
      }
      // The updated question will be handled via Socket.io event 'question_answered'
      set({ isLoading: false });
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
      console.error('Error marking question as answered:', error);
    }
  },

  deleteQuestion: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar la pregunta');
      }
      // The question deletion will be handled via Socket.io event 'question_deleted'
      set({ isLoading: false });
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
      console.error('Error deleting audience question:', error);
    }
  },

  upvoteQuestion: async (id: string, userId: string) => {
    // No need to set isLoading here, as it's an optimistic update via socket
    // or the UI can handle its own loading state for the button if needed.
    try {
      const response = await fetch(`${API_BASE_URL}/${id}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        // Allow component to catch and display this error
        throw new Error(errorData.error || 'Error al votar por la pregunta');
      }
      // Updated question will be handled by 'question_upvoted' socket event
    } catch (error: any) {
      console.error('Error upvoting question:', error);
      // Re-throw to allow components to handle it
      throw error;
    }
  },

  activateAudienceQA: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/status/activate`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error activating Audience Q&A');
      }
      set({ isAudienceQAActive: true, isLoading: false, error: null });
    } catch (error: any) {
      console.error('Error activating Audience Q&A:', error);
      set({ isLoading: false, error: error.message });
    }
  },

  deactivateAudienceQA: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/status/deactivate`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error deactivating Audience Q&A');
      }
      set({ isAudienceQAActive: false, isLoading: false, error: null });
    } catch (error: any) {
      console.error('Error deactivating Audience Q&A:', error);
      set({ isLoading: false, error: error.message });
    }
  },
}));

// Initialize socket connection when the store is created/used
useAudienceQAStore.getState().initializeSocket();
