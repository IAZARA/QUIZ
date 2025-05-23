import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const languages = [
    { code: 'en', name: 'EN' }, // Shorter names for buttons
    { code: 'es', name: 'ES' },
    { code: 'pt', name: 'PT' },
  ];

  return (
    <div className="flex items-center space-x-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={`p-2 text-xs font-medium rounded-md ${
            i18n.language.startsWith(lang.code) // Use startsWith for regional variants like en-US
              ? 'bg-blue-700 text-white'
              : 'text-gray-300 hover:bg-blue-700 hover:text-white'
          }`}
          title={`Switch to ${lang.name}`} // Tooltip for full language name
        >
          {lang.name}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
