import { create } from 'zustand';
import io from 'socket.io-client';
import { DynamicForm, FormResponse, FormWithStats, ResponseSummary, SocketFormEvents } from '../types/formTypes';

interface FormBuilderState {
  // Estado de formularios
  forms: DynamicForm[];
  activeForm: DynamicForm | null;
  currentForm: Partial<DynamicForm>;
  
  // Estado de respuestas
  responses: FormResponse[];
  responseSummaries: ResponseSummary[];
  
  // Estado de UI
  isLoading: boolean;
  error: string | null;
  isFormBuilderOpen: boolean;
  isPreviewMode: boolean;
  
  // Socket
  socket: ReturnType<typeof io> | null;
  
  // Acciones para formularios
  createForm: (formData: Omit<DynamicForm, '_id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateForm: (formId: string, formData: Partial<DynamicForm>) => Promise<void>;
  deleteForm: (formId: string) => Promise<void>;
  fetchForms: (eventId: string, includeStats?: boolean) => Promise<void>;
  fetchForm: (formId: string) => Promise<void>;
  
  // Acciones para activación/desactivación
  activateForm: (formId: string) => Promise<void>;
  deactivateForm: (formId: string) => Promise<void>;
  fetchActiveForm: (eventId: string) => Promise<void>;
  
  // Acciones para respuestas
  submitResponse: (formId: string, responses: Record<string, any>, participantInfo?: any) => Promise<void>;
  fetchResponses: (formId: string, page?: number, limit?: number, summary?: boolean) => Promise<void>;
  
  // Acciones de UI
  setCurrentForm: (form: Partial<DynamicForm>) => void;
  setFormBuilderOpen: (open: boolean) => void;
  setPreviewMode: (preview: boolean) => void;
  clearError: () => void;
  
  // Socket
  initializeSocket: () => void;
  disconnectSocket: () => void;
}

const API_BASE_URL = '/api/form-builder';

export const useFormBuilderStore = create<FormBuilderState>((set, get) => ({
  // Estado inicial
  forms: [],
  activeForm: null,
  currentForm: {},
  responses: [],
  responseSummaries: [],
  isLoading: false,
  error: null,
  isFormBuilderOpen: false,
  isPreviewMode: false,
  socket: null,

  // Crear formulario
  createForm: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/forms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creating form');
      }

      const result = await response.json();
      
      // Actualizar lista de formularios
      set(state => ({
        forms: [result.form, ...state.forms],
        currentForm: {},
        isLoading: false
      }));

    } catch (error: any) {
      console.error('Error creating form:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Actualizar formulario
  updateForm: async (formId, formData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/forms/${formId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error updating form');
      }

      const result = await response.json();
      
      // Actualizar formulario en la lista
      set(state => ({
        forms: state.forms.map(form => 
          form._id === formId ? result.form : form
        ),
        isLoading: false
      }));

    } catch (error: any) {
      console.error('Error updating form:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Eliminar formulario
  deleteForm: async (formId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/forms/${formId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error deleting form');
      }

      // Remover formulario de la lista
      set(state => ({
        forms: state.forms.filter(form => form._id !== formId),
        activeForm: state.activeForm?._id === formId ? null : state.activeForm,
        isLoading: false
      }));

    } catch (error: any) {
      console.error('Error deleting form:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Obtener formularios
  fetchForms: async (eventId, includeStats = false) => {
    set({ isLoading: true, error: null });
    try {
      const url = `${API_BASE_URL}/forms/${eventId}${includeStats ? '?includeStats=true' : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error fetching forms');
      }

      const forms = await response.json();
      set({ forms, isLoading: false });

    } catch (error: any) {
      console.error('Error fetching forms:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Obtener formulario específico
  fetchForm: async (formId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/forms/single/${formId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error fetching form');
      }

      const form = await response.json();
      set({ currentForm: form, isLoading: false });

    } catch (error: any) {
      console.error('Error fetching form:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Activar formulario
  activateForm: async (formId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/forms/${formId}/activate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error activating form');
      }

      const result = await response.json();
      
      // Actualizar estado de formularios
      set(state => ({
        forms: state.forms.map(form => ({
          ...form,
          isActive: form._id === formId
        })),
        activeForm: result.form,
        isLoading: false
      }));

    } catch (error: any) {
      console.error('Error activating form:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Desactivar formulario
  deactivateForm: async (formId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/forms/${formId}/deactivate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error deactivating form');
      }

      // Actualizar estado de formularios
      set(state => ({
        forms: state.forms.map(form => 
          form._id === formId ? { ...form, isActive: false } : form
        ),
        activeForm: state.activeForm?._id === formId ? null : state.activeForm,
        isLoading: false
      }));

    } catch (error: any) {
      console.error('Error deactivating form:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Obtener formulario activo
  fetchActiveForm: async (eventId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/active/${eventId}`);

      if (response.status === 404) {
        set({ activeForm: null, isLoading: false });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error fetching active form');
      }

      const activeForm = await response.json();
      set({ activeForm, isLoading: false });

    } catch (error: any) {
      console.error('Error fetching active form:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Enviar respuesta
  submitResponse: async (formId, responses, participantInfo) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId,
          responses,
          participantInfo
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error submitting response');
      }

      set({ isLoading: false });

    } catch (error: any) {
      console.error('Error submitting response:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Obtener respuestas
  fetchResponses: async (formId, page = 1, limit = 50, summary = false) => {
    set({ isLoading: true, error: null });
    try {
      const url = `${API_BASE_URL}/responses/${formId}?page=${page}&limit=${limit}&summary=${summary}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error fetching responses');
      }

      const result = await response.json();
      
      if (summary) {
        set({ responseSummaries: result.responses, isLoading: false });
      } else {
        set({ responses: result.responses, isLoading: false });
      }

    } catch (error: any) {
      console.error('Error fetching responses:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Acciones de UI
  setCurrentForm: (form) => set({ currentForm: form }),
  setFormBuilderOpen: (open) => set({ isFormBuilderOpen: open }),
  setPreviewMode: (preview) => set({ isPreviewMode: preview }),
  clearError: () => set({ error: null }),

  // Socket
  initializeSocket: () => {
    const { socket } = get();
    if (socket) return;

    const newSocket = io({
      path: '/socket.io',
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('FormBuilder Socket connected');
    });

    newSocket.on('disconnect', () => {
      console.log('FormBuilder Socket disconnected');
    });

    // Eventos específicos de formularios
    newSocket.on('audienceForm:activated', (data) => {
      console.log('Form activated:', data);
      set(state => ({
        forms: state.forms.map(form => ({
          ...form,
          isActive: form._id === data.formId
        })),
        activeForm: data.form
      }));
    });

    newSocket.on('audienceForm:deactivated', (data) => {
      console.log('Form deactivated:', data);
      set(state => ({
        forms: state.forms.map(form => 
          form._id === data.formId ? { ...form, isActive: false } : form
        ),
        activeForm: state.activeForm?._id === data.formId ? null : state.activeForm
      }));
    });

    newSocket.on('audienceForm:newResponse', (data) => {
      console.log('New response received:', data);
      // Aquí podrías actualizar estadísticas en tiempo real
    });

    newSocket.on('audienceForm:created', (data) => {
      console.log('Form created:', data);
      // Refrescar lista de formularios si es necesario
    });

    newSocket.on('audienceForm:updated', (data) => {
      console.log('Form updated:', data);
      // Refrescar formulario específico si es necesario
    });

    newSocket.on('audienceForm:deleted', (data) => {
      console.log('Form deleted:', data);
      set(state => ({
        forms: state.forms.filter(form => form._id !== data.formId)
      }));
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  }
}));