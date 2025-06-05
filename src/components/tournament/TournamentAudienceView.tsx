import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
import { TournamentMatch, TournamentRound } from '../../types';
import { playSound } from '../../utils/soundManager';

const TournamentAudienceView: React.FC = () => {
  const { isActive, rounds, winner, loadParticipants } = useTournamentStore();
  const [loading, setLoading] = useState(true);
  const winnerSoundPlayedRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadParticipants();
      setLoading(false);
    };
    
    init();
  }, [loadParticipants]);

  useEffect(() => {
    if (winner && !winnerSoundPlayedRef.current) {
      playSound('winner.mp3');
      winnerSoundPlayedRef.current = true;
    }
  }, [winner]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center">
          <div className="card animate-fadeInScale max-w-sm">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 mb-4 rounded-full skeleton"></div>
              <div className="h-4 skeleton rounded w-48 mb-2"></div>
              <div className="h-3 skeleton rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isActive || rounds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          <div className="card animate-fadeInScale">
            <h2 className="text-xl font-semibold text-text-primary mb-3">¡Torneo en preparación!</h2>
            <p className="text-text-secondary mb-6">
              El presentador está configurando el torneo. Pronto podrás ver el bracket y seguir la competencia.
            </p>
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-accent/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className="text-text-muted text-sm mt-4">
              Espera mientras se seleccionan los participantes y se configura el torneo.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-auto bg-bg-primary">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="text-center mb-6 animate-fadeInUp">
          <h1 className="text-2xl font-bold text-text-primary mb-2 flex items-center justify-center">
            <Trophy className="h-6 w-6 mr-3 text-warning" />
            Torneo de Eliminación Directa
          </h1>
          <div className="h-0.5 w-24 mx-auto bg-gradient-to-r from-warning to-warning/60 rounded-full"></div>
        </div>

        {winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="card bg-gradient-to-r from-warning-light to-warning-light/80 border-warning/30 mx-auto max-w-md animate-glow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center mr-4">
                <Trophy className="h-6 w-6 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-warning mb-1">¡Tenemos un ganador!</p>
                <div className="flex items-center">
                  {winner.avatar && (
                    <span className="text-xl mr-2">{winner.avatar}</span>
                  )}
                  <p className="text-lg font-bold text-text-primary">
                    {winner.tournamentName || winner.name}
                  </p>
                </div>
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
  const prevStatusRef = useRef<string | undefined>();

  useEffect(() => {
    if (prevStatusRef.current !== 'completed' && match.status === 'completed') {
      playSound('tournament_update.mp3');
    }
    prevStatusRef.current = match.status;
  }, [match.status]);

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
      className={`card micro-hover w-full max-w-[220px]`}
      style={{ marginBottom: `${matchSpacing}px` }}
    >
      <div className={`p-2 text-xs text-center border-b rounded-t-lg font-medium ${
        isPending ? 'bg-bg-tertiary text-text-muted' :
        isInProgress ? 'bg-accent/10 text-accent' :
        'bg-success/10 text-success'
      }`}>
        {isPending ? 'Pendiente' : isInProgress ? 'En Progreso' : 'Completado'}
      </div>
      
      <div className="p-4">
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
      className={`p-3 rounded-lg transition-all duration-normal ${
        isPending ? 'bg-bg-tertiary text-text-muted' :
        isWinner ? 'bg-warning-light border border-warning/30 text-warning' : 'bg-bg-secondary'
      }`}
    >
      {isPending ? (
        <div className="text-center text-sm font-medium">Pendiente</div>
      ) : (
        <div className="flex items-center space-x-2">
          {avatar && (
            <span className="text-lg">{avatar}</span>
          )}
          <div className={`flex-1 text-sm transition-all duration-normal ${
            isWinner ? 'font-bold text-warning' : 'font-medium text-text-primary'
          }`}>
            {name || 'Desconocido'}
          </div>
          {isWinner && (
            <div className="w-2 h-2 bg-warning rounded-full animate-pulse-subtle"></div>
          )}
        </div>
      )}
    </div>
  );
};

export default TournamentAudienceView;
