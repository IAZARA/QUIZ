import { Socket } from 'socket.io-client';
import { IDocument } from '../types';

// Añadir el socket a la interfaz Window global
declare global {
  interface Window {
    socketInstance: Socket | undefined;
  }
}

/**
 * Obtiene la instancia actual del socket
 */
export const getSocket = (): Socket | undefined => {
  return window.socketInstance;
};

/**
 * Interfaz para las funciones de actualización de estado de las tiendas
 */
export interface SocketStores {
  setQuizConfig: (state: { isRankingVisible?: boolean }) => void;
  setWordCloud: (state: { isActive?: boolean; words?: any }) => void;
  setContact: (state: { isContactsActive?: boolean }) => void;
  setAudienceQA: (state: { isAudienceQAActive?: boolean }) => void;
  setDocumentSharing: (state: { isDocumentsActive?: boolean; documents?: IDocument[] }) => void;
  setAudienceData: (state: { isActive?: boolean }) => void;
  setReviews: (state: { isReviewsActive?: boolean }) => void;
}

/**
 * Configura los listeners para los eventos de Socket.IO
 * @param stores Objeto con las funciones setState de las diferentes tiendas
 */
export const setupSocketListeners = (stores: SocketStores, retryCount: number = 0) => {
  const socket = getSocket();
  if (!socket) {
    // Si el socket no está disponible, intentar de nuevo después de un breve delay
    // Máximo 50 intentos (5 segundos)
    if (retryCount < 50) {
      setTimeout(() => setupSocketListeners(stores, retryCount + 1), 100);
    } else {
      console.warn('No se pudo establecer conexión con el socket después de múltiples intentos');
    }
    return;
  }

  // Eventos para el ranking
  socket.on('show_ranking', () => {
    console.log('Recibido evento para mostrar ranking');
    stores.setQuizConfig({ isRankingVisible: true });
  });

  socket.on('hide_ranking', () => {
    console.log('Recibido evento para ocultar ranking');
    stores.setQuizConfig({ isRankingVisible: false });
  });

  // Eventos para la nube de palabras
  socket.on('wordcloud:status', (data: { isActive: boolean }) => {
    console.log('Recibido evento de estado de nube de palabras:', data);
    stores.setWordCloud({ isActive: data.isActive });
  });

  socket.on('wordcloud:update', (words: any) => {
    console.log('Recibida actualización de nube de palabras');
    stores.setWordCloud({ words });
  });

  // Eventos para contactos
  socket.on('contacts:status', (data: { isActive: boolean }) => {
    console.log('Received contacts:status event:', data);
    stores.setContact({ isContactsActive: data.isActive });
  });

  // Eventos para preguntas y respuestas de la audiencia
  socket.on('audienceQA:status', (data: { isActive: boolean }) => {
    console.log('Received audienceQA:status event:', data);
    stores.setAudienceQA({ isAudienceQAActive: data.isActive });
  });

  // Eventos para documentos compartidos
  socket.on('documents:status', (data: { isActive: boolean }) => {
    console.log('Received documents:status event:', data);
    stores.setDocumentSharing({ isDocumentsActive: data.isActive });
  });

  socket.on('documents:list_update', (updatedDocuments: IDocument[]) => {
    console.log('Received documents:list_update event:', updatedDocuments);
    stores.setDocumentSharing({ documents: updatedDocuments });
  });

  // Eventos para datos de audiencia
  socket.on('audienceData:status', (data: { isActive: boolean }) => {
    console.log('Recibido evento de estado de datos de audiencia:', data);
    stores.setAudienceData({ isActive: data.isActive });
  });

  // Eventos para reviews
  socket.on('reviews:status', (data: { isActive: boolean }) => {
    console.log('Recibido evento de estado de reviews:', data);
    stores.setReviews({ isReviewsActive: data.isActive });
  });
};

/**
 * Limpia los listeners de Socket.IO
 */
export const cleanupSocketListeners = () => {
  const socket = getSocket();
  if (!socket) return;

  socket.off('show_ranking');
  socket.off('hide_ranking');
  socket.off('wordcloud:status');
  socket.off('wordcloud:update');
  socket.off('contacts:status');
  socket.off('audienceQA:status');
  socket.off('documents:status');
  socket.off('documents:list_update');
  socket.off('audienceData:status');
  socket.off('reviews:status');
};
