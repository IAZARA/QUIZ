import React, { useState, useEffect, useMemo } from 'react';
import { Play, Trophy, AlertTriangle, ArrowRight, Users, PlayCircle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { TournamentMatch, Participant, Tournament, TournamentRound } from '../../types'; // Assuming Tournament type is available
import { Button } from '@/components/ui/button'; // Assuming Button component path

interface TournamentControlsProps {
  participants: Participant[];
  selectedMatch: TournamentMatch | null; // Renamed from currentMatch for clarity
  isActive: boolean;
  onStartTournament: (participantIds: string[]) => void;
  onAdvanceParticipant: (matchId: string, winnerId: string) => void;
  tournamentId: string | null; // Added
  activeTournament: Tournament | null; // Added
  isAdmin?: boolean; // Added
}

const TournamentControls: React.FC<TournamentControlsProps> = ({ 
  participants,
  selectedMatch, // Renamed
  isActive,
  onStartTournament,
  onAdvanceParticipant,
  tournamentId,
  activeTournament,
  isAdmin = false, // Default to false
}) => {
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isStartingQuestions, setIsStartingQuestions] = useState(false);
  const [startQuestionsError, setStartQuestionsError] = useState<string | null>(null);
  const [startQuestionsSuccess, setStartQuestionsSuccess] = useState<string | null>(null);
  
  // Ordenar participantes por puntos (mejores primero)
  const sortedParticipants = [...participants].sort((a, b) => (b.points || 0) - (a.points || 0));

  const selectedMatchRoundNumber = useMemo(() => {
    if (!selectedMatch || !activeTournament || !activeTournament.rounds) return null;
    for (const round of activeTournament.rounds) {
      if (round.matches.some(m => m.id === selectedMatch.id)) {
        return round.roundNumber;
      }
    }
    return null;
  }, [selectedMatch, activeTournament]);

  const selectedMatchRoundHasQuestions = useMemo(() => {
    if (!selectedMatchRoundNumber || !activeTournament || !activeTournament.rounds) return false;
    const currentRound = activeTournament.rounds.find(r => r.roundNumber === selectedMatchRoundNumber);
    return !!currentRound && !!currentRound.questions && currentRound.questions.length > 0;
  }, [selectedMatchRoundNumber, activeTournament]);

  const canStartQuestions = isAdmin && 
                            selectedMatch && 
                            selectedMatch.status === 'ready' && // Assuming 'ready' is the status before questions
                            selectedMatchRoundHasQuestions;

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
  };
  
  const handleAdvanceParticipant = (participantId: string) => {
    if (selectedMatch) { // Use selectedMatch
      onAdvanceParticipant(selectedMatch.id, participantId);
    }
  };

  const handleStartQuestionPhase = async () => {
    if (!canStartQuestions || !selectedMatch || !selectedMatchRoundNumber || !tournamentId) return;

    setIsStartingQuestions(true);
    setStartQuestionsError(null);
    setStartQuestionsSuccess(null);

    try {
      const response = await fetch(`/api/tournament/round/${selectedMatchRoundNumber}/match/${selectedMatch.matchNumber}/start-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Body can be empty or include tournamentId if API requires it, though current backend route doesn't use it from body
        // body: JSON.stringify({ tournamentId }) 
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || `Error ${response.status}`);
      }
      setStartQuestionsSuccess(`Question phase started for Match ${selectedMatch.matchNumber}.`);
      // Backend will emit event, store will update match status, disabling this button due to status change
    } catch (error: any) {
      setStartQuestionsError(error.message || 'Failed to start question phase.');
    } finally {
      setIsStartingQuestions(false);
    }
  };
  
  // Reset feedback messages when selectedMatch changes
  useEffect(() => {
    setStartQuestionsError(null);
    setStartQuestionsSuccess(null);
  }, [selectedMatch]);

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
        {selectedMatch ? ( // Use selectedMatch
          <div className="space-y-4">
            <div className="text-sm text-gray-500">
              Partido {selectedMatch.matchNumber} (Ronda {selectedMatchRoundNumber || 'N/A'})
              {selectedMatch.status === 'questions_active' && <span className="ml-2 font-semibold text-purple-600">(Fase de Preguntas Activa)</span>}
              {selectedMatch.status === 'completed' && <span className="ml-2 font-semibold text-green-600">(Completado)</span>}
              {selectedMatch.status === 'ready' && <span className="ml-2 font-semibold text-blue-600">(Listo para Iniciar)</span>}
            </div>
            
            {/* Admin: Advance Participant Manually */}
            {isAdmin && selectedMatch.status !== 'completed' && selectedMatch.participant1Id && selectedMatch.participant2Id && (
              <div className="space-y-3">
                 <p className="text-xs text-gray-500">Admin: Selecciona el ganador para avanzar (manual)</p>
                {selectedMatch.participant1Id && (
                  <Button 
                    variant="outline"
                    className={`w-full justify-between ${selectedMatch.winnerId === selectedMatch.participant1Id ? 'border-green-500 bg-green-50' : ''}`}
                    onClick={() => handleAdvanceParticipant(selectedMatch.participant1Id!)} // participantId is checked
                    disabled={!!selectedMatch.winnerId}
                  >
                    <span>{selectedMatch.participant1Name}</span>
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                )}
                
                {selectedMatch.participant2Id && (
                  <Button 
                    variant="outline"
                    className={`w-full justify-between ${selectedMatch.winnerId === selectedMatch.participant2Id ? 'border-green-500 bg-green-50' : ''}`}
                    onClick={() => handleAdvanceParticipant(selectedMatch.participant2Id!)} // participantId is checked
                    disabled={!!selectedMatch.winnerId}
                  >
                    <span>{selectedMatch.participant2Name}</span>
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                )}
              </div>
            )}
            {selectedMatch.winnerId && (
              <div className="bg-green-50 p-3 rounded-md flex items-start text-sm text-green-700">
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <p>Ganador: {selectedMatch.winnerId === selectedMatch.participant1Id ? selectedMatch.participant1Name : selectedMatch.participant2Name}. Avanzará a la siguiente ronda.</p>
              </div>
            )}

            {/* Admin: Start Question Phase */}
            {isAdmin && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-md font-semibold text-gray-700 mb-2">Fase de Preguntas</h4>
                {!selectedMatchRoundHasQuestions && selectedMatch.status === 'ready' && (
                    <div className="bg-yellow-50 p-3 rounded-md text-sm text-yellow-700 flex items-start">
                        <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                        No hay preguntas configuradas para la ronda {selectedMatchRoundNumber}. Agrega preguntas en el panel de administración.
                    </div>
                )}
                <Button
                  onClick={handleStartQuestionPhase}
                  disabled={!canStartQuestions || isStartingQuestions}
                  className="w-full sm:w-auto mt-2"
                >
                  {isStartingQuestions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                  {selectedMatch.status === 'questions_active' ? 'Fase de Preguntas Ya Iniciada' : 'Iniciar Fase de Preguntas'}
                </Button>
                {startQuestionsError && (
                  <div className="mt-2 text-sm text-red-600 flex items-center">
                    <XCircle className="h-4 w-4 mr-1 flex-shrink-0" /> {startQuestionsError}
                  </div>
                )}
                {startQuestionsSuccess && (
                  <div className="mt-2 text-sm text-green-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1 flex-shrink-0" /> {startQuestionsSuccess}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {isActive ? "Selecciona un partido del bracket para ver los controles." : "No hay partidos activos en este momento."}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentControls;

// Helper to define Tournament type structure for props, assuming it's not already globally available
// This would typically be in your types.ts or similar
// export interface Tournament {
//   _id: string;
//   rounds: TournamentRound[];
//   // other tournament properties
// }

// export interface TournamentRound {
//   roundNumber: number;
//   matches: TournamentMatch[];
//   questions?: any[]; // Define Question type properly if needed
// }