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
    // Actualizar inmediatamente cuando:
    // 1. La pregunta activa cambia 
    // 2. El temporizador llega a cero
    // 3. Se detiene la votación
    if (
      currentQuestion?.votingClosed || 
      (currentQuestion && timeRemaining === 0) || 
      (!currentQuestion && timeRemaining === null)
    ) {
      console.log('Actualizando ranking por cambio en estado de pregunta');
      loadParticipants();
    }
  }, [currentQuestion, timeRemaining, currentQuestion?.votingClosed]);

  // Configurar actualización automática periódica
  useEffect(() => {
    // Actualizar cada 5 segundos en lugar de 10 para mayor precisión
    const interval = window.setInterval(() => {
      console.log('Actualizando ranking automáticamente');
      loadParticipants();
    }, 5000);
    
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

  // Ordenar participantes por puntos (de mayor a menor) y limitar a los 15 mejores
  const topParticipants = [...participants]
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, 15);
  
  // Total de participantes para mostrar información
  const totalParticipants = participants.length;
    
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Ranking de Participantes</h3>
        <button 
          onClick={() => loadParticipants()}
          className="text-blue-600 hover:text-blue-800 text-sm flex items-center transition-colors duration-200 px-2 py-1 rounded hover:bg-blue-50"
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
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 animate-fadeIn">
          {error}
        </div>
      )}
      
      {participants.length === 0 && !loading ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p>No hay participantes registrados todavía.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="text-sm text-gray-500 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Mostrando los 15 mejores de {totalParticipants} participantes
          </div>
          <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
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
                {topParticipants.map((participant, index) => (
                  <tr 
                    key={participant._id} 
                    className={`transition-colors duration-150 hover:bg-gray-50 ${index < 3 ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''}`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`
                          w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium shadow-sm
                          ${index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900' : 
                            index === 1 ? 'bg-gradient-to-br from-gray-100 to-gray-300 text-gray-700' : 
                            index === 2 ? 'bg-gradient-to-br from-yellow-600 to-yellow-800 text-yellow-100' : 
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
                      <div className="text-sm font-semibold text-blue-600">
                        {participant.points || 0}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-600 flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-1 ${(participant.correctAnswers || 0) > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
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
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>El ranking se actualiza automáticamente cada 5 segundos. Última actualización: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default ParticipantRanking; 