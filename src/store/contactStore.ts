import { create } from 'zustand';
import { ContactState, Contact } from '../types';

export const useContactStore = create<ContactState>((set, get) => ({
  contacts: [],
  isContactsActive: false,
  error: null,
  
  addContact: async (contact) => {
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
  
  updateContact: async (id, updates) => {
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
  
  deleteContact: async (id) => {
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
      const response = await fetch('/api/contacts');
      
      if (!response.ok) {
        throw new Error('Error al cargar contactos');
      }
      
      const contacts = await response.json();
      set({ contacts, error: null });
    } catch (error) {
      console.error('Error al cargar contactos:', error);
      set({ error: error instanceof Error ? error.message : 'Error al cargar contactos' });
    }
  },
  
  activateContacts: async () => {
    try {
      const response = await fetch('/api/contacts/status/activate', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Error activating contacts');
      }
      set({ isContactsActive: true, error: null });
    } catch (error) {
      console.error('Error activating contacts:', error);
      set({ error: error instanceof Error ? error.message : 'Error activating contacts' });
    }
  },
  
  deactivateContacts: async () => {
    try {
      const response = await fetch('/api/contacts/status/deactivate', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Error deactivating contacts');
      }
      set({ isContactsActive: false, error: null });
    } catch (error) {
      console.error('Error deactivating contacts:', error);
      set({ error: error instanceof Error ? error.message : 'Error deactivating contacts' });
    }
  },
}));
