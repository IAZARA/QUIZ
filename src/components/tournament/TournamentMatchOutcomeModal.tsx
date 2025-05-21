import React from 'react';
import { Button } from '@/components/ui/button';
import { XCircle, CheckCircle, Trophy, Info } from 'lucide-react'; // Added Info for generic messages

export type TournamentOutcome = 'advanced' | 'eliminated' | 'winner' | 'info'; // Added 'info' for generic messages

interface TournamentMatchOutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  outcome: TournamentOutcome;
  winnerName?: string;
  matchDetails?: {
    yourScore?: number;
    opponentScore?: number;
    message?: string; // For any specific detailed message, e.g. how advancement occurred
  };
  title?: string; // Optional override for title
  customMessage?: string; // Optional override for message
}

const TournamentMatchOutcomeModal: React.FC<TournamentMatchOutcomeModalProps> = ({
  isOpen,
  onClose,
  outcome,
  winnerName,
  matchDetails,
  title: customTitle,
  customMessage,
}) => {
  if (!isOpen) return null;

  let title = '';
  let message = '';
  let icon = null;
  let bgColor = 'bg-white'; // Default background
  let buttonText = 'Continuar';

  switch (outcome) {
    case 'advanced':
      title = customTitle || '¡FELICITACIONES!';
      message = customMessage || 'Pasaste a la siguiente fase.';
      icon = <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />;
      bgColor = 'bg-green-50';
      break;
    case 'eliminated':
      title = customTitle || 'HAS SIDO ELIMINADO';
      message = customMessage || 'Gracias por participar en el torneo.';
      icon = <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />;
      bgColor = 'bg-red-50';
      buttonText = 'Cerrar';
      break;
    case 'winner':
      title = customTitle || `¡CAMPEÓN DEL TORNEO!`;
      message = customMessage || `¡Felicidades, ${winnerName || 'Jugador'}! Has ganado el torneo.`;
      icon = <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />;
      bgColor = 'bg-yellow-50';
      break;
    case 'info': // For generic informational messages
      title = customTitle || 'Información';
      message = customMessage || 'Se ha producido un evento en el torneo.';
      icon = <Info className="w-16 h-16 text-blue-500 mx-auto mb-4" />;
      bgColor = 'bg-blue-50';
      break;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100]">
      <div className={`p-6 md:p-8 rounded-xl shadow-2xl text-center max-w-md w-full transform transition-all duration-300 ease-out scale-100 ${bgColor}`}>
        {icon}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">{title}</h2>
        <p className="text-gray-700 mb-2 text-sm md:text-base">{message}</p>

        {matchDetails && (
          <div className="my-4 p-3 bg-gray-100 rounded-md text-sm text-gray-600 space-y-1">
            {typeof matchDetails.yourScore === 'number' && (
              <p>Tu puntaje: <span className="font-semibold">{matchDetails.yourScore}</span></p>
            )}
            {typeof matchDetails.opponentScore === 'number' && (
              <p>Puntaje del oponente: <span className="font-semibold">{matchDetails.opponentScore}</span></p>
            )}
            {matchDetails.message && (
              <p className="italic mt-1">{matchDetails.message}</p>
            )}
          </div>
        )}

        <Button 
          onClick={onClose} 
          className="mt-5 w-full md:w-auto px-8 py-2 text-lg focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          variant={outcome === 'eliminated' ? 'destructive' : 'default'}
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
};

export default TournamentMatchOutcomeModal;
export type { TournamentMatchOutcomeModalProps }; // Exporting props type for convenience
