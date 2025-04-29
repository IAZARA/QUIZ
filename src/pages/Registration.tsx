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
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Bienvenido al Quiz
        </h1>
        <p className="text-center text-gray-600 mt-2">
          Regístrate para comenzar a participar
        </p>
      </div>

      <RegistrationForm />
    </div>
  );
};

export default Registration; 