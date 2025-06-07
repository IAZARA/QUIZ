import React from 'react';
import {
  FileText,
  MessageSquare,
  Users,
  Cloud,
  Trophy,
  BarChart2,
  Database,
  Star,
  Settings,
  Languages,
  Palette,
  HelpCircle,
  Bot,
  Link,
  Brain
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ToolCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'content' | 'audience' | 'analytics' | 'config';
  color: string;
  onClick: () => void;
}

interface DashboardHomeProps {
  onToolSelect: (toolId: string) => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, icon, color, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`dashboard-card cursor-pointer p-6 ${color} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group`}
    >
      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-white bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300">
        <div className="text-white text-2xl">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-bold text-white text-center mb-2 group-hover:scale-105 transition-transform duration-300">
        {title}
      </h3>
      <p className="text-white text-opacity-90 text-center text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
};

const CategorySection: React.FC<{
  title: string;
  description: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}> = ({ title, description, children, icon }) => {
  return (
    <div className="mb-12">
      <div className="flex items-center mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 mr-4">
          <div className="text-white text-xl">
            {icon}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">{title}</h2>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children}
      </div>
    </div>
  );
};

const DashboardHome: React.FC<DashboardHomeProps> = ({ onToolSelect }) => {
  const { t } = useTranslation();

  const contentTools = [
    {
      id: 'questions',
      title: t('questionsTab') || 'Banco de Preguntas',
      description: t('questionBankDesc'),
      icon: <HelpCircle />,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      category: 'content' as const
    },
    {
      id: 'aiQuestions',
      title: 'Generador de Preguntas IA',
      description: 'Genera preguntas automáticamente usando inteligencia artificial desde texto o documentos',
      icon: <Bot />,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      category: 'content' as const
    },
    {
      id: 'mlCriminalSimulator',
      title: 'Canvas Interactivos',
      description: 'Demostraciones interactivas de Machine Learning donde cada participante puede experimentar individualmente',
      icon: <Palette />,
      color: 'bg-gradient-to-br from-orange-500 to-red-500',
      category: 'content' as const
    }
  ];

  const audienceTools = [
    {
      id: 'audienceQA',
      title: t('audienceQATab') || 'Preguntas de la Audiencia',
      description: t('audienceQADesc'),
      icon: <MessageSquare />,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      category: 'audience' as const
    },
    {
      id: 'contacts',
      title: t('contactsTab') || 'Contactos',
      description: t('contactsDesc'),
      icon: <Users />,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      category: 'audience' as const
    },
    {
      id: 'linkSharing',
      title: t('linkSharingTab') || 'Compartir Links',
      description: t('linkSharingDesc') || 'Comparte enlaces útiles con tu audiencia en tiempo real',
      icon: <Link />,
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      category: 'audience' as const
    },
    {
      id: 'documents',
      title: 'Compartir Documentos',
      description: 'Comparte documentos y archivos con tu audiencia en tiempo real',
      icon: <FileText />,
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      category: 'audience' as const
    },
    {
      id: 'wordcloud',
      title: t('wordcloudTab') || 'Nube de Palabras',
      description: t('wordcloudDesc'),
      icon: <Cloud />,
      color: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
      category: 'audience' as const
    },
    {
      id: 'tournament',
      title: t('tournamentTab') || 'Torneo',
      description: t('tournamentDesc'),
      icon: <Trophy />,
      color: 'bg-gradient-to-br from-yellow-500 to-orange-500',
      category: 'audience' as const
    }
  ];

  const analyticsTools = [
    {
      id: 'rankings',
      title: t('rankingsTab') || 'Clasificaciones',
      description: t('rankingsDesc'),
      icon: <BarChart2 />,
      color: 'bg-gradient-to-br from-red-500 to-red-600',
      category: 'analytics' as const
    },
    {
      id: 'audienceData',
      title: 'Solicitar datos a la audiencia',
      description: 'Gestiona y recopila información de tu audiencia mediante formularios personalizados',
      icon: <Database />,
      color: 'bg-gradient-to-br from-pink-500 to-pink-600',
      category: 'analytics' as const
    },
    {
      id: 'reviews',
      title: t('reviewsTabTitle') || 'Reseñas',
      description: 'Exporta el feedback de los participantes',
      icon: <Star />,
      color: 'bg-gradient-to-br from-amber-500 to-amber-600',
      category: 'analytics' as const
    }
  ];

  const configTools = [
    {
      id: 'config',
      title: t('systemConfiguration'),
      description: t('configurationDesc'),
      icon: <Settings />,
      color: 'bg-gradient-to-br from-gray-600 to-gray-700',
      category: 'config' as const
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header del Dashboard */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {t('dashboardTitle')}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('dashboardSubtitle')}
          </p>
        </div>

        {/* Gestión de Contenido */}
        <CategorySection
          title={t('contentManagement')}
          description={t('contentManagementDesc')}
          icon={<FileText />}
        >
          {contentTools.map((tool) => (
            <ToolCard
              key={tool.id}
              {...tool}
              onClick={() => onToolSelect(tool.id)}
            />
          ))}
        </CategorySection>

        {/* Interacción con Audiencia */}
        <CategorySection
          title={t('audienceInteraction')}
          description={t('audienceInteractionDesc')}
          icon={<Users />}
        >
          {audienceTools.map((tool) => (
            <ToolCard
              key={tool.id}
              {...tool}
              onClick={() => onToolSelect(tool.id)}
            />
          ))}
        </CategorySection>

        {/* Análisis y Reportes */}
        <CategorySection
          title={t('analyticsReports')}
          description={t('analyticsReportsDesc')}
          icon={<BarChart2 />}
        >
          {analyticsTools.map((tool) => (
            <ToolCard
              key={tool.id}
              {...tool}
              onClick={() => onToolSelect(tool.id)}
            />
          ))}
        </CategorySection>

        {/* Configuración */}
        <CategorySection
          title={t('systemConfiguration')}
          description={t('systemConfigurationDesc')}
          icon={<Settings />}
        >
          {configTools.map((tool) => (
            <ToolCard
              key={tool.id}
              {...tool}
              onClick={() => onToolSelect(tool.id)}
            />
          ))}
        </CategorySection>
      </div>
    </div>
  );
};

export default DashboardHome;