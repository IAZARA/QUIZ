import React from 'react';
import { RefreshCw } from 'lucide-react';
import ParticipantRanking from '../ParticipantRanking';

interface RankingsTabProps {
  onResetSession: () => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const RankingsTab: React.FC<RankingsTabProps> = ({ onResetSession, showNotification }) => {
  const handleResetSession = async () => {
    // Confirmar antes de reiniciar la sesión
    if (window.confirm('¿Estás seguro de que deseas reiniciar la sesión? Esto eliminará todos los participantes y sus datos. Esta acción no se puede deshacer.')) {
      try {
        // Llamar a la API para reiniciar la sesión
        const response = await fetch('/api/admin/reset-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Error al reiniciar la sesión');
        }
        
        // Llamar a la función onResetSession para actualizar el estado local
        onResetSession();
        
        // Mostrar notificación de éxito
        showNotification('Sesión reiniciada correctamente. Todos los participantes deberán registrarse nuevamente.', 'success');
      } catch (error) {
        console.error('Error al reiniciar la sesión:', error);
        showNotification('Error al reiniciar la sesión', 'error');
      }
    }
  };

  return (
    <div className="px-4 py-5 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Estadísticas de Participantes</h2>
        <button
          onClick={handleResetSession}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reiniciar Sesión
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        Aquí puedes ver el ranking de participantes basado en respuestas correctas y tiempo de respuesta.
        Los participantes se ordenan por puntos (mayor a menor) y en caso de empate, por tiempo total (menor a mayor).
      </p>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Reiniciar sesión:</strong> Al usar esta función, se eliminarán todos los participantes y sus datos. Todos deberán registrarse nuevamente para participar.
            </p>
          </div>
        </div>
      </div>
      
      <ParticipantRanking className="mt-4" />
    </div>
  );
};

export default RankingsTab;
