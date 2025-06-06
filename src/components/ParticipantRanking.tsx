import React, { useState, useEffect } from 'react';
import { Participant } from '../types';
import { useQuestionStore } from '../store/questionStore';
import { Users, RefreshCw, Loader2, Info, Medal, Award, Trophy } from 'lucide-react'; // Added medal icons

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

  // Forzar tema light para el ranking
  useEffect(() => {
    // Guardar el tema actual
    const currentTheme = document.body.getAttribute('data-theme');
    
    // Aplicar tema light al montar el componente
    document.body.setAttribute('data-theme', 'light');
    
    // Restaurar el tema original al desmontar
    return () => {
      if (currentTheme) {
        document.body.setAttribute('data-theme', currentTheme);
      } else {
        document.body.removeAttribute('data-theme');
      }
    };
  }, []);

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

  // Función para renderizar medallas para los primeros 3 lugares
  const renderMedal = (position: number) => {
    switch (position) {
      case 0: // Primer lugar - Oro
        return (
          <div className="relative">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 shadow-lg animate-pulse">
              <Trophy className="w-5 h-5 text-yellow-900 drop-shadow-sm" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-200 rounded-full animate-ping opacity-75"></div>
          </div>
        );
      case 1: // Segundo lugar - Plata
        return (
          <div className="relative">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 via-gray-300 to-gray-500 shadow-lg">
              <Medal className="w-5 h-5 text-gray-700 drop-shadow-sm" />
            </div>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
          </div>
        );
      case 2: // Tercer lugar - Bronce
        return (
          <div className="relative">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 shadow-lg">
              <Award className="w-5 h-5 text-amber-100 drop-shadow-sm" />
            </div>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
          </div>
        );
      default: // Resto de posiciones
        return (
          <span className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium shadow-sm bg-gray-100 text-gray-600">
            {position + 1}
          </span>
        );
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
    <div className={`bg-white rounded-lg shadow-md p-4 text-gray-900 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Ranking de Participantes</h3>
        <button
          onClick={() => loadParticipants()}
          className="text-blue-600 hover:text-blue-700 text-sm flex items-center transition-colors duration-200 px-2 py-1 rounded hover:bg-gray-100"
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
        <div className="text-center py-12 text-gray-600 bg-gray-50 rounded-lg border border-gray-200">
          <Users className="mx-auto h-12 w-12 text-gray-400 opacity-75 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Hay Participantes</h3>
          <p className="text-sm text-gray-600">Cuando los participantes se registren, aparecerán aquí.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="text-sm text-gray-600 mb-3 flex items-center">
            <Info className="w-4 h-4 mr-1 text-blue-600" />
            Mostrando los 16 mejores de {totalParticipants} participantes
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
                    className={`transition-colors duration-150 hover:bg-gray-50 ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-25 border-l-4 border-yellow-400' :
                      index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-25 border-l-4 border-gray-400' :
                      index === 2 ? 'bg-gradient-to-r from-amber-50 to-amber-25 border-l-4 border-amber-600' :
                      ''
                    }`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        {renderMedal(index)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        index === 0 ? 'text-yellow-800 font-bold text-base' :
                        index === 1 ? 'text-gray-700 font-semibold' :
                        index === 2 ? 'text-amber-800 font-semibold' :
                        'text-gray-900'
                      }`}>
                        {participant.name}
                        {index === 0 && <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">🏆 Campeón</span>}
                        {index === 1 && <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">🥈 2do Lugar</span>}
                        {index === 2 && <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full">🥉 3er Lugar</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${
                        index === 0 ? 'text-yellow-600 text-lg font-bold' :
                        index === 1 ? 'text-gray-600 text-base font-bold' :
                        index === 2 ? 'text-amber-600 text-base font-bold' :
                        'text-blue-600'
                      }`}>
                        {participant.points || 0}
                        {index < 3 && <span className="text-xs ml-1">pts</span>}
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