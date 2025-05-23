import React from 'react';
import { Database } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Header() {
  const { t } = useTranslation();
  return (
    <header className="bg-blue-950 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <Database className="h-6 w-6 mr-3 text-blue-300" />
          <h1 className="text-xl font-semibold">
            {t('headerTitle')}
          </h1>
        </div>
      </div>
    </header>
  );
}