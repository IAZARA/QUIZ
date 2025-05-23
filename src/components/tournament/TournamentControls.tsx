import React, { useState } from 'react';
import { Play, Trophy, AlertTriangle, ArrowRight, Users } from 'lucide-react';
import { TournamentMatch, Participant } from '../../types';
import { playSound } from '../../utils/soundManager';

interface TournamentControlsProps {
  participants: Participant[];
  currentMatch: TournamentMatch | null;
  isActive: boolean;
  onStartTournament: (participantIds: string[]) => void;
  onAdvanceParticipant: (matchId: string, winnerId: string) => void;
}

const TournamentControls: React.FC<TournamentControlsProps> = ({ 
  participants,
  currentMatch,
  isActive,
  onStartTournament,
  onAdvanceParticipant
}) => {
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Ordenar participantes por puntos (mejores primero)
  const sortedParticipants = [...participants].sort((a, b) => (b.points || 0) - (a.points || 0));
  
  const handleParticipantToggle = (participantId: string) => {
    setSelectedParticipants(prev => {
      if (prev.includes(participantId)) {
        return prev.filter(id => id !== participantId);
      } else {
        // Limitar a 16 participantes
        if (prev.length < 16) {
          return [...prev, participantId];
        }
        return prev;
      }
    });
  };
  
  const handleStartTournament = () => {
    // Limpiamos el modal
    setShowConfirmModal(false);
    
    // Empezamos con los participantes seleccionados
    onStartTournament(selectedParticipants);
    playSound('ui_click.mp3');
  };
  
  const handleAdvanceParticipant = (participantId: string) => {
    if (currentMatch) {
      onAdvanceParticipant(currentMatch.id, participantId);
      playSound('ui_click.mp3');
    }
  };
  
  if (!isActive) {
    // Mostrar pantalla de inicio de torneo
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-amber-500" /> 
            Torneo de Eliminación Directa
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Selecciona hasta 16 participantes para iniciar un torneo de eliminación directa.
          </p>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-700 flex items-center">
              <Users className="h-4 w-4 mr-1" /> 
              Selecciona los participantes ({selectedParticipants.length}/16)
            </h4>
            
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  // Seleccionar automáticamente los 16 mejores o todos si hay menos de 16
                  const top16 = sortedParticipants
                    .slice(0, 16)
                    .filter(p => p._id) // Asegurarse de que tienen ID
                    .map(p => p._id as string);
                    
                  // Si el número no es potencia de 2, reducir hasta encontrar el mayor número válido
                  let validCount = top16.length;
                  while (validCount > 0 && (validCount & (validCount - 1)) !== 0) {
                    validCount--;
                  }
                  
                  setSelectedParticipants(top16.slice(0, validCount));
                }}
                disabled={sortedParticipants.length < 2}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium flex items-center disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Users className="h-4 w-4 mr-1" />
                Seleccionar Top 16
              </button>
              
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={selectedParticipants.length < 2 || selectedParticipants.length > 16 || selectedParticipants.length % 2 !== 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium flex items-center disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Play className="h-4 w-4 mr-1" />
                Iniciar Torneo
              </button>
            </div>
          </div>
          
          {selectedParticipants.length > 0 && selectedParticipants.length < 2 && (
            <div className="bg-yellow-50 p-3 rounded-md mb-4 flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
              <p className="text-sm text-yellow-700">
                Se necesitan al menos 2 participantes para iniciar un torneo.
              </p>
            </div>
          )}
          
          {selectedParticipants.length > 0 && selectedParticipants.length % 2 !== 0 && (
            <div className="bg-yellow-50 p-3 rounded-md mb-4 flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
              <p className="text-sm text-yellow-700">
                El número de participantes debe ser par (2, 4, 8 o 16).
              </p>
            </div>
          )}
          
          <div className="mt-4 overflow-y-auto max-h-96 pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sortedParticipants.map((participant) => (
                <div 
                  key={participant._id} 
                  className={`
                    flex items-center justify-between p-3 rounded-md border 
                    transition-colors cursor-pointer 
                    ${selectedParticipants.includes(participant._id || '') 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:bg-gray-50'}
                  `}
                  onClick={() => participant._id && handleParticipantToggle(participant._id)}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm">
                      {selectedParticipants.indexOf(participant._id || '') + 1 || '-'}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700">{participant.name}</p>
                      <p className="text-xs text-gray-500">
                        {participant.points || 0} puntos · {participant.correctAnswers || 0} correctas
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <input 
                      type="checkbox" 
                      checked={selectedParticipants.includes(participant._id || '')} 
                      onChange={() => {}} 
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              ))}
            </div>
            
            {participants.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay participantes disponibles para seleccionar.
              </div>
            )}
          </div>
        </div>
        
        {/* Modal de confirmación */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar Inicio de Torneo</h3>
              <p className="text-gray-600 mb-4">
                Estás a punto de iniciar un torneo con {selectedParticipants.length} participantes. 
                El torneo continuará hasta que quede un solo ganador.
              </p>
              <div className="mt-6 flex justify-end space-x-3">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleStartTournament}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Iniciar Torneo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Si hay un torneo activo, mostrar controles para el partido actual
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-amber-500" /> 
          Control del Partido
        </h3>
      </div>
      
      <div className="p-6">
        {currentMatch ? (
          <div>
            <div className="text-sm text-gray-500 mb-4">
              Partido {currentMatch.matchNumber} - Selecciona el ganador para avanzar
            </div>
            
            <div className="space-y-3 mb-6">
              {currentMatch.participant1Id && (
                <div 
                  className={`
                    flex items-center justify-between p-4 rounded-md border-2 
                    transition-all cursor-pointer 
                    ${currentMatch.winnerId === currentMatch.participant1Id
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:bg-blue-50 hover:border-blue-300'}
                  `}
                  onClick={() => handleAdvanceParticipant(currentMatch.participant1Id)}
                >
                  <span className="font-medium">{currentMatch.participant1Name}</span>
                  <span className="text-gray-400">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </div>
              )}
              
              {currentMatch.participant2Id && (
                <div 
                  className={`
                    flex items-center justify-between p-4 rounded-md border-2 
                    transition-all cursor-pointer 
                    ${currentMatch.winnerId === currentMatch.participant2Id
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:bg-blue-50 hover:border-blue-300'}
                  `}
                  onClick={() => handleAdvanceParticipant(currentMatch.participant2Id)}
                >
                  <span className="font-medium">{currentMatch.participant2Name}</span>
                  <span className="text-gray-400">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </div>
              )}
            </div>
            
            {currentMatch.winnerId && (
              <div className="bg-green-50 p-3 rounded-md flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="ml-3 text-sm text-green-700">
                  El ganador avanzará a la siguiente ronda.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No hay partidos activos en este momento.
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentControls;