import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuizConfigStore } from '../../store/quizConfigStore'; // Import the store
import LanguageSwitcher from '../LanguageSwitcher';

interface AudienceHeaderProps {
  title: string;
  currentParticipant: any;
  onLogout: () => void;
}

const AudienceHeader: React.FC<AudienceHeaderProps> = ({
  title,
  currentParticipant,
  onLogout
}) => {
  const { t } = useTranslation();
  const { config, getConfig } = useQuizConfigStore(state => ({ config: state.config, getConfig: state.getConfig }));

  useEffect(() => {
    getConfig(); // Fetch config when component mounts
  }, [getConfig]);

  // Default logo placeholder text or path to a default image asset
  const defaultLogoPlaceholder = "QuizApp"; // Or e.g., "/default-logo.png";

  return (
    <header className="bg-blue-700 shadow">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center"> {/* Container for logo and title */}
          {config.logoUrl ? (
            <img 
              src={config.logoUrl} 
              alt="Quiz Logo" 
              style={{ maxHeight: '40px', marginRight: '15px', borderRadius: '4px' }} 
            />
          ) : (
            <span className="text-xl font-bold text-white mr-4">{defaultLogoPlaceholder}</span>
          )}
          <h1 className="text-xl font-bold text-white">{title}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          {currentParticipant && (
            <>
              <span className="text-sm font-medium text-blue-100">
                {t('participant')}: {currentParticipant.name}
              </span>
              <button
                onClick={onLogout}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
              >
                {t('logoutButton')}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AudienceHeader;
