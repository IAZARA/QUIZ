import React, { useState, useEffect } from 'react';
import { Participant } from '../types';
import { useQuestionStore } from '../store/questionStore';
import { Users, RefreshCw, Loader2, Info } from 'lucide-react'; // Added Users, RefreshCw, Loader2, Info

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

  // Ordenar participantes por puntos (de mayor a menor) y limitar a los 16 mejores
  const topParticipants = [...participants]
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, 16);
  
  // Total de participantes para mostrar información
  const totalParticipants = participants.length;
    
  return (
    <div className={`bg-bg-primary rounded-lg shadow-md p-4 text-text-primary ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Ranking de Participantes</h3>
        <button 
          onClick={() => loadParticipants()}
          className="text-accent hover:brightness-125 text-sm flex items-center transition-colors duration-200 px-2 py-1 rounded hover:bg-bg-tertiary"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="animate-spin h-4 w-4 mr-1" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Actualizar
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 animate-fadeIn"> {/* Semantic error color kept */}
          {error}
        </div>
      )}
      
      {participants.length === 0 && !loading ? (
        <div className="text-center py-12 text-text-secondary bg-bg-secondary rounded-lg border border-border-color">
          <Users className="mx-auto h-12 w-12 text-text-secondary opacity-75 mb-3" />
          <h3 className="text-lg font-medium text-text-primary mb-1">No Hay Participantes</h3>
          <p className="text-sm text-text-secondary">Cuando los participantes se registren, aparecerán aquí.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="text-sm text-text-secondary mb-3 flex items-center">
            <Info className="w-4 h-4 mr-1 text-accent" />
            Mostrando los 16 mejores de {totalParticipants} participantes
          </div>
          <div className="bg-bg-primary rounded-lg overflow-hidden border border-border-color">
            <table className="min-w-full divide-y divide-border-color">
              <thead className="bg-bg-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Pos.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Participante
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Puntos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Resp. Correctas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Tiempo Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-bg-primary divide-y divide-border-color">
                {topParticipants.map((participant, index) => (
                  <tr 
                    key={participant._id} 
                    className={`transition-colors duration-150 hover:bg-bg-tertiary ${index < 3 ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''}`} // Semantic color for top 3 kept
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`
                          w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium shadow-sm
                          ${index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900' :  // Semantic color kept
                            index === 1 ? 'bg-gradient-to-br from-gray-100 to-gray-300 text-gray-700' :  // Semantic color kept
                            index === 2 ? 'bg-gradient-to-br from-yellow-600 to-yellow-800 text-yellow-100' :  // Semantic color kept
                            'bg-bg-tertiary text-text-secondary'}
                        `}>
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-text-primary">
                        {participant.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-semibold text-accent">
                        {participant.points || 0}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-text-secondary flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-1 ${(participant.correctAnswers || 0) > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></span> {/* Semantic color kept */}
                        {participant.correctAnswers || 0}/{participant.totalAnswers || 0}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-text-secondary">
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
      
      <div className="mt-4 text-xs text-text-secondary">
        <p>El ranking se actualiza automáticamente cada 5 segundos. Última actualización: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default ParticipantRanking; 