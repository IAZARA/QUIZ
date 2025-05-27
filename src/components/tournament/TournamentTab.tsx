import React, { useState, useEffect } from 'react';
import { Trophy, AlertTriangle, Users } from 'lucide-react';
import TournamentBracket from './TournamentBracket';
import TournamentControls from './TournamentControls';
import { useTournamentStore } from '../../store/tournamentStore';

interface TournamentTabProps {
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const TournamentTab: React.FC<TournamentTabProps> = ({ showNotification }) => {
  const {
    isActive,
    rounds,
    currentMatchId,
    participants,
    startTournament,
    advanceParticipant,
    selectMatch,
    loadParticipants,
    winner,
  } = useTournamentStore();
  
  const [loading, setLoading] = useState(true);
  
  // El partido actual basado en el currentMatchId
  const currentMatch = currentMatchId ? 
    rounds.flatMap(round => round.matches).find(match => match.id === currentMatchId) || null :
    null;
  
  // Cargar participantes cuando se monte el componente
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadParticipants();
      setLoading(false);
    };
    
    init();
  }, [loadParticipants]);
  
  // Manejadores de eventos
  const handleStartTournament = async (participantIds: string[]) => {
    try {
      await startTournament(participantIds);
      showNotification('Torneo iniciado correctamente', 'success');
    } catch (error) {
      console.error('Error al iniciar el torneo:', error);
      showNotification('Error al iniciar el torneo', 'error');
    }
  };
  
  const handleAdvanceParticipant = async (matchId: string, winnerId: string) => {
    try {
      await advanceParticipant(matchId, winnerId);
      showNotification('Participante avanzado a la siguiente ronda', 'success');
    } catch (error) {
      console.error('Error al avanzar participante:', error);
      showNotification('Error al avanzar participante', 'error');
    }
  };
  
  const handleSelectMatch = (matchId: string) => {
    selectMatch(matchId);
  };
  
  if (loading) {
    return (
      <div className="bg-bg-primary rounded-lg shadow-md p-6 flex items-center justify-center text-text-secondary">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 mb-4 rounded-full bg-bg-secondary"></div>
          <div className="h-4 bg-bg-secondary rounded w-48 mb-2"></div>
          <div className="h-3 bg-bg-secondary rounded w-32"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="px-4 py-5 sm:p-6 bg-bg-primary text-text-primary">
      <div className="flex flex-col lg:flex-row lg:space-x-6">
        {/* Columna izquierda - Bracket del torneo */}
        <div className="lg:flex-1 mb-6 lg:mb-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-text-primary flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-amber-500" />
              Torneo de Eliminación Directa
            </h2>
          </div>
          
          {winner && (
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-amber-500 p-4 mb-6 flex items-center"> {/* Semantic colors kept */}
              <div className="flex-shrink-0">
                <Trophy className="h-8 w-8 text-amber-500" /> {/* Semantic icon color kept */}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-amber-800">¡Tenemos un ganador!</p> {/* Semantic text color kept */}
                <p className="text-lg font-bold text-amber-900 mt-1">{winner.name}</p> {/* Semantic text color kept */}
              </div>
            </div>
          )}
          
          {isActive && rounds.length === 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 flex items-center"> {/* Semantic info colors kept */}
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-blue-500" /> {/* Semantic icon color kept */}
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700"> {/* Semantic text color kept */}
                  El torneo está configurándose. Por favor, espera un momento.
                </p>
              </div>
            </div>
          )}
          
          <div className="bg-bg-secondary rounded-lg shadow-md overflow-hidden">
            {rounds.length > 0 ? (
              <div className="p-4">
                <TournamentBracket 
                  rounds={rounds} 
                  currentMatchId={currentMatchId}
                  onSelectMatch={handleSelectMatch}
                />
              </div>
            ) : (
              <div className="p-8 text-center">
                <Trophy className="h-12 w-12 text-text-secondary opacity-50 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-text-primary mb-2">No hay torneos activos</h3>
                <p className="text-text-secondary">
                  {isActive
                    ? 'El torneo está siendo configurado...'
                    : 'Selecciona participantes y haz clic en "Iniciar Torneo"'}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Columna derecha - Controles del torneo */}
        <div className="lg:w-96">
          <TournamentControls 
            participants={participants}
            currentMatch={currentMatch}
            isActive={isActive}
            onStartTournament={handleStartTournament}
            onAdvanceParticipant={handleAdvanceParticipant}
          />
        </div>
      </div>
    </div>
  );
};

export default TournamentTab;