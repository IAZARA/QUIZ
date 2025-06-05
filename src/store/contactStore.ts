import { create } from 'zustand';
import { ContactState, Contact, ContactMethod } from '../types';
import io from 'socket.io-client';

// Variable para almacenar la instancia del socket
let socket: any = null;

export const useContactStore = create<ContactState>((set, get) => ({
  contacts: [],
  isContactsActive: false,
  error: null,
  
  // Inicializar listeners de WebSocket
  initializeSocketListeners: () => {
    if (!socket) {
      socket = io({
        path: '/socket.io',
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        console.log('Contacts Socket connected');
      });

      socket.on('disconnect', () => {
        console.log('Contacts Socket disconnected');
      });

      socket.on('contacts:status', (data: { isActive: boolean }) => {
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
      });
    }
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
    const { loadContacts, initializeSocketListeners } = get();
    
    // Configurar listeners de WebSocket
    const cleanup = initializeSocketListeners();
    
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

  // Funciones para métodos de contacto
  addContactMethod: async (contactId: string, method: Omit<ContactMethod, '_id'>) => {
    try {
      console.log('Agregando método de contacto:', { contactId, method });
      const response = await fetch(`/api/contacts/${contactId}/methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(method),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error al agregar método de contacto - Respuesta:', response.status, errorText);
        throw new Error('Error al agregar método de contacto');
      }
      
      const updatedContact = await response.json();
      console.log('Contacto actualizado recibido:', updatedContact);
      
      set(state => ({
        contacts: state.contacts.map(c => c._id === contactId ? updatedContact : c),
        error: null,
      }));
      
      // Recargar contactos para asegurar sincronización
      await get().loadContacts();
    } catch (error) {
      console.error('Error al agregar método de contacto:', error);
      set({ error: error instanceof Error ? error.message : 'Error al agregar método de contacto' });
      throw error;
    }
  },

  updateContactMethod: async (contactId: string, methodId: string, updates: Partial<ContactMethod>) => {
    try {
      console.log('Actualizando método de contacto:', { contactId, methodId, updates });
      const response = await fetch(`/api/contacts/${contactId}/methods/${methodId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error al actualizar método de contacto - Respuesta:', response.status, errorText);
        throw new Error('Error al actualizar método de contacto');
      }
      
      const updatedContact = await response.json();
      console.log('Contacto actualizado recibido:', updatedContact);
      
      set(state => ({
        contacts: state.contacts.map(c => c._id === contactId ? updatedContact : c),
        error: null,
      }));
      
      // Recargar contactos para asegurar sincronización
      await get().loadContacts();
    } catch (error) {
      console.error('Error al actualizar método de contacto:', error);
      set({ error: error instanceof Error ? error.message : 'Error al actualizar método de contacto' });
      throw error;
    }
  },

  deleteContactMethod: async (contactId: string, methodId: string) => {
    try {
      console.log('Eliminando método de contacto:', { contactId, methodId });
      const response = await fetch(`/api/contacts/${contactId}/methods/${methodId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error al eliminar método de contacto - Respuesta:', response.status, errorText);
        throw new Error('Error al eliminar método de contacto');
      }
      
      const updatedContact = await response.json();
      console.log('Contacto actualizado recibido:', updatedContact);
      
      set(state => ({
        contacts: state.contacts.map(c => c._id === contactId ? updatedContact : c),
        error: null,
      }));
      
      // Recargar contactos para asegurar sincronización
      await get().loadContacts();
    } catch (error) {
      console.error('Error al eliminar método de contacto:', error);
      set({ error: error instanceof Error ? error.message : 'Error al eliminar método de contacto' });
      throw error;
    }
  },
}));
