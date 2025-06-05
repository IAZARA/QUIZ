import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export interface SharedLink {
  _id?: string;
  title: string;
  url: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface LinkSharingState {
  // Estado
  links: SharedLink[];
  activeLink: SharedLink | null;
  isLinkSharingActive: boolean;
  socket: Socket | null;
  
  // Acciones
  setLinks: (links: SharedLink[]) => void;
  addLink: (link: SharedLink) => void;
  updateLink: (id: string, updates: Partial<SharedLink>) => void;
  deleteLink: (id: string) => void;
  setActiveLink: (link: SharedLink | null) => void;
  setIsLinkSharingActive: (isActive: boolean) => void;
  
  // Funciones de API
  loadLinks: () => Promise<void>;
  createLink: (linkData: Omit<SharedLink, '_id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLinkById: (id: string, updates: Partial<SharedLink>) => Promise<void>;
  deleteLinkById: (id: string) => Promise<void>;
  activateLinkSharing: () => Promise<void>;
  deactivateLinkSharing: () => Promise<void>;
  shareLink: (linkId: string) => Promise<void>;
  shareAllLinks: () => Promise<void>;
  stopSharingLink: () => Promise<void>;
  
  // Socket
  initializeSocket: () => void;
  initializeSocketListeners: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useLinkSharingStore = create<LinkSharingState>((set, get) => ({
  // Estado inicial
  links: [],
  activeLink: null,
  isLinkSharingActive: false,
  socket: null,

  // Setters
  setLinks: (links) => set({ links }),
  addLink: (link) => set((state) => {
    // Evitar duplicados
    const exists = state.links.some(existingLink => existingLink._id === link._id);
    if (exists) {
      return state;
    }
    return { links: [...state.links, link] };
  }),
  updateLink: (id, updates) => set((state) => ({
    links: state.links.map(link => 
      link._id === id ? { ...link, ...updates } : link
    )
  })),
  deleteLink: (id) => set((state) => ({
    links: state.links.filter(link => link._id !== id)
  })),
  setActiveLink: (link) => set({ activeLink: link }),
  setIsLinkSharingActive: (isActive) => set({ isLinkSharingActive: isActive }),

  // Funciones de API
  loadLinks: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/links`);
      if (response.ok) {
        const links = await response.json();
        set({ links });
      }
    } catch (error) {
      console.error('Error loading links:', error);
    }
  },

  createLink: async (linkData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...linkData,
          createdAt: new Date(),
          updatedAt: new Date()
        }),
      });

      if (response.ok) {
        const newLink = await response.json();
        // No agregamos aquí porque el socket event lo hará
        // get().addLink(newLink);
      }
    } catch (error) {
      console.error('Error creating link:', error);
      throw error;
    }
  },

  updateLinkById: async (id, updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/links/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updates,
          updatedAt: new Date()
        }),
      });

      if (response.ok) {
        const updatedLink = await response.json();
        get().updateLink(id, updatedLink);
      }
    } catch (error) {
      console.error('Error updating link:', error);
      throw error;
    }
  },

  deleteLinkById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/links/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        get().deleteLink(id);
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      throw error;
    }
  },

  activateLinkSharing: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/links/status/activate`, {
        method: 'POST',
      });

      if (response.ok) {
        set({ isLinkSharingActive: true });
      }
    } catch (error) {
      console.error('Error activating link sharing:', error);
      throw error;
    }
  },

  deactivateLinkSharing: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/links/status/deactivate`, {
        method: 'POST',
      });

      if (response.ok) {
        set({ isLinkSharingActive: false, activeLink: null });
      }
    } catch (error) {
      console.error('Error deactivating link sharing:', error);
      throw error;
    }
  },

  shareLink: async (linkId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/links/${linkId}/share`, {
        method: 'POST',
      });

      if (response.ok) {
        const sharedLink = await response.json();
        set({ activeLink: sharedLink, isLinkSharingActive: true });
      }
    } catch (error) {
      console.error('Error sharing link:', error);
      throw error;
    }
  },

  shareAllLinks: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/links/share-all`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        set({ isLinkSharingActive: true });
        // El activeLink se mantendrá como null para indicar que se están compartiendo todos
      }
    } catch (error) {
      console.error('Error sharing all links:', error);
      throw error;
    }
  },

  stopSharingLink: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/links/stop-sharing`, {
        method: 'POST',
      });

      if (response.ok) {
        set({ activeLink: null });
      }
    } catch (error) {
      console.error('Error stopping link sharing:', error);
      throw error;
    }
  },

  // Socket
  initializeSocket: () => {
    const socket = io(API_BASE_URL);
    set({ socket });
    get().initializeSocketListeners();
  },

  initializeSocketListeners: () => {
    const { socket } = get();
    if (!socket) return;

    socket.on('link:status', (data: { isActive: boolean }) => {
      set({ isLinkSharingActive: data.isActive });
    });

    socket.on('link:shared', (data: { link: SharedLink }) => {
      set({ activeLink: data.link, isLinkSharingActive: true });
    });

    socket.on('link:stopped', () => {
      set({ activeLink: null });
    });

    socket.on('link:created', (link: SharedLink) => {
      get().addLink(link);
    });

    socket.on('link:updated', (link: SharedLink) => {
      if (link._id) {
        get().updateLink(link._id, link);
      }
    });

    socket.on('link:deleted', (linkId: string) => {
      get().deleteLink(linkId);
    });
  },
}));