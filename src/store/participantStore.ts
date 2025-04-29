import { create } from 'zustand';
import { ParticipantState, Participant } from '../types';
import io from 'socket.io-client';

let socket: ReturnType<typeof io> | null = null;

// Inicializar socket.io para escuchar eventos
if (typeof window !== 'undefined' && !socket) {
  socket = io({
    path: '/socket.io',
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
}

export const useParticipantStore = create<ParticipantState>((set) => ({
  currentParticipant: null,
  isRegistered: false,
  
  registerParticipant: async (name: string) => {
    try {
      if (!name.trim()) {
        throw new Error('El nombre no puede estar vacío');
      }
      
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar participante');
      }
      
      // Guardar participante en localStorage
      localStorage.setItem('quiz_participant', JSON.stringify(data));
      
      set({ 
        currentParticipant: data,
        isRegistered: true,
      });
      
      return true;
    } catch (error) {
      console.error('Error al registrar participante:', error);
      return false;
    }
  },
  
  logout: () => {
    // Eliminar participante de localStorage
    localStorage.removeItem('quiz_participant');
    
    set({
      currentParticipant: null,
      isRegistered: false,
    });
  },
  
  resetSession: () => {
    // Eliminar participante de localStorage
    localStorage.removeItem('quiz_participant');
    
    // Actualizar el estado
    set({
      currentParticipant: null,
      isRegistered: false,
    });
    
    // Mostrar mensaje al usuario
    if (typeof window !== 'undefined') {
      alert('La sesión ha sido reiniciada por el administrador. Por favor, regístrate nuevamente.');
    }
    
    // Redirigir a la página de registro
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.location.href = '/';
    }
  }
}));

// Inicializar el estado de participante desde localStorage
if (typeof window !== 'undefined') {
  const storedParticipant = localStorage.getItem('quiz_participant');
  
  if (storedParticipant) {
    try {
      const participant = JSON.parse(storedParticipant) as Participant;
      
      useParticipantStore.setState({
        currentParticipant: participant,
        isRegistered: true,
      });
    } catch (error) {
      console.error('Error al recuperar el participante del localStorage:', error);
      localStorage.removeItem('quiz_participant');
    }
  }
  
  // Configurar socket para escuchar el evento session_reset
  if (socket) {
    socket.on('session_reset', () => {
      useParticipantStore.getState().resetSession();
    });
  }
} 