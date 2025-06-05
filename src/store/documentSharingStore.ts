import { create } from 'zustand';
import { IDocument, DocumentSharingState } from '../types';
import io from 'socket.io-client';

const API_BASE_URL = '/api/documents';

// Variable para almacenar la instancia del socket
let socket: any = null;

export const useDocumentSharingStore = create<DocumentSharingState>((set) => ({
  isDocumentsActive: false,
  documents: [],
  error: null,
  isLoading: false,

  activateDocumentsView: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/status/activate`, { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to parse error, default to empty object
        throw new Error(errorData.error || 'Failed to activate documents view');
      }
      set({ isDocumentsActive: true, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), isLoading: false, isDocumentsActive: false });
    }
  },

  deactivateDocumentsView: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/status/deactivate`, { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to parse error, default to empty object
        throw new Error(errorData.error || 'Failed to deactivate documents view');
      }
      set({ isDocumentsActive: false, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), isLoading: false, isDocumentsActive: true }); // Keep true if deactivation fails
    }
  },

  loadDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to parse error, default to empty object
        throw new Error(errorData.error || 'Failed to load documents');
      }
      const data: IDocument[] = await response.json();
      set({ documents: data, isLoading: false });
    } catch (err) {
      set({ documents: [], error: err instanceof Error ? err.message : String(err), isLoading: false });
    }
  },

  setDocuments: (documents: IDocument[]) => {
    set({ documents, error: null }); // Also clear error when documents are set externally
  },

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
        console.log('Documents Socket connected');
      });

      socket.on('disconnect', () => {
        console.log('Documents Socket disconnected');
      });

      socket.on('documents:status', (data: { isActive: boolean }) => {
        console.log('Evento documents:status recibido:', data);
        set({ isDocumentsActive: data.isActive });
        
        // Si se activan los documentos, cargarlos automáticamente
        if (data.isActive) {
          console.log('Documentos activados, cargando lista...');
          // Usar el método loadDocuments del store
          useDocumentSharingStore.getState().loadDocuments();
        }
      });

      socket.on('documents:list_update', (updatedDocuments: IDocument[]) => {
        console.log('Evento documents:list_update recibido:', updatedDocuments);
        set({ documents: updatedDocuments });
      });
    }
  },
}));
