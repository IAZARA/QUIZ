import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
import { TournamentMatch, TournamentRound } from '../../types';

const TournamentAudienceView: React.FC = () => {
  const { isActive, rounds, winner, loadParticipants } = useTournamentStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadParticipants();
      setLoading(false);
    };
    
    init();
  }, [loadParticipants]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-500 flex flex-col items-center">
          <div className="w-12 h-12 mb-4 rounded-full bg-gray-200"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (!isActive || rounds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="bg-blue-50 p-6 rounded-lg shadow-sm mb-4">
            <h2 className="text-xl font-semibold text-blue-800 mb-2">¡Torneo en preparación!</h2>
            <p className="text-blue-600">
              El presentador está configurando el torneo. Pronto podrás ver el bracket y seguir la competencia.
            </p>
          </div>
          <div className="text-gray-500 text-sm">
            Espera mientras se seleccionan los participantes y se configura el torneo.
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-4"
      >
        <h1 className="text-xl font-bold text-center mb-4 flex items-center justify-center">
          <Trophy className="h-6 w-6 mr-2 text-amber-500" />
          Torneo de Eliminación Directa
        </h1>

        {winner && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-amber-500 p-4 mb-6 flex items-center mx-auto max-w-md"
          >
            <div className="flex-shrink-0">
              <Trophy className="h-8 w-8 text-amber-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-amber-800">¡Tenemos un ganador!</p>
              <div className="flex items-center">
                {winner.avatar && (
                  <span className="text-2xl mr-2">{winner.avatar}</span>
                )}
                <p className="text-lg font-bold text-amber-900">
                  {winner.tournamentName || winner.name}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      <div className="tournament-bracket overflow-x-auto">
        <div className="flex justify-between" style={{ minWidth: rounds.length * 220 + 'px' }}>
          {rounds.map((round, roundIndex) => (
            <div key={round.id} className="round-column flex-1 px-2">
              <div className="text-center mb-3 font-medium text-gray-700">
                {roundIndex === 0 ? 'Primera Ronda' : 
                 roundIndex === rounds.length - 1 ? 'Final' : 
                 `Ronda ${roundIndex + 1}`}
              </div>
              
              <div className="flex flex-col items-center justify-around h-full">
                {round.matches.map((match) => (
                  <MatchCard 
                    key={match.id} 
                    match={match} 
                    roundIndex={roundIndex}
                    totalRounds={rounds.length}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface MatchCardProps {
  match: TournamentMatch;
  roundIndex: number;
  totalRounds: number;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, roundIndex, totalRounds }) => {
  // Determinar el estado del partido
  const isPending = match.status === 'pending';
  const isInProgress = match.status === 'in_progress';
  const isCompleted = match.status === 'completed';

  // Calcular el espaciado entre partidos según la ronda
  const matchSpacing = Math.pow(2, roundIndex) * 160;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: roundIndex * 0.1 }}
      className={`match-card border rounded-lg shadow-sm mb-${matchSpacing}px w-full max-w-[200px]`}
      style={{ marginBottom: `${matchSpacing}px` }}
    >
      <div className="p-2 text-xs text-center bg-gray-50 border-b rounded-t-lg">
        {isPending ? 'Pendiente' : isInProgress ? 'En Progreso' : 'Completado'}
      </div>
      
      <div className="p-3">
        <Participant 
          participantId={match.participant1Id}
          name={match.participant1Name}
          isWinner={isCompleted && match.winnerId === match.participant1Id}
          isPending={!match.participant1Id}
        />
        
        <div className="my-2 text-center text-xs text-gray-400">VS</div>
        
        <Participant 
          participantId={match.participant2Id}
          name={match.participant2Name}
          isWinner={isCompleted && match.winnerId === match.participant2Id}
          isPending={!match.participant2Id}
        />
      </div>
    </motion.div>
  );
};

interface ParticipantProps {
  participantId?: string;
  name?: string;
  isWinner: boolean;
  isPending: boolean;
}

const Participant: React.FC<ParticipantProps> = ({ 
  participantId, 
  name, 
  isWinner, 
  isPending 
}) => {
  // Extraer el avatar del nombre si está en formato "Animal Color"
  const parts = name?.split(' ') || [];
  const hasAvatar = parts.length >= 2;
  
  // Asignar emojis según el animal (simplificado)
  const getAnimalEmoji = (animalName: string): string => {
    const animalEmojis: Record<string, string> = {
      'Tigre': '🐯', 'León': '🦁', 'Elefante': '🐘', 'Jirafa': '🦒',
      'Delfín': '🐬', 'Águila': '🦅', 'Lobo': '🐺', 'Zorro': '🦊',
      'Oso': '🐻', 'Búho': '🦉', 'Panda': '🐼', 'Koala': '🐨',
      'Cebra': '🦓', 'Pingüino': '🐧', 'Tortuga': '🐢', 'Camaleón': '🦎',
      'Loro': '🦜', 'Cocodrilo': '🐊', 'Gorila': '🦍', 'Hipopótamo': '🦛',
      'Foca': '🦭', 'Nutria': '🦦', 'Tucán': '🦤'
    };
    
    return animalEmojis[animalName] || '🐾';
  };
  
  const avatar = hasAvatar ? getAnimalEmoji(parts[0]) : undefined;
  
  return (
    <div 
      className={`participant-card p-2 rounded ${
        isPending ? 'bg-gray-100' : 
        isWinner ? 'bg-amber-50 border border-amber-200' : 'bg-white'
      }`}
    >
      {isPending ? (
        <div className="text-gray-400 text-center">Pendiente</div>
      ) : (
        <div className="flex items-center">
          {avatar && (
            <span className="text-xl mr-2">{avatar}</span>
          )}
          <div className={`flex-1 ${isWinner ? 'font-bold text-amber-800' : ''}`}>
            {name || 'Desconocido'}
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentAudienceView;
