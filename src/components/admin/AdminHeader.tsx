import React from 'react';
import { LogOut, Trophy, Cloud, Phone, FolderArchive, Settings, BarChart3, ListChecks, MessageCircle } from 'lucide-react'; // Added MessageCircle for Q&A

interface AdminHeaderProps {
  activeTab: 'questions' | 'config' | 'rankings' | 'tournament' | 'wordcloud' | 'contacts' | 'sharedFiles' | 'qa'; // Added 'qa'
  setActiveTab: (tab: 'questions' | 'config' | 'rankings' | 'tournament' | 'wordcloud' | 'contacts' | 'sharedFiles' | 'qa') => void; // Added 'qa'
  onSignOut: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  setActiveTab,
  onSignOut
}) => {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Panel de Administración</h1>
            </div>
            <nav className="ml-6 flex space-x-6 overflow-x-auto py-2"> {/* Adjusted spacing for more tabs and overflow */}
              <button
                onClick={() => setActiveTab('questions')}
                className={`whitespace-nowrap inline-flex items-center px-2 py-2 border-b-2 text-sm font-medium ${
                  activeTab === 'questions'
                    ? 'border-blue-600 text-blue-700 font-semibold'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <ListChecks className="h-4 w-4 mr-1.5" /> Preguntas
              </button>
              <button
                onClick={() => setActiveTab('rankings')}
                className={`whitespace-nowrap inline-flex items-center px-2 py-2 border-b-2 text-sm font-medium ${
                  activeTab === 'rankings'
                    ? 'border-blue-600 text-blue-700 font-semibold'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <BarChart3 className="h-4 w-4 mr-1.5" /> Estadísticas
              </button>
              <button
                onClick={() => setActiveTab('tournament')}
                className={`whitespace-nowrap inline-flex items-center px-2 py-2 border-b-2 text-sm font-medium ${
                  activeTab === 'tournament'
                    ? 'border-blue-600 text-blue-700 font-semibold'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Trophy className="h-4 w-4 mr-1.5" /> Torneo
              </button>
              <button
                onClick={() => setActiveTab('wordcloud')}
                className={`whitespace-nowrap inline-flex items-center px-2 py-2 border-b-2 text-sm font-medium ${
                  activeTab === 'wordcloud'
                    ? 'border-blue-600 text-blue-700 font-semibold'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Cloud className="h-4 w-4 mr-1.5" /> Nube de Palabras
              </button>
              <button
                onClick={() => setActiveTab('contacts')}
                className={`whitespace-nowrap inline-flex items-center px-2 py-2 border-b-2 text-sm font-medium ${
                  activeTab === 'contacts'
                    ? 'border-blue-600 text-blue-700 font-semibold'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Phone className="h-4 w-4 mr-1.5" /> Contactos
              </button>
               <button
                onClick={() => setActiveTab('sharedFiles')}
                className={`whitespace-nowrap inline-flex items-center px-2 py-2 border-b-2 text-sm font-medium ${
                  activeTab === 'sharedFiles'
                    ? 'border-blue-600 text-blue-700 font-semibold'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <FolderArchive className="h-4 w-4 mr-1.5" /> Archivos
              </button>
              <button
                onClick={() => setActiveTab('qa')}
                className={`whitespace-nowrap inline-flex items-center px-2 py-2 border-b-2 text-sm font-medium ${
                  activeTab === 'qa'
                    ? 'border-blue-600 text-blue-700 font-semibold'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <MessageCircle className="h-4 w-4 mr-1.5" /> Q&A
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`whitespace-nowrap inline-flex items-center px-2 py-2 border-b-2 text-sm font-medium ${
                  activeTab === 'config'
                    ? 'border-blue-600 text-blue-700 font-semibold'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Settings className="h-4 w-4 mr-1.5" /> Configuración
              </button>
            </nav>
          </div>
          <div className="flex items-center space-x-2">
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
