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
    <div className="bg-bg-secondary border border-border rounded-xl shadow-sm p-6 mb-6 micro-hover">
      <div className="flex items-center mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 mr-4 micro-scale">
          <div className="text-accent">
            {icon}
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-text-primary">{title}</h3>
          <p className="text-sm text-text-secondary mt-1">{description}</p>
        </div>
      </div>
      <div className="ml-0">
        {children}
      </div>
    </div>
  );
};

const ConfigurationPage: React.FC<ConfigurationPageProps> = ({ onBack }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-tertiary">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="bg-bg-secondary border border-border rounded-xl shadow-sm p-6 mb-8 micro-hover">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="flex items-center px-4 py-2 text-accent hover:text-accent-blue-light hover:bg-accent/10 rounded-lg transition-all duration-200 mr-6 micro-scale"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              {t('backToDashboard')}
            </button>
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">{t('configurationPageTitle')}</h1>
              <p className="text-text-secondary">{t('configurationPageSubtitle')}</p>
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
              <label className="block text-sm font-medium text-text-primary mb-3">
                {t('interfaceLanguage')}
              </label>
              <div className="flex items-center space-x-4">
                <LanguageSwitcher />
                <span className="text-sm text-text-muted">
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
              <label className="block text-sm font-medium text-text-primary mb-3">
                {t('colorTheme')}
              </label>
              <div className="flex items-center space-x-4">
                <ThemeSwitcher />
                <span className="text-sm text-text-muted">
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
              <label className="block text-sm font-medium text-text-primary mb-3">
                Tiempo por defecto para preguntas (segundos)
              </label>
              <input
                type="number"
                min="10"
                max="300"
                defaultValue="30"
                className="input-field w-32"
              />
            </div>
            <div>
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-bg-tertiary/50 transition-colors duration-200 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-border text-accent focus:ring-accent/20 focus:ring-2"
                />
                <span className="text-sm text-text-primary">
                  Mostrar explicaciones automáticamente después de cada pregunta
                </span>
              </label>
            </div>
            <div>
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-bg-tertiary/50 transition-colors duration-200 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-border text-accent focus:ring-accent/20 focus:ring-2"
                />
                <span className="text-sm text-text-primary">
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
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-bg-tertiary/50 transition-colors duration-200 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-border text-accent focus:ring-accent/20 focus:ring-2"
                />
                <span className="text-sm text-text-primary">
                  Notificar cuando se reciban nuevas preguntas de la audiencia
                </span>
              </label>
            </div>
            <div>
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-bg-tertiary/50 transition-colors duration-200 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-border text-accent focus:ring-accent/20 focus:ring-2"
                />
                <span className="text-sm text-text-primary">
                  Notificar cuando se complete una votación
                </span>
              </label>
            </div>
            <div>
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-bg-tertiary/50 transition-colors duration-200 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-border text-accent focus:ring-accent/20 focus:ring-2"
                />
                <span className="text-sm text-text-primary">
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
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-bg-tertiary/50 transition-colors duration-200 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-border text-accent focus:ring-accent/20 focus:ring-2"
                />
                <span className="text-sm text-text-primary">
                  Requerir confirmación antes de eliminar preguntas
                </span>
              </label>
            </div>
            <div>
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-bg-tertiary/50 transition-colors duration-200 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-border text-accent focus:ring-accent/20 focus:ring-2"
                />
                <span className="text-sm text-text-primary">
                  Permitir participación anónima
                </span>
              </label>
            </div>
            <div className="pt-2">
              <button className="px-6 py-3 bg-error text-white rounded-lg hover:bg-error/80 transition-all duration-200 font-medium micro-scale">
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
              <button className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-blue-light transition-all duration-200 font-medium micro-scale">
                Exportar Configuración
              </button>
              <button className="px-6 py-3 bg-success text-white rounded-lg hover:bg-success-light hover:text-success transition-all duration-200 font-medium micro-scale">
                Importar Configuración
              </button>
            </div>
            <div>
              <button className="px-6 py-3 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/80 transition-all duration-200 font-medium micro-scale">
                Exportar Datos de Sesión
              </button>
            </div>
          </div>
        </ConfigurationSection>

        {/* Botón de Guardar */}
        <div className="flex justify-end mt-8">
          <button className="px-8 py-4 bg-accent text-white rounded-xl hover:bg-accent-blue-light transition-all duration-200 font-semibold text-lg micro-scale shadow-lg hover:shadow-xl">
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPage;