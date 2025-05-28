import React from 'react';
import { useContactStore } from '../../store/contactStore';
import { useParticipantStore } from '../../store/participantStore';
import { Phone, Mail, MessageCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ContactsAudienceView: React.FC = () => {
  const { t } = useTranslation();
  const { contacts, isContactsActive } = useContactStore();
  const { currentParticipant, logout } = useParticipantStore();
  
  if (!isContactsActive || contacts.length === 0) return null;
  
  // Función para crear un enlace de WhatsApp que permita agendar un contacto
  const getWhatsAppLink = (contact: { name: string, whatsapp: string }) => {
    const number = contact.whatsapp.replace(/\+/g, '');
    const message = encodeURIComponent(t('whatsappContactMessage'));
    return `https://wa.me/${number}?text=${message}`;
  };

  const handleLogout = () => {
    logout();
  };
  
  return (
    <div className="min-h-screen bg-bg-secondary text-text-primary">
      <header className="bg-bg-primary shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-text-primary">{t('contactsTitle')}</h1>
          {currentParticipant && (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-text-secondary">
                {t('participant')}: {currentParticipant.name}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
              >
                {t('logoutButton')}
              </button>
            </div>
          )}
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-text-primary mb-2">
              {t('contactUsTitle')}
            </h2>
            <p className="text-text-secondary">
              {t('contactUsDescription')}
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
            {contacts.map((contact) => (
              <div key={contact._id} className="bg-bg-primary rounded-lg p-6 shadow-lg border border-border-color hover:shadow-xl transition-shadow duration-300">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  {contact.name}
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center group">
                    <Mail className="h-5 w-5 text-accent mr-3 flex-shrink-0" />
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-accent hover:text-accent/80 text-lg transition-colors duration-200 group-hover:underline"
                    >
                      {contact.email}
                    </a>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-text-primary text-lg">
                        {contact.whatsapp}
                      </span>
                    </div>
                    <a
                      href={getWhatsAppLink(contact)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 hover:scale-105"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {t('addToWhatsApp')}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center text-text-secondary text-sm">
            {t('contactDirectlyMessage')}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContactsAudienceView;
