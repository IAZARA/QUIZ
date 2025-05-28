import React from 'react';
import { useTranslation } from 'react-i18next';
import { Award, X } from 'lucide-react';
import ParticipantRanking from '../ParticipantRanking';
import { useQuizConfigStore } from '../../store/quizConfigStore';

interface RankingModalProps {
  isVisible: boolean;
}

const RankingModal: React.FC<RankingModalProps> = ({ isVisible }) => {
  const { t } = useTranslation();

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-bg-primary/80 dark:bg-bg-primary/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn transition-all duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rankingModalTitle"
    >
      <div
        className="bg-bg-primary rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border-color"
        style={{ maxWidth: '95vw' }}
      >
        <div className="flex justify-between items-center mb-4 border-b border-border-color pb-3">
          <h3 id="rankingModalTitle" className="text-xl font-semibold flex items-center text-text-primary">
            <Award className="h-6 w-6 mr-2 text-yellow-500" />
            {t('currentRanking')}
          </h3>
          <button
            onClick={() => useQuizConfigStore.setState({ isRankingVisible: false })}
            className="text-text-secondary hover:text-text-primary transition-colors"
            aria-label={t('closeModal')}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <ParticipantRanking />
      </div>
    </div>
  );
};

export default RankingModal;
