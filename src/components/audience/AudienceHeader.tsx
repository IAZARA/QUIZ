import React from 'react';
import { useTranslation } from 'react-i18next';

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

  return (
    <header className="bg-blue-700 shadow">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {currentParticipant && (
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-blue-100">
              {t('participant')}: {currentParticipant.name}
            </span>
            <button
              onClick={onLogout}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
            >
              {t('logoutButton')}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default AudienceHeader;
