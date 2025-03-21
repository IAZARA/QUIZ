import { create } from 'zustand';
import { AuthState } from '../types';

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  signIn: async (password: string) => {
    try {
      // Verificar la contraseña con el valor de la variable de entorno
      const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
      
      if (!adminPassword) {
        console.error('La variable de entorno VITE_ADMIN_PASSWORD no está configurada');
        return false;
      }
      
      if (password === adminPassword) {
        set({ isAuthenticated: true });
        // Guardar el estado de autenticación en localStorage
        localStorage.setItem('quiz_auth', 'true');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      return false;
    }
  },
  signOut: () => {
    set({ isAuthenticated: false });
    // Eliminar el estado de autenticación de localStorage
    localStorage.removeItem('quiz_auth');
  },
}));

// Inicializar el estado de autenticación desde localStorage
if (typeof window !== 'undefined') {
  const isAuthenticated = localStorage.getItem('quiz_auth') === 'true';
  if (isAuthenticated) {
    useAuthStore.setState({ isAuthenticated: true });
  }
}