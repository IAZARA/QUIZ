import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Award } from 'lucide-react';
import ParticipantRanking from '../ParticipantRanking';
import { useQuizConfigStore } from '../../store/quizConfigStore';
import { useParticipantStore } from '../../store/participantStore';

const RankingAudienceView: React.FC = () => {
  const { t } = useTranslation();
  const { currentParticipant, logout } = useParticipantStore();

  // Forzar tema light para la vista de ranking de audiencia
  useEffect(() => {
    // Guardar el tema actual
    const currentTheme = document.body.getAttribute('data-theme');
    
    // Aplicar tema light al montar el componente
    document.body.setAttribute('data-theme', 'light');
    
    // Restaurar el tema original al desmontar
    return () => {
      if (currentTheme) {
        document.body.setAttribute('data-theme', currentTheme);
      } else {
        document.body.removeAttribute('data-theme');
      }
    };
  }, []);

  return (
    <div className="h-screen bg-white overflow-hidden relative">
      {/* Controles discretos para móvil */}
      <div className="absolute top-4 right-4 z-50 flex items-center space-x-2">
        {currentParticipant && (
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
          >
            {t('logout')}
          </button>
        )}
      </div>

      {/* Header del ranking */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 shadow-lg">
        <div className="flex items-center justify-center">
          <Award className="h-8 w-8 mr-3" />
          <h1 className="text-2xl font-bold">{t('currentRanking') || 'Clasificación Actual'}</h1>
        </div>
      </div>

      {/* Contenido principal del ranking */}
      <main className="h-full w-full p-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <ParticipantRanking className="bg-white rounded-lg shadow-lg p-6" />
        </div>
      </main>
    </div>
  );
};

export default RankingAudienceView;