import axios from 'axios';
import { io, Socket } from 'socket.io-client';

// URL base de la API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Cliente axios
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Nota: Usamos axios directamente para las subidas de archivos con FormData

// Socket.io para tiempo real
let socket: Socket | null = null;

export const connectSocket = () => {
  if (!socket) {
    socket = io(API_URL);
    
    socket.on('connect', () => {
      console.log('Conectado al servidor en tiempo real');
    });
    
    socket.on('disconnect', () => {
      console.log('Desconectado del servidor en tiempo real');
    });
  }
  
  return socket;
};

// Autenticación
export const login = async (password: string) => {
  try {
    const response = await apiClient.post('/api/auth/login', { password });
    return response.data;
  } catch (error) {
    console.error('Error de inicio de sesión:', error);
    throw error;
  }
};

// Preguntas
export const getQuestions = async () => {
  try {
    const response = await apiClient.get('/api/questions');
    return response.data;
  } catch (error) {
    console.error('Error al obtener preguntas:', error);
    throw error;
  }
};

export const getActiveQuestion = async () => {
  try {
    const response = await apiClient.get('/api/questions/active');
    return response.data;
  } catch (error) {
    console.error('Error al obtener pregunta activa:', error);
    throw error;
  }
};

interface QuestionInput {
  content: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option?: string;
  explanation?: string;
  explanation_image?: string;
  timer?: number;
  endTime?: Date | null;
  is_active?: boolean;
  votingClosed?: boolean;
}

export const createQuestion = async (question: QuestionInput) => {
  try {
    const response = await apiClient.post('/api/questions', question);
    return response.data;
  } catch (error) {
    console.error('Error al crear pregunta:', error);
    throw error;
  }
};

export const updateQuestion = async (id: string, updates: Partial<QuestionInput>) => {
  try {
    const response = await apiClient.put(`/api/questions/${id}`, updates);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar pregunta:', error);
    throw error;
  }
};

export const deleteQuestion = async (id: string) => {
  try {
    const response = await apiClient.delete(`/api/questions/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar pregunta:', error);
    throw error;
  }
};

export const startVoting = async (id: string) => {
  try {
    const response = await apiClient.post(`/api/questions/${id}/start`);
    return response.data;
  } catch (error) {
    console.error('Error al iniciar votación:', error);
    throw error;
  }
};

export const closeVoting = async (id: string) => {
  try {
    const response = await apiClient.post(`/api/questions/${id}/close`);
    return response.data;
  } catch (error) {
    console.error('Error al cerrar votación:', error);
    throw error;
  }
};

export const stopVoting = async (id: string, correctOption: string) => {
  try {
    const response = await apiClient.post(`/api/questions/${id}/stop`, { correctOption });
    return response.data;
  } catch (error) {
    console.error('Error al detener votación:', error);
    throw error;
  }
};

export const submitVote = async (questionId: string, option: string) => {
  try {
    // Generar o recuperar ID de votante
    let voterId = localStorage.getItem('voter_id');
    if (!voterId) {
      voterId = crypto.randomUUID();
      localStorage.setItem('voter_id', voterId);
    }
    
    const response = await apiClient.post(`/api/questions/${questionId}/vote`, {
      option,
      voter_id: voterId
    });
    
    return response.data;
  } catch (error) {
    console.error('Error al enviar voto:', error);
    throw error;
  }
};

// Limpiar la vista de audiencia
export const clearView = async () => {
  try {
    const response = await apiClient.post('/api/questions/clear');
    return response.data;
  } catch (error) {
    console.error('Error al limpiar la vista:', error);
    throw error;
  }
};

// Subir imagen
export const uploadImage = async (file: File) => {
  try {
    // Verificar el tamaño del archivo
    if (file.size > 19 * 1024 * 1024) { // 19MB para estar seguros
      throw new Error('El archivo es demasiado grande. El tamaño máximo es de 19MB.');
    }
    
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await axios.post(`${API_URL}/api/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error: any) {
    // Manejar errores específicos
    if (error.response && error.response.status === 413) {
      console.error('Error: El archivo es demasiado grande');
      throw new Error('El archivo es demasiado grande. El tamaño máximo es de 19MB.');
    }
    console.error('Error al subir la imagen:', error);
    throw error;
  }
};

// Eliminar imagen
export const deleteImage = async (filename: string) => {
  try {
    const response = await apiClient.delete(`/api/upload/${filename}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar la imagen:', error);
    throw error;
  }
};
