import React from 'react';
import { Navigate } from 'react-router-dom';
import RegistrationForm from '../components/RegistrationForm';
import { useParticipantStore } from '../store/participantStore';

const Registration: React.FC = () => {
  const isRegistered = useParticipantStore(state => state.isRegistered);

  // Si el usuario ya está registrado, redirigir a la vista del quiz
  if (isRegistered) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-800 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500 rounded-full opacity-10"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-400 rounded-full opacity-10"></div>
        <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-indigo-300 rounded-full opacity-10"></div>
        <div className="absolute bottom-1/4 left-1/3 w-36 h-36 bg-pink-400 rounded-full opacity-10"></div>
      </div>
      
      {/* Contenido principal */}
      <div className="z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Bienvenido al Quiz
          </h1>
          <p className="text-blue-100 text-lg">
            Regístrate para comenzar a participar
          </p>
        </div>

        <RegistrationForm />
      </div>
    </div>
  );
};

export default Registration; 