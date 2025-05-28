import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: true, // Set to false in production
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    resources: {
      en: {
        translation: {
          // Add English translations here
          greeting: 'Hello, World!',
          // Admin Dashboard
          adminDashboardTitle: 'Admin Dashboard',
          questionsTab: 'Questions',
          configurationTab: 'Configuration',
          rankingsTab: 'Rankings',
          tournamentTab: 'Tournament',
          wordcloudTab: 'Word Cloud',
          contactsTab: 'Contacts',
          audienceQATab: 'Audience Q&A',
          documentsTab: 'Documents',
          clearAudienceViewButton: 'Clear Audience View',
          showRankingButton: 'Show Ranking',
          hideRankingButton: 'Hide Ranking',
          newQuestionButton: 'New Question',
          // Header
          headerTitle: 'National Directorate of Security Database Management',
          toolsDropdownTitle: 'Tools',
          // General
          loading: 'Loading...',
          connectionError: 'Error connecting to the server. Please check your connection.',
          retryButton: 'Retry',
        }
      },
      es: {
        translation: {
          // Add Spanish translations here
          greeting: '¡Hola Mundo!',
          // Admin Dashboard
          adminDashboardTitle: 'Panel de Administración',
          questionsTab: 'Preguntas',
          configurationTab: 'Configuración',
          rankingsTab: 'Clasificaciones',
          tournamentTab: 'Torneo',
          wordcloudTab: 'Nube de Palabras',
          contactsTab: 'Contactos',
          audienceQATab: 'Preguntas de la Audiencia',
          documentsTab: 'Documentos',
          clearAudienceViewButton: 'Limpiar Vista de Audiencia',
          showRankingButton: 'Mostrar Clasificación',
          hideRankingButton: 'Ocultar Clasificación',
          newQuestionButton: 'Nueva Pregunta',
          // Header
          headerTitle: 'Dirección Nacional Gestión de Bases de Datos de Seguridad',
          toolsDropdownTitle: 'Herramientas',
          // General
          loading: 'Cargando...',
          connectionError: 'Error al conectar con el servidor. Por favor, verifica tu conexión.',
          retryButton: 'Reintentar',
        }
      },
      pt: {
        translation: {
          // Add Portuguese translations here
          greeting: 'Olá Mundo!',
          // Admin Dashboard
          adminDashboardTitle: 'Painel de Administração',
          questionsTab: 'Perguntas',
          configurationTab: 'Configuração',
          rankingsTab: 'Classificações',
          tournamentTab: 'Torneio',
          wordcloudTab: 'Nuvem de Palavras',
          contactsTab: 'Contatos',
          audienceQATab: 'Perguntas da Audiência',
          documentsTab: 'Documentos',
          clearAudienceViewButton: 'Limpar Visualização do Público',
          showRankingButton: 'Mostrar Classificação',
          hideRankingButton: 'Ocultar Classificação',
          newQuestionButton: 'Nova Pergunta',
          // Header
          headerTitle: 'Direção Nacional de Gestão de Bases de Dados de Segurança',
          toolsDropdownTitle: 'Ferramentas',
          // General
          loading: 'Carregando...',
          connectionError: 'Erro ao conectar com o servidor. Por favor, verifique sua conexão.',
          retryButton: 'Tentar Novamente',
        }
      }
    }
  });

export default i18n;
