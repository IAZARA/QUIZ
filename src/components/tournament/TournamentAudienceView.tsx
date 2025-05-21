import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
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
      <div className="flex items-center justify-center h-full" data-testid="loading-skeleton">
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

        <AnimatePresence>
          {winner && (
            <motion.div
              key="tournament-winner-card" // Added key for AnimatePresence
              initial={{ opacity: 0, scale: 0.5, y: -100 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                transition: { type: "spring", stiffness: 100, damping: 15, delay: 0.2, duration: 0.5 },
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.8, 
                y: 50, 
                transition: { duration: 0.3, ease: "easeOut" } 
              }}
              className="bg-gradient-to-r from-yellow-100 via-amber-200 to-yellow-100 border-t-4 border-b-4 border-amber-500 p-6 mb-8 flex flex-col items-center text-center mx-auto max-w-lg shadow-2xl rounded-xl"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0, transition: { delay: 0.4, type: "spring", stiffness: 150 } }}
              >
                <Trophy className="h-16 w-16 text-amber-600 drop-shadow-lg" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.6, duration: 0.4 } }}
                className="text-2xl font-bold text-amber-800 mt-3 mb-1"
              >
                ¡CAMPEÓN DEL TORNEO!
              </motion.p>
              <div className="flex items-center my-2">
                {winner.avatar && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1, transition: { delay: 0.7, type: "spring" } }}
                    className="text-5xl mr-3"
                  >
                    {winner.avatar}
                  </motion.span>
                )}
                <motion.p
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: 0.8, duration: 0.4 } }}
                  className="text-3xl font-extrabold text-amber-900 tracking-tight"
                >
                  {winner.tournamentName || winner.name}
                </motion.p>
              </div>
              <motion.p
                initial={{ opacity:0, y:10 }}
                animate={{ opacity:1, y:0, transition: { delay: 0.9, duration: 0.4}}}
                className="text-sm text-amber-700"
              >
                ¡Felicidades por la victoria!
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* The LayoutGroup for the bracket itself is essential and should be here, wrapping the bracket */}
      <LayoutGroup>
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
      </LayoutGroup>
    </div>
  );
};

interface MatchCardProps {
  match: TournamentMatch;
  roundIndex: number;
  totalRounds: number;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, roundIndex, totalRounds }) => {
  const [countdownStep, setCountdownStep] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const prevStatusRef = useRef<string | undefined>();

  // Determinar el estado del partido
  const isPending = match.status === 'pending';
  const isInProgress = match.status === 'in_progress';
  const isCompleted = match.status === 'completed';

  useEffect(() => {
    // Countdown logic
    if (match.status === 'in_progress' && prevStatusRef.current !== 'in_progress') {
      const steps = ["3", "2", "1", "¡YA!"];
      let currentStep = 0;
      setCountdownStep(steps[currentStep]);

      const interval = setInterval(() => {
        currentStep++;
        if (currentStep < steps.length) {
          setCountdownStep(steps[currentStep]);
        } else {
          setCountdownStep(null);
          clearInterval(interval);
        }
      }, 800); // Adjust timing as needed

      return () => clearInterval(interval);
    }

    // Celebration logic
    if (match.status === 'completed' && prevStatusRef.current !== 'completed' && match.winnerId) {
      setShowCelebration(true);
      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 3000); // Celebration duration

      return () => clearTimeout(timer);
    }
    
    prevStatusRef.current = match.status;
  }, [match.status, match.winnerId]);

  // Calcular el espaciado entre partidos según la ronda
  const matchSpacing = Math.pow(2, roundIndex) * 160;

  const countdownVariants = {
    initial: { opacity: 0, scale: 0.5, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.5, y: -10, transition: { duration: 0.2 } },
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: roundIndex * 0.1 }}
      className={`match-card relative border rounded-lg shadow-sm mb-${matchSpacing}px w-full max-w-[200px]`} // Added relative for positioning countdown
      style={{ marginBottom: `${matchSpacing}px` }}
    >
      <AnimatePresence>
        {countdownStep && (
          <motion.div
            key={countdownStep} // Key change triggers re-animation
            variants={countdownVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10 rounded-lg"
          >
            <span className="text-white text-4xl font-bold">{countdownStep}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-2 text-xs text-center bg-gray-50 border-b rounded-t-lg">
        {isPending ? 'Pendiente' : isInProgress ? 'En Progreso' : 'Completado'}
      </div>
      
      <div className="p-3">
        <Participant 
          participantId={match.participant1Id}
          name={match.participant1Name}
          isWinner={isCompleted && match.winnerId === match.participant1Id}
          isPending={!match.participant1Id}
          isCelebrating={showCelebration && match.winnerId === match.participant1Id}
        />
        
        <div className="my-2 text-center text-xs text-gray-400">VS</div>
        
        <Participant 
          participantId={match.participant2Id}
          name={match.participant2Name}
          isWinner={isCompleted && match.winnerId === match.participant2Id}
          isPending={!match.participant2Id}
          isCelebrating={showCelebration && match.winnerId === match.participant2Id}
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
  isCelebrating?: boolean;
}

const Participant: React.FC<ParticipantProps> = ({ 
  participantId, 
  name, 
  isWinner, 
  isPending,
  isCelebrating 
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
  
  // If participantId is not present, it's a pending slot, no animation needed.
  if (isPending || !participantId) {
    return (
      <div 
        className={`participant-card p-2 rounded bg-gray-100`}
      >
        <div className="text-gray-400 text-center">Pendiente</div>
      </div>
    );
  }
  
  const celebrationVariants = {
    celebrate: {
      scale: [1, 1.1, 1],
      borderColor: ["#FDE68A", "#FBBF24", "#FDE68A"], // amber-200, amber-500, amber-200
      transition: { duration: 0.8, repeat: 2 } // Repeat 3 times total
    },
    normal: {
      scale: 1,
      borderColor: isWinner ? '#FDE68A' : 'transparent', // Maintain winner border or transparent
    }
  };

  return (
    <motion.div 
      key={participantId} // Crucial for framer-motion to track this element
      layout // Enable layout animation
      variants={celebrationVariants}
      animate={isCelebrating ? "celebrate" : "normal"}
      className={`participant-card p-2 rounded border ${ // Ensure border is always there for smooth animation
        isWinner ? 'bg-amber-50 border-amber-200' : 'bg-white border-transparent'
      }`}
    >
      <div className="flex items-center">
        {avatar && (
          <span className="text-xl mr-2">{avatar}</span>
        )}
        <div className={`flex-1 ${isWinner ? 'font-bold text-amber-800' : ''}`}>
          {name || 'Desconocido'}
        </div>
      </div>
    </motion.div>
  );
};

export default TournamentAudienceView;
