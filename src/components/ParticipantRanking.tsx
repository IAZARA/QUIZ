import React, { useState, useEffect } from 'react';
import { Participant } from '../types';
import { useQuestionStore } from '../store/questionStore';

type ParticipantRankingProps = {
  className?: string;
}

const ParticipantRanking: React.FC<ParticipantRankingProps> = ({ className = '' }) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  
  // Obtener el estado de la pregunta activa para actualizar cuando cambie
  const { currentQuestion, timeRemaining } = useQuestionStore();

  // Función para cargar los participantes
  const loadParticipants = async () => {
    try {
      setLoading(true);
      // Usar endpoint con más detalles de puntuación
      const response = await fetch('/api/participants?detailed=true');
      if (!response.ok) {
        throw new Error(`Error al cargar participantes: ${response.status}`);
      }
      const data = await response.json();
      setParticipants(data);
      setError(null);
    } catch (err) {
      console.error('Error al cargar participantes:', err);
      setError('No se pudieron cargar los participantes. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar participantes al montar el componente
  useEffect(() => {
    loadParticipants();
  }, []);

  // Actualizar cuando cambie la pregunta activa o el tiempo restante llegue a cero
  useEffect(() => {
    // Si la pregunta está activa y el tiempo llega a cero o si la pregunta cambia a null
    // (se detiene la votación), actualizar los participantes
    if ((currentQuestion && timeRemaining === 0) || (!currentQuestion && timeRemaining === null)) {
      loadParticipants();
    }
  }, [currentQuestion, timeRemaining]);

  // Configurar actualización automática
  useEffect(() => {
    // Actualizar cada 10 segundos
    const interval = window.setInterval(() => {
      loadParticipants();
    }, 10000);
    
    setRefreshInterval(interval);
    
    // Limpiar intervalo al desmontar
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  // Función para formatear el tiempo
  const formatTime = (timeInSeconds: number | undefined) => {
    if (timeInSeconds === undefined) return '0s';
    
    if (timeInSeconds < 60) {
      return `${timeInSeconds}s`;
    } else {
      const minutes = Math.floor(timeInSeconds / 60);
      const seconds = timeInSeconds % 60;
      return `${minutes}m ${seconds}s`;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Ranking de Participantes</h3>
        <button 
          onClick={() => loadParticipants()}
          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          disabled={loading}
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Actualizar
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {participants.length === 0 && !loading ? (
        <div className="text-center py-8 text-gray-500">
          No hay participantes registrados todavía.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pos.
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participante
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puntos
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resp. Correctas
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiempo Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {participants.map((participant, index) => (
                <tr 
                  key={participant._id} 
                  className={index < 3 ? 'bg-yellow-50' : ''}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`
                        w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium
                        ${index === 0 ? 'bg-yellow-400 text-yellow-900' : 
                          index === 1 ? 'bg-gray-200 text-gray-700' : 
                          index === 2 ? 'bg-yellow-600 text-yellow-100' : 
                          'bg-gray-100 text-gray-500'}
                      `}>
                        {index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {participant.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-semibold">
                      {participant.points || 0}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {participant.correctAnswers || 0}/{participant.totalAnswers || 0}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {formatTime(participant.totalTime)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>El ranking se actualiza automáticamente cada 10 segundos. Última actualización: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default ParticipantRanking; 