import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Trophy, Cloud, Phone, MessageSquare, Settings, BarChart2, ChevronDown } from 'lucide-react';

interface AdminHeaderProps {
  activeTab: 'questions' | 'config' | 'rankings' | 'tournament' | 'wordcloud' | 'contacts' | 'audienceQA';
  setActiveTab: (tab: 'questions' | 'config' | 'rankings' | 'tournament' | 'wordcloud' | 'contacts' | 'audienceQA') => void;
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
            <nav className="ml-6 flex space-x-8">
              {/* Botón principal de Preguntas siempre visible */}
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
              
              {/* Menú desplegable para todas las herramientas */}
              <ToolsDropdown 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
              />
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

// Componente para el menú desplegable de herramientas
const ToolsDropdown: React.FC<{
  activeTab: 'questions' | 'config' | 'rankings' | 'tournament' | 'wordcloud' | 'contacts' | 'audienceQA';
  setActiveTab: (tab: 'questions' | 'config' | 'rankings' | 'tournament' | 'wordcloud' | 'contacts' | 'audienceQA') => void;
}> = ({ activeTab, setActiveTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú cuando se hace clic fuera de él
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Definir las herramientas disponibles
  const tools = [
    { id: 'rankings', name: 'Estadísticas', icon: <BarChart2 className="h-4 w-4 mr-2" /> },
    { id: 'tournament', name: 'Torneo', icon: <Trophy className="h-4 w-4 mr-2" /> },
    { id: 'wordcloud', name: 'Nube de Palabras', icon: <Cloud className="h-4 w-4 mr-2" /> },
    { id: 'contacts', name: 'Contactos', icon: <Phone className="h-4 w-4 mr-2" /> },
    { id: 'config', name: 'Configuración', icon: <Settings className="h-4 w-4 mr-2" /> },
    { id: 'audienceQA', name: 'Preguntas Audiencia', icon: <MessageSquare className="h-4 w-4 mr-2" /> },
  ];

  // Encontrar la herramienta activa
  const activeTool = tools.find(tool => tool.id === activeTab);
  
  // Si estamos en la pestaña de preguntas, mostrar "Herramientas" como título del desplegable
  const dropdownTitle = activeTab === 'questions' ? 'Herramientas' : (activeTool?.name || 'Herramientas');

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
      >
        {activeTab !== 'questions' && activeTool?.icon}
        {dropdownTitle}
        <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div className="absolute z-10 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => {
                  setActiveTab(tool.id as 'questions' | 'config' | 'rankings' | 'tournament' | 'wordcloud' | 'contacts' | 'audienceQA');
                  setIsOpen(false);
                }}
                className={`w-full text-left block px-4 py-2 text-sm ${activeTab === tool.id ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                role="menuitem"
              >
                <div className="flex items-center">
                  {tool.icon}
                  {tool.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHeader;
