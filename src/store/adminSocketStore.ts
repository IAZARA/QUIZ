import { create } from 'zustand';
import io, { Socket } from 'socket.io-client';

interface AdminSocketState {
  socket: Socket | null;
  isConnected: boolean; // To explicitly track connection status
  connectAdminSocket: () => void;
  disconnectAdminSocket: () => void;
  joinRoom: (room: string) => void; // Generic function to join a room
}

export const useAdminSocketStore = create<AdminSocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  connectAdminSocket: () => {
    if (get().socket && get().isConnected) {
      console.log('Admin socket already connected and status is connected.');
      return;
    }

    // Disconnect existing socket if present but not marked as connected, or if creating a new one
    if (get().socket) {
        console.log('Disconnecting existing admin socket before creating a new one.');
        get().socket!.disconnect();
    }

    const newSocket = io({
      path: '/socket.io', // Standard path
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      timeout: 10000, // Optional: connection timeout
      // transports: ['websocket'], // Optional: force websocket if desired
      autoConnect: true, // Explicitly true, though default
    });

    newSocket.on('connect', () => {
      console.log('Admin socket connected successfully:', newSocket.id);
      set({ socket: newSocket, isConnected: true });
      // Automatically join the default Q&A admin room upon connection.
      // Specific components can call joinRoom for other rooms if needed.
      newSocket.emit('join_admin_qa_room'); 
      console.log('Admin socket joined admin_qa_room.');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Admin socket disconnected:', reason);
      set({ socket: null, isConnected: false });
    });

    newSocket.on('connect_error', (error) => {
      console.error('Admin socket connection error:', error);
      // Ensure socket is nullified on error to allow reconnection attempts by UI
      if (get().socket?.id === newSocket.id) { // only update if it's the current socket
        set({ socket: null, isConnected: false });
      }
    });
    
    newSocket.on('reconnect_attempt', (attempt) => {
        console.log(`Admin socket reconnect attempt ${attempt}`);
    });

    newSocket.on('reconnect_failed', () => {
        console.error('Admin socket reconnection failed.');
        set({ socket: null, isConnected: false });
    });
    
    // Set the socket instance in the store immediately. 
    // isConnected flag will be updated by event handlers.
    // This allows UI to access the socket object for attaching listeners,
    // even if the connection is pending.
    set({ socket: newSocket, isConnected: false });
  },

  disconnectAdminSocket: () => {
    const currentSocket = get().socket;
    if (currentSocket) {
      console.log('Disconnecting admin socket via store action.');
      currentSocket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  joinRoom: (room: string) => {
    const currentSocket = get().socket;
    if (currentSocket && get().isConnected) {
      currentSocket.emit('join_room', room); // A generic 'join_room' event
      console.log(`Admin socket emitted join_room for ${room}`);
    } else {
      console.warn(`Admin socket not connected or available, cannot join room ${room}.`);
    }
  },
}));
