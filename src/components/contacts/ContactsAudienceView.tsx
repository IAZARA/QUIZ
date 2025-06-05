import React from 'react';
import { useContactStore } from '../../store/contactStore';
import { useParticipantStore } from '../../store/participantStore';
import { Phone, Mail, MessageCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ContactsAudienceView: React.FC = () => {
  const { t } = useTranslation();
  const { contacts, isContactsActive } = useContactStore();
  const { currentParticipant, logout } = useParticipantStore();
  
  const handleLogout = () => {
    logout();
  };
  
  if (!isContactsActive) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="card animate-fadeInScale">
            <h2 className="text-xl font-semibold text-text-primary mb-3">{t('contactsNotActive')}</h2>
            <p className="text-text-secondary">{t('contactsNotActiveDescription')}</p>
            <div className="flex justify-center space-x-2 mt-6">
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-accent/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (contacts.length === 0) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <header className="bg-bg-secondary/95 backdrop-blur-md border-b border-border-light shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-lg font-semibold text-text-primary">{t('contactsTitle')}</h1>
            {currentParticipant && (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-bg-tertiary rounded-lg border border-border-light">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse-subtle"></div>
                  <span className="text-sm font-medium text-text-secondary">
                    {currentParticipant.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-error hover:text-error/80 font-medium transition-colors duration-normal micro-scale px-2 py-1 rounded-md"
                >
                  {t('logoutButton')}
                </button>
              </div>
            )}
          </div>
        </header>
        
        <main className="max-w-4xl mx-auto py-12 px-6">
          <div className="text-center">
            <div className="card animate-fadeInScale max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-text-primary mb-3">
                {t('noContactsAvailable')}
              </h2>
              <p className="text-text-secondary mb-6">
                {t('contactsWillAppearHere')}
              </p>
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-accent/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  // Función para crear un enlace de WhatsApp que permita agendar un contacto
  const getWhatsAppLink = (contact: { name: string, whatsapp: string }) => {
    const number = contact.whatsapp.replace(/\+/g, '');
    const message = encodeURIComponent(t('whatsappContactMessage'));
    return `https://wa.me/${number}?text=${message}`;
  };

  
  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="bg-bg-secondary/95 backdrop-blur-md border-b border-border-light shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-text-primary">{t('contactsTitle')}</h1>
          {currentParticipant && (
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-bg-tertiary rounded-lg border border-border-light">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse-subtle"></div>
                <span className="text-sm font-medium text-text-secondary">
                  {currentParticipant.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-error hover:text-error/80 font-medium transition-colors duration-normal micro-scale px-2 py-1 rounded-md"
              >
                {t('logoutButton')}
              </button>
            </div>
          )}
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto py-8 px-6">
        <div className="text-center mb-10 animate-fadeInUp">
          <h2 className="text-2xl font-bold text-text-primary mb-3">
            {t('contactUsTitle')}
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            {t('contactUsDescription')}
          </p>
        </div>
        
        <div className="space-y-4">
          {contacts.map((contact, index) => (
              <div
                key={contact._id}
                className="card micro-hover animate-fadeInUp"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h3 className="text-lg font-semibold text-text-primary mb-6">
                  {contact.name}
                </h3>
                
                <div className="space-y-5">
                  <div className="flex items-center group">
                    <div className="flex-shrink-0 w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mr-4 group-hover:bg-accent/20 transition-colors duration-normal">
                      <Mail className="h-5 w-5 text-accent" />
                    </div>
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-accent hover:text-accent/80 font-medium transition-colors duration-normal group-hover:underline flex-1"
                    >
                      {contact.email}
                    </a>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center mr-4">
                        <Phone className="h-5 w-5 text-success" />
                      </div>
                      <span className="text-text-primary font-medium">
                        {contact.whatsapp}
                      </span>
                    </div>
                    <a
                      href={getWhatsAppLink(contact)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2.5 bg-success text-white text-sm font-medium rounded-lg shadow-sm hover:bg-success/90 focus:outline-none focus:ring-2 focus:ring-success/20 transition-all duration-normal micro-scale"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {t('addToWhatsApp')}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-10 text-center animate-fadeIn" style={{ animationDelay: '400ms' }}>
            <p className="text-text-muted text-sm">
              {t('contactDirectlyMessage')}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContactsAudienceView;
