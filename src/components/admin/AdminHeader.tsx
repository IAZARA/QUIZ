import React from 'react';
import { LogOut, Award } from 'lucide-react';

interface AdminHeaderProps {
  activeTab: 'questions' | 'config' | 'rankings';
  setActiveTab: (tab: 'questions' | 'config' | 'rankings') => void;
  onSignOut: () => void;
  config: {
    showRankings: boolean;
  };
  isRankingVisible: boolean;
  showRanking: () => void;
  hideRanking: () => void;
  onClearView: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  setActiveTab,
  onSignOut,
  config,
  isRankingVisible,
  showRanking,
  hideRanking,
  onClearView
}) => {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Panel de Administración</h1>
            </div>
            <nav className="ml-6 flex space-x-8">
              <button
                onClick={() => setActiveTab('questions')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  activeTab === 'questions'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Preguntas
              </button>
              <button
                onClick={() => setActiveTab('rankings')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  activeTab === 'rankings'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Estadísticas
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  activeTab === 'config'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Configuración
              </button>
            </nav>
          </div>
          <div className="flex items-center space-x-2">
            {activeTab === 'questions' && (
              <>
                <button
                  onClick={onClearView}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Limpiar Vista de Audiencia
                </button>
                
                {config.showRankings && (
                  <button
                    onClick={isRankingVisible ? hideRanking : showRanking}
                    className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white ${
                      isRankingVisible ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-purple-600 hover:bg-purple-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
                  >
                    <Award className="h-4 w-4 mr-2" />
                    {isRankingVisible ? 'Ocultar Clasificación' : 'Mostrar Clasificación'}
                  </button>
                )}
              </>
            )}
            
            <button
              onClick={onSignOut}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
