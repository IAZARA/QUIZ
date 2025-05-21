import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
// Remove TournamentMatch, TournamentRound if no longer used directly after switching to TournamentBracket
import TournamentBracket from './TournamentBracket'; // Import the shared component

const TournamentAudienceView: React.FC = () => {
  const { isActive, rounds, winner, loadParticipants } = useTournamentStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadParticipants(); // Consider if loadParticipants is always needed or if store hydrates from elsewhere
      setLoading(false);
    };
    
    init();
  }, [loadParticipants]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="animate-pulse text-gray-500 flex flex-col items-center">
          {/* Simplified loader appearance */}
          <Trophy className="w-12 h-12 text-gray-300 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-32"></div>
          <p className="mt-4 text-sm">Cargando el torneo...</p>
        </div>
      </div>
    );
  }

  if (!isActive || rounds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center bg-white p-8 rounded-xl shadow-2xl max-w-lg"
        >
          <Trophy className="w-16 h-16 text-purple-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">¡El Torneo está por Comenzar!</h2>
          <p className="text-gray-600 mb-6">
            El bracket se mostrará aquí tan pronto como el torneo inicie y los partidos estén listos.
          </p>
          <div className="text-gray-500 text-sm animate-pulse">
            Esperando configuración del administrador...
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 h-full overflow-auto bg-gray-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-2 flex items-center justify-center">
          <Trophy className="h-7 w-7 sm:h-8 sm:w-8 mr-2 text-amber-500" />
          Torneo de Eliminación Directa
        </h1>

        {winner && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white p-4 my-6 rounded-lg shadow-lg flex items-center mx-auto max-w-md"
          >
            <div className="flex-shrink-0 p-3 bg-white/20 rounded-full">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-lg font-semibold">¡CAMPEÓN DEL TORNEO!</p>
              <div className="flex items-center mt-1">
                {winner.avatar && (
                  <span className="text-3xl mr-2">{winner.avatar}</span>
                )}
                <p className="text-2xl font-bold">
                  {winner.tournamentName || winner.name}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Use the shared TournamentBracket component */}
      <TournamentBracket 
        rounds={rounds}
        // currentMatchId is not relevant for audience passive view for selection
        // onSelectMatch is not passed, making the bracket read-only for interaction
      />
    </div>
  );
};

// The custom MatchCard and Participant components are removed as TournamentBracket will be used.

export default TournamentAudienceView;
