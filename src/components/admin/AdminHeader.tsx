import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Trophy, Cloud, Phone, MessageSquare, Settings, BarChart2, ChevronDown, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher'; // Import ThemeSwitcher

interface AdminHeaderProps {
  activeTab: 'questions' | 'config' | 'rankings' | 'tournament' | 'wordcloud' | 'contacts' | 'audienceQA' | 'documents';
  setActiveTab: (tab: 'questions' | 'config' | 'rankings' | 'tournament' | 'wordcloud' | 'contacts' | 'audienceQA' | 'documents') => void;
  onSignOut: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  setActiveTab,
  onSignOut
}) => {
  const { t } = useTranslation();
  return (
    <header className="bg-bg-primary shadow"> {/* Updated to use theme variable */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-text-primary">{t('adminDashboardTitle')}</h1> {/* Updated to use theme variable */}
            </div>
            <nav className="ml-6 flex space-x-8">
              {/* Botón principal de Preguntas siempre visible */}
              <button
                onClick={() => setActiveTab('questions')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  activeTab === 'questions'
                    ? 'border-accent text-text-primary' // Updated to use theme variable
                    : 'border-transparent text-text-secondary hover:border-gray-300 hover:text-text-primary' // Updated to use theme variable
                }`}
              >
                {t('questionsTab')}
              </button>
              
              {/* Menú desplegable para todas las herramientas */}
              <ToolsDropdown 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
              />
            </nav>
          </div>
          <div className="flex items-center space-x-2"> {/* Adjusted space-x as needed */}
            <LanguageSwitcher />
            <ThemeSwitcher /> {/* Add ThemeSwitcher here */}
            <button
              onClick={onSignOut}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-button-text bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" // Assuming button-text is appropriate here, or define a specific one for danger buttons
            >
              <LogOut className="h-4 w-4 mr-1" />
              {t('signOutButton')}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Componente para el menú desplegable de herramientas
// Make sure ToolsDropdown also uses theme variables for its styling if necessary.
// For brevity, I'm assuming ToolsDropdown is either okay or will be updated separately.
// Key parts to check in ToolsDropdown: background of dropdown, text colors, hover states.
// Example for ToolsDropdown button:
// className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary focus:outline-none"
// Example for ToolsDropdown items:
// className={`w-full text-left block px-4 py-2 text-sm ${activeTab === tool.id ? 'bg-bg-secondary text-text-primary' : 'text-text-secondary hover:bg-gray-50'}`}
const ToolsDropdown: React.FC<{
  activeTab: 'questions' | 'config' | 'rankings' | 'tournament' | 'wordcloud' | 'contacts' | 'audienceQA' | 'documents';
  setActiveTab: (tab: 'questions' | 'config' | 'rankings' | 'tournament' | 'wordcloud' | 'contacts' | 'audienceQA' | 'documents') => void;
}> = ({ activeTab, setActiveTab }) => {
  const { t } = useTranslation();
  const { theme } = useThemeStore(); // Access theme for conditional styling if needed
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
    { id: 'rankings', name: t('rankingsTab'), icon: <BarChart2 className="h-4 w-4 mr-2" /> },
    { id: 'tournament', name: t('tournamentTab'), icon: <Trophy className="h-4 w-4 mr-2" /> },
    { id: 'wordcloud', name: t('wordcloudTab'), icon: <Cloud className="h-4 w-4 mr-2" /> },
    { id: 'contacts', name: t('contactsTab'), icon: <Phone className="h-4 w-4 mr-2" /> },
    { id: 'config', name: t('configurationTab'), icon: <Settings className="h-4 w-4 mr-2" /> },
    { id: 'audienceQA', name: t('audienceQATab'), icon: <MessageSquare className="h-4 w-4 mr-2" /> },
    { id: 'documents', name: t('documentsTab'), icon: <FileText className="h-4 w-4 mr-2" /> },
  ];

  // Encontrar la herramienta activa
  const activeTool = tools.find(tool => tool.id === activeTab);
  
  // Si estamos en la pestaña de preguntas, mostrar "Herramientas" como título del desplegable
  const dropdownTitle = activeTab === 'questions' ? t('toolsDropdownTitle') : (activeTool?.name || t('toolsDropdownTitle')); // Assuming 'toolsDropdownTitle' key exists for "Herramientas"

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary focus:outline-none" // Updated to use theme variable
      >
        {activeTab !== 'questions' && activeTool?.icon}
        {dropdownTitle}
        <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div className="absolute z-10 mt-2 w-56 rounded-md shadow-lg bg-bg-primary ring-1 ring-black ring-opacity-5"> {/* Updated to use theme variable */}
          <div className="py-1" role="menu" aria-orientation="vertical">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => {
                  setActiveTab(tool.id as 'questions' | 'config' | 'rankings' | 'tournament' | 'wordcloud' | 'contacts' | 'audienceQA' | 'documents');
                  setIsOpen(false);
                }}
                className={`w-full text-left block px-4 py-2 text-sm ${activeTab === tool.id ? 'bg-bg-secondary text-text-primary' : 'text-text-secondary hover:bg-bg-secondary'}`} // Updated to use theme variables
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
