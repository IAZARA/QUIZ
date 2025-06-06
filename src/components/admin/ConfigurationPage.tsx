import React from 'react';
import { ArrowLeft, Globe, Palette, Settings, Bell, Shield, Database, Image } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';
import IconSelector from './IconSelector';

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
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 mb-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 mr-4 transition-transform hover:scale-105">
          <div className="text-blue-600">
            {icon}
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
      <div className="ml-0 bg-gray-50 rounded-lg p-4">
        {children}
      </div>
    </div>
  );
};

const ConfigurationPage: React.FC<ConfigurationPageProps> = ({ onBack }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 mb-8 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 mr-6 font-medium"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              {t('backToDashboard')}
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('configurationPageTitle')}</h1>
              <p className="text-gray-600">{t('configurationPageSubtitle')}</p>
            </div>
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
              <label className="block text-sm font-medium text-gray-900 mb-3">
                {t('interfaceLanguage')}
              </label>
              <div className="flex items-center space-x-4">
                <LanguageSwitcher />
                <span className="text-sm text-gray-600">
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
              <label className="block text-sm font-medium text-gray-900 mb-3">
                {t('colorTheme')}
              </label>
              <div className="flex items-center space-x-4">
                <ThemeSwitcher />
                <span className="text-sm text-gray-600">
                  {t('toggleThemeDesc')}
                </span>
              </div>
            </div>
          </div>
        </ConfigurationSection>

        {/* Configuración de Iconos */}
        <ConfigurationSection
          title="Personalización de Iconos"
          description="Cambia el icono que aparece en la pantalla de espera"
          icon={<Image className="h-5 w-5" />}
        >
          <IconSelector />
        </ConfigurationSection>

        {/* Configuración de Presentación */}
        <ConfigurationSection
          title="Configuración de Presentación"
          description="Ajusta las configuraciones por defecto para tus presentaciones"
          icon={<Settings className="h-5 w-5" />}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Tiempo por defecto para preguntas (segundos)
              </label>
              <input
                type="number"
                min="10"
                max="300"
                defaultValue="30"
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer border border-gray-200">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm text-gray-900 font-medium">
                  Mostrar explicaciones automáticamente después de cada pregunta
                </span>
              </label>
            </div>
            <div>
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer border border-gray-200">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm text-gray-900 font-medium">
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
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer border border-gray-200">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm text-gray-900 font-medium">
                  Notificar cuando se reciban nuevas preguntas de la audiencia
                </span>
              </label>
            </div>
            <div>
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer border border-gray-200">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm text-gray-900 font-medium">
                  Notificar cuando se complete una votación
                </span>
              </label>
            </div>
            <div>
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer border border-gray-200">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm text-gray-900 font-medium">
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
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer border border-gray-200">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm text-gray-900 font-medium">
                  Requerir confirmación antes de eliminar preguntas
                </span>
              </label>
            </div>
            <div>
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer border border-gray-200">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm text-gray-900 font-medium">
                  Permitir participación anónima
                </span>
              </label>
            </div>
            <div className="pt-2">
              <button className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105">
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
            <div className="flex flex-wrap gap-3">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105">
                Exportar Configuración
              </button>
              <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105">
                Importar Configuración
              </button>
            </div>
            <div>
              <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105">
                Exportar Datos de Sesión
              </button>
            </div>
          </div>
        </ConfigurationSection>

        {/* Botón de Guardar */}
        <div className="flex justify-end mt-8">
          <button className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105">
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPage;