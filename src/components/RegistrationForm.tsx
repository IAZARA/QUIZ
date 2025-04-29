import React, { useState } from 'react';
import { useParticipantStore } from '../store/participantStore';

const RegistrationForm: React.FC = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const registerParticipant = useParticipantStore(state => state.registerParticipant);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Por favor, introduce tu nombre');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const success = await registerParticipant(name);
      
      if (!success) {
        setError('Error al registrar. Puede que este nombre ya esté en uso.');
      }
    } catch (err) {
      setError('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Registro de Participante
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Tu Nombre
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Escribe tu nombre aquí"
            disabled={loading}
            autoComplete="off"
          />
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
            {error}
          </div>
        )}
        
        <div className="mt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registrando...' : 'Ingresar al Quiz'}
          </button>
        </div>
      </form>
      
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>Tu nombre será visible para todos los participantes en la tabla de clasificación.</p>
      </div>
    </div>
  );
};

export default RegistrationForm; 