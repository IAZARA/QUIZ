import React from 'react';
import { Trophy, Clock } from 'lucide-react';
import { TournamentMatch, TournamentRound } from '../../types';

interface TournamentBracketProps {
  rounds: TournamentRound[];
  currentMatchId?: string | null;
  onSelectMatch?: (matchId: string) => void;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({ 
  rounds, 
  currentMatchId,
  onSelectMatch 
}) => {
  if (!rounds || rounds.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No hay información del torneo disponible.</p>
      </div>
    );
  }

  const maxRound = rounds.length;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="min-w-max flex items-start space-x-8 p-2">
        {rounds.map((round, roundIndex) => (
          <div key={round.id} className="flex flex-col space-y-4" style={{ minWidth: '240px' }}>
            <div className="text-center mb-2">
              <h3 className="font-bold text-gray-800 mb-1">
                {roundIndex === maxRound - 1 ? (
                  <span className="flex items-center justify-center text-amber-600">
                    <Trophy className="w-5 h-5 mr-1" /> Final
                  </span>
                ) : roundIndex === maxRound - 2 ? (
                  'Semifinal'
                ) : roundIndex === maxRound - 3 ? (
                  'Cuartos de Final'
                ) : (
                  `Ronda ${roundIndex + 1}`
                )}
              </h3>
              <div className="text-xs text-gray-500">{round.matches.length} enfrentamientos</div>
            </div>

            <div className="flex flex-col space-y-6">
              {round.matches.map((match) => {
                const isCurrent = match.id === currentMatchId;
                const isCompleted = !!match.winnerId;
                const isPending = !match.participant1Id || !match.participant2Id;
                
                return (
                  <div 
                    key={match.id}
                    className={`
                      border rounded-lg overflow-hidden shadow-sm transition-all 
                      ${isCurrent ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'}
                      ${isCompleted ? 'bg-gray-50' : 'bg-white'}
                      ${!isPending && onSelectMatch ? 'cursor-pointer hover:shadow-md' : ''}
                    `}
                    onClick={() => {
                      if (!isPending && onSelectMatch) {
                        onSelectMatch(match.id);
                      }
                    }}
                  >
                    <div className="border-b border-gray-100 px-4 py-2 flex justify-between items-center text-xs">
                      <span>
                        Partido {match.matchNumber}
                      </span>
                      {match.status === 'in_progress' && (
                        <span className="inline-flex items-center text-blue-600">
                          <Clock className="w-3 h-3 mr-1" />
                          En progreso
                        </span>
                      )}
                       {match.status === 'questions_active' && (
                        <span className="inline-flex items-center text-purple-600 animate-pulse">
                          <Clock className="w-3 h-3 mr-1" />
                          EN VIVO
                        </span>
                      )}
                      {match.status === 'completed' && (
                        <span className="text-green-600">Completado</span>
                      )}
                      {match.status === 'pending' && (
                        <span className="text-gray-400">Pendiente</span>
                      )}
                    </div>
                    
                    <div className="p-3">
                      <Participant 
                        participantId={match.participant1Id} 
                        name={match.participant1Name}
                        avatar={match.participant1Avatar}
                        score={match.participant1Score} 
                        isWinner={match.winnerId === match.participant1Id}
                        isPending={!match.participant1Id}
                      />
                      
                      <div className="my-2 border-t border-gray-100"></div>
                      
                      <Participant 
                        participantId={match.participant2Id} 
                        name={match.participant2Name}
                        avatar={match.participant2Avatar}
                        score={match.participant2Score} 
                        isWinner={match.winnerId === match.participant2Id}
                        isPending={!match.participant2Id}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ParticipantProps {
  participantId?: string;
  name?: string;
  avatar?: string;
  score?: number;
  isWinner: boolean;
  isPending: boolean;
}

const Participant: React.FC<ParticipantProps> = ({ participantId, name, avatar, score, isWinner, isPending }) => {
  if (isPending) {
    return (
      <div className="flex justify-between items-center py-1.5 px-2 rounded bg-gray-50">
        <span className="text-gray-400 italic">Por determinar</span>
        <span className="text-gray-300">-</span>
      </div>
    );
  }
  
  return (
    <div className={`flex justify-between items-center py-1.5 px-2 rounded ${isWinner ? 'bg-green-50' : ''}`}>
      <div className="flex items-center">
        {avatar && (
          <span className="text-xl mr-2">{avatar}</span>
        )}
        <span className={`${isWinner ? 'font-semibold text-green-700' : 'text-gray-700'}`}>
          {name || 'Desconocido'}
        </span>
      </div>
      <span className={`font-mono ${isWinner ? 'font-semibold text-green-700' : 'text-gray-500'}`}>
        {score !== undefined ? score : '-'}
      </span>
    </div>
  );
};

export default TournamentBracket;