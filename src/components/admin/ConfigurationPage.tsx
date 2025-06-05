import React from 'react';
import { ArrowLeft, Globe, Palette, Settings, Bell, Shield, Database } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';

interface ConfigurationPageProps {
  onBack: () => void;
}

const ConfigurationSection: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, description, icon, children }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 mr-3">
          <div className="text-blue-600">
            {icon}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <div className="ml-13">
        {children}
      </div>
    </div>
  );
};

const ConfigurationPage: React.FC<ConfigurationPageProps> = ({ onBack }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors duration-200 mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t('backToDashboard')}
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t('configurationPageTitle')}</h1>
            <p className="text-gray-600">{t('configurationPageSubtitle')}</p>
          </div>
        </div>

        {/* Configuración de Idioma */}
        <ConfigurationSection
          title={t('languageLocalization')}
          description={t('languageLocalizationDesc')}
          icon={<Globe className="h-5 w-5" />}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('interfaceLanguage')}
              </label>
              <div className="flex items-center space-x-4">
                <LanguageSwitcher />
                <span className="text-sm text-gray-500">
                  {t('changeLanguageDesc')}
                </span>
              </div>
            </div>
          </div>
        </ConfigurationSection>

        {/* Configuración de Tema */}
        <ConfigurationSection
          title={t('appearanceTheme')}
          description={t('appearanceThemeDesc')}
          icon={<Palette className="h-5 w-5" />}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('colorTheme')}
              </label>
              <div className="flex items-center space-x-4">
                <ThemeSwitcher />
                <span className="text-sm text-gray-500">
                  {t('toggleThemeDesc')}
                </span>
              </div>
            </div>
          </div>
        </ConfigurationSection>

        {/* Configuración de Presentación */}
        <ConfigurationSection
          title="Configuración de Presentación"
          description="Ajusta las configuraciones por defecto para tus presentaciones"
          icon={<Settings className="h-5 w-5" />}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiempo por defecto para preguntas (segundos)
              </label>
              <input
                type="number"
                min="10"
                max="300"
                defaultValue="30"
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Mostrar explicaciones automáticamente después de cada pregunta
                </span>
              </label>
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Reproducir sonidos de notificación
                </span>
              </label>
            </div>
          </div>
        </ConfigurationSection>

        {/* Configuración de Notificaciones */}
        <ConfigurationSection
          title="Notificaciones"
          description="Controla qué notificaciones quieres recibir"
          icon={<Bell className="h-5 w-5" />}
        >
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Notificar cuando se reciban nuevas preguntas de la audiencia
                </span>
              </label>
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Notificar cuando se complete una votación
                </span>
              </label>
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Notificar cuando nuevos participantes se unan
                </span>
              </label>
            </div>
          </div>
        </ConfigurationSection>

        {/* Configuración de Seguridad */}
        <ConfigurationSection
          title="Seguridad y Privacidad"
          description="Gestiona la seguridad y privacidad de tus datos"
          icon={<Shield className="h-5 w-5" />}
        >
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Requerir confirmación antes de eliminar preguntas
                </span>
              </label>
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Permitir participación anónima
                </span>
              </label>
            </div>
            <div>
              <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200">
                Limpiar todos los datos de sesión
              </button>
            </div>
          </div>
        </ConfigurationSection>

        {/* Configuración de Datos */}
        <ConfigurationSection
          title="Gestión de Datos"
          description="Exporta o importa configuraciones y datos"
          icon={<Database className="h-5 w-5" />}
        >
          <div className="space-y-4">
            <div className="flex space-x-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200">
                Exportar Configuración
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200">
                Importar Configuración
              </button>
            </div>
            <div>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200">
                Exportar Datos de Sesión
              </button>
            </div>
          </div>
        </ConfigurationSection>

        {/* Botón de Guardar */}
        <div className="flex justify-end mt-8">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium">
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPage;