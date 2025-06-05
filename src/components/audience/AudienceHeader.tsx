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
    <header className="bg-bg-secondary/95 backdrop-blur-md border-b border-border-light shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {config.logoUrl ? (
            <img
              src={config.logoUrl}
              alt="Quiz Logo"
              className="h-8 w-auto rounded-md micro-hover"
            />
          ) : (
            <span className="text-lg font-bold text-text-primary">{defaultLogoPlaceholder}</span>
          )}
          <div className="h-6 w-px bg-border-light"></div>
          <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          {currentParticipant && (
            <>
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-bg-tertiary rounded-lg border border-border-light">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse-subtle"></div>
                <span className="text-sm font-medium text-text-secondary">
                  {currentParticipant.name}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="text-sm text-error hover:text-error/80 font-medium transition-colors duration-normal micro-scale px-2 py-1 rounded-md"
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
