import { create } from 'zustand';
import { IDocument, DocumentSharingState } from '../types';

const API_BASE_URL = '/api/documents';

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
}));
