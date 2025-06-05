import { create } from 'zustand';
import { ContactState, Contact } from '../types';
import { getSocket } from '../utils/socketUtils';

export const useContactStore = create<ContactState>((set, get) => ({
  contacts: [],
  isContactsActive: false,
  error: null,
  
  // Inicializar listeners de WebSocket
  initializeSocketListeners: () => {
    const socket = getSocket();
    if (!socket) {
      console.warn('Socket no disponible al inicializar listeners de contactos');
      return;
    }
    
    console.log('Inicializando listeners de WebSocket para contactos');
    
    // Escuchar cambios en el estado de visibilidad de contactos
    const handleContactsStatus = (data: { isActive: boolean }) => {
      console.log('Evento contacts:status recibido:', data);
      set({ isContactsActive: data.isActive });
      
      // Si se activan los contactos, cargarlos automáticamente
      if (data.isActive) {
        console.log('Contactos activados, cargando lista...');
        get().loadContacts().then(contacts => {
          console.log('Contactos cargados:', contacts.length);
        }).catch(error => {
          console.error('Error al cargar contactos:', error);
        });
      }
    };
    
    // Configurar el listener
    socket.on('contacts:status', handleContactsStatus);
    
    // Limpiar listeners al desmontar
    return () => {
      if (socket) {
        socket.off('contacts:status', handleContactsStatus);
      }
    };
  },
  
  addContact: async (contact: Omit<Contact, '_id' | 'created_at'>) => {
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contact),
      });
      
      if (!response.ok) {
        throw new Error('Error al agregar contacto');
      }
      
      const newContact = await response.json();
      set(state => ({
        contacts: [...state.contacts, newContact],
        error: null,
      }));
    } catch (error) {
      console.error('Error al agregar contacto:', error);
      set({ error: error instanceof Error ? error.message : 'Error al agregar contacto' });
    }
  },
  
  updateContact: async (id: string, updates: Partial<Contact>) => {
    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Error al actualizar contacto');
      }
      
      const updatedContact = await response.json();
      set(state => ({
        contacts: state.contacts.map(c => c._id === id ? updatedContact : c),
        error: null,
      }));
    } catch (error) {
      console.error('Error al actualizar contacto:', error);
      set({ error: error instanceof Error ? error.message : 'Error al actualizar contacto' });
    }
  },
  
  deleteContact: async (id: string) => {
    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar contacto');
      }
      
      set(state => ({
        contacts: state.contacts.filter(c => c._id !== id),
        error: null,
      }));
    } catch (error) {
      console.error('Error al eliminar contacto:', error);
      set({ error: error instanceof Error ? error.message : 'Error al eliminar contacto' });
    }
  },
  
  loadContacts: async () => {
    try {
      console.log('Cargando contactos desde la API...');
      const response = await fetch('/api/contacts');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error al cargar contactos - Respuesta no exitosa:', response.status, errorText);
        throw new Error('Error al cargar contactos');
      }
      
      const contacts = await response.json();
      console.log('Contactos cargados:', contacts.length);
      set({ contacts, error: null });
      return contacts;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar contactos';
      console.error('Error al cargar contactos:', error);
      set({ error: errorMessage });
      return [];
    }
  },
  
  // Cargar contactos y configurar listeners al inicializar
  init: async (): Promise<Contact[]> => {
    console.log('Inicializando store de contactos...');
    const { loadContacts } = get();
    
    // Los listeners de WebSocket se configuran desde socketUtils.ts
    // para evitar duplicación con setupSocketListeners
    
    // Cargar contactos iniciales
    try {
      const contacts = await loadContacts();
      console.log('Contactos iniciales cargados:', contacts.length);
      return contacts;
    } catch (error) {
      console.error('Error al cargar contactos iniciales:', error);
      return [];
    }
  },
  
  activateContacts: async (): Promise<void> => {
    try {
      console.log('Activando vista de contactos...');
      const response = await fetch('/api/contacts/status/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error al activar contactos - Respuesta no exitosa:', response.status, errorText);
        throw new Error('Error al activar contactos');
      }
      
      console.log('Vista de contactos activada correctamente');
      set({ isContactsActive: true, error: null });
    } catch (error) {
      console.error('Error al activar contactos:', error);
      set({ 
        isContactsActive: false, 
        error: error instanceof Error ? error.message : 'Error al activar contactos' 
      });
      throw error; // Re-lanzar el error para que el llamador pueda manejarlo si es necesario
    }
  },
  
  deactivateContacts: async (): Promise<void> => {
    try {
      console.log('Desactivando vista de contactos...');
      const response = await fetch('/api/contacts/status/deactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error al desactivar contactos - Respuesta no exitosa:', response.status, errorText);
        throw new Error('Error al desactivar contactos');
      }
      
      console.log('Vista de contactos desactivada correctamente');
      set({ isContactsActive: false, error: null });
    } catch (error) {
      console.error('Error al desactivar contactos:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error al desactivar contactos' 
      });
      throw error; // Re-lanzar el error para que el llamador pueda manejarlo si es necesario
    }
  },
}));
