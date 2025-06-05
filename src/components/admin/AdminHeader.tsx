import React from 'react';
import { LogOut, Trash2, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AdminHeaderProps {
  onClearView: () => void;
  onSignOut: () => void;
  onGoHome: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  onClearView,
  onSignOut,
  onGoHome
}) => {
  const { t } = useTranslation();
  
  return (
    <header className="bg-gradient-to-r from-blue-800 to-blue-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Título con ícono de casa */}
          <div className="flex-shrink-0 flex items-center">
            <button
              onClick={onGoHome}
              className="flex items-center text-white hover:text-blue-200 transition-colors duration-200 group"
            >
              <Home className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform duration-200" />
              <h1 className="text-xl font-bold">
                {t('adminDashboardTitle')}
              </h1>
            </button>
          </div>
          
          {/* Botones de acción */}
          <div className="flex items-center space-x-4">
            {/* Botón Limpiar Vista de Audiencia */}
            <button
              onClick={onClearView}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              <Trash2 className="h-3 w-3 mr-1.5" />
              {t('clearAudienceViewButton')}
            </button>
            
            {/* Botón Cerrar Sesión */}
            <button
              onClick={onSignOut}
              className="inline-flex items-center px-4 py-2 border border-white border-opacity-20 text-sm font-medium rounded-md text-white bg-transparent hover:bg-white hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t('signOutButton')}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
