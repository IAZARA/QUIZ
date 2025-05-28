import { useEffect } from 'react';
import io from 'socket.io-client';

interface SocketManagerProps {
  children: React.ReactNode;
}

/**
 * Componente que gestiona la conexión Socket.IO
 * Inicializa el socket y lo hace disponible globalmente
 */
const SocketManager: React.FC<SocketManagerProps> = ({ children }) => {
  useEffect(() => {
    // Crear un nuevo socket para escuchar eventos
    const socket = io({
      path: '/socket.io',
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Notificar que el participante se unió a la nube de palabras
    socket.emit('wordcloud:join');

    // Exportar el socket para que pueda ser utilizado por otros componentes
    window.socketInstance = socket;

    return () => {
      // Limpiar y desconectar el socket al desmontar
      socket.disconnect();
      delete window.socketInstance;
    };
  }, []);

  return <>{children}</>;
};

export default SocketManager;
