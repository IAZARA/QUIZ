import React from 'react';
import { useContactStore } from '../../store/contactStore';
import { useParticipantStore } from '../../store/participantStore';
import { useThemeStore } from '../../store/themeStore';
import { MessageCircle, X, Sun, Moon, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getContactTypeConfig, generateContactUrl } from '../../config/contactTypes';
import * as LucideIcons from 'lucide-react';

const ContactsAudienceView: React.FC = () => {
  const { t } = useTranslation();
  const { contacts, isContactsActive } = useContactStore();
  const { currentParticipant, logout } = useParticipantStore();
  const { theme, toggleTheme } = useThemeStore();
  
  const handleLogout = () => {
    logout();
  };
  
  if (!isContactsActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary/20 to-bg-primary flex items-center justify-center p-6 relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-success/5 rounded-full blur-3xl"></div>
        </div>

        {/* Selector de tema flotante */}
        <div className="absolute top-6 right-6 z-10">
          <button
            onClick={toggleTheme}
            className="p-3 bg-bg-secondary/80 hover:bg-bg-secondary backdrop-blur-md rounded-full border border-border-light/50 shadow-lg transition-all duration-normal micro-scale"
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5 text-text-primary" />
            ) : (
              <Sun className="h-5 w-5 text-text-primary" />
            )}
          </button>
        </div>
        
        <div className="text-center max-w-md relative z-10">
          <div className="bg-bg-secondary/40 backdrop-blur-md rounded-2xl p-8 border border-border-light/50 shadow-xl animate-fadeInScale">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-full mb-6">
              <MessageCircle className="h-8 w-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">{t('contactsNotActive')}</h2>
            <p className="text-text-secondary mb-8 leading-relaxed">{t('contactsNotActiveDescription')}</p>
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-accent/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (contacts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary/20 to-bg-primary relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-success/5 rounded-full blur-3xl"></div>
        </div>

        {/* Controles flotantes */}
        <div className="absolute top-6 right-6 z-10">
          <div className="flex items-center space-x-3">
            {/* Selector de tema */}
            <button
              onClick={toggleTheme}
              className="p-3 bg-bg-secondary/80 hover:bg-bg-secondary backdrop-blur-md rounded-full border border-border-light/50 shadow-lg transition-all duration-normal micro-scale"
              title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5 text-text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-text-primary" />
              )}
            </button>

            {/* Información del participante y logout */}
            {currentParticipant && (
              <>
                <div className="flex items-center space-x-2 px-4 py-2 bg-bg-secondary/80 backdrop-blur-md rounded-full border border-border-light/50 shadow-lg">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse-subtle"></div>
                  <span className="text-sm font-medium text-text-secondary">
                    {currentParticipant.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 bg-error/10 hover:bg-error/20 text-error rounded-full transition-all duration-normal micro-scale backdrop-blur-md border border-error/20"
                  title={t('logoutButton')}
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
        
        <main className="relative z-10 max-w-4xl mx-auto py-12 px-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="bg-bg-secondary/40 backdrop-blur-md rounded-2xl p-12 border border-border-light/50 shadow-xl animate-fadeInScale max-w-lg mx-auto">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-accent/10 rounded-full mb-8">
                <MessageCircle className="h-10 w-10 text-accent" />
              </div>
              <h2 className="text-3xl font-bold text-text-primary mb-4">
                {t('noContactsAvailable')}
              </h2>
              <p className="text-text-secondary mb-8 text-lg leading-relaxed">
                {t('contactsWillAppearHere')}
              </p>
              <div className="flex justify-center space-x-2">
                <div className="w-3 h-3 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-accent/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  const getIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className="h-6 w-6" /> : null;
  };

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary/20 to-bg-primary relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-success/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/3 rounded-full blur-3xl"></div>
      </div>

      {/* Controles flotantes */}
      <div className="absolute top-6 right-6 z-10">
        <div className="flex items-center space-x-3">
          {/* Selector de tema */}
          <button
            onClick={toggleTheme}
            className="p-3 bg-bg-secondary/80 hover:bg-bg-secondary backdrop-blur-md rounded-full border border-border-light/50 shadow-lg transition-all duration-normal micro-scale"
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5 text-text-primary" />
            ) : (
              <Sun className="h-5 w-5 text-text-primary" />
            )}
          </button>

          {/* Información del participante y logout */}
          {currentParticipant && (
            <>
              <div className="flex items-center space-x-2 px-4 py-2 bg-bg-secondary/80 backdrop-blur-md rounded-full border border-border-light/50 shadow-lg">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse-subtle"></div>
                <span className="text-sm font-medium text-text-secondary">
                  {currentParticipant.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 bg-error/10 hover:bg-error/20 text-error rounded-full transition-all duration-normal micro-scale backdrop-blur-md border border-error/20"
                title={t('logoutButton')}
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
      
      <main className="relative z-10 max-w-4xl mx-auto py-12 px-6">
        {/* Header mejorado */}
        <div className="text-center mb-16 animate-fadeInUp">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-accent/10 rounded-full mb-6 animate-fadeInScale">
            <MessageCircle className="h-10 w-10 text-accent" />
          </div>
          <h1 className="text-4xl font-bold text-text-primary mb-4 bg-gradient-to-r from-text-primary to-accent bg-clip-text">
            {t('contactUsTitle')}
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Puedes contactarnos directamente a través de estos medios.
          </p>
        </div>
        
        {/* Grid de contactos mejorado */}
        <div className="grid gap-6 md:gap-8">
          {contacts.map((contact, index) => (
            <div
              key={contact._id}
              className="group relative bg-bg-secondary/40 backdrop-blur-md rounded-2xl p-8 border border-border-light/50 shadow-xl hover:shadow-2xl transition-all duration-500 animate-fadeInUp hover:scale-[1.02] hover:bg-bg-secondary/60"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Efecto de brillo en hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent/5 via-transparent to-success/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-text-primary mb-8 text-center">
                  {contact.name}
                </h3>
                
                {contact.contactMethods && contact.contactMethods.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {contact.contactMethods.map((method, methodIndex) => {
                      const typeConfig = getContactTypeConfig(method.type);
                      const contactUrl = generateContactUrl(method.type, method.value);
                      
                      if (!typeConfig) return null;
                      
                      return (
                        <div
                          key={method._id || methodIndex}
                          className="flex items-center group/item p-4 rounded-xl bg-accent/5 hover:bg-accent/10 transition-all duration-300"
                        >
                          <div className="flex-shrink-0 w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mr-4 group-hover/item:scale-110 transition-transform duration-300">
                            <div className="text-accent">
                              {getIcon(typeConfig.icon)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-text-muted mb-1 font-medium uppercase tracking-wide">
                              {method.label || typeConfig.label}
                            </p>
                            {contactUrl ? (
                              <a
                                href={contactUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent hover:text-accent/80 font-semibold text-sm transition-colors duration-300 group-hover/item:underline flex items-center"
                              >
                                <span className="truncate mr-2">{method.value}</span>
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              </a>
                            ) : (
                              <span className="text-text-primary font-semibold text-sm truncate">
                                {method.value}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="mx-auto h-12 w-12 text-text-secondary opacity-50 mb-4" />
                    <p className="text-text-secondary">
                      No hay métodos de contacto disponibles
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
      </main>
    </div>
  );
};

export default ContactsAudienceView;
