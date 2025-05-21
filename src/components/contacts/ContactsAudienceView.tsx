import React from 'react';
import { useContactStore } from '../../store/contactStore';
import { Phone, Mail } from 'lucide-react';

const ContactsAudienceView: React.FC = () => {
  const { contacts, isContactsVisible } = useContactStore();
  
  if (!isContactsVisible) return null;
  
  // Función para crear un enlace de WhatsApp que permita agendar un contacto
  const getWhatsAppLink = (contact: { name: string, whatsapp: string }) => {
    // El formato del enlace para agendar un contacto en WhatsApp es:
    // https://wa.me/NUMEROSINSIGNO?text=MENSAJE
    const number = contact.whatsapp.replace(/\+/g, '');
    const message = encodeURIComponent(`Hola, quiero agendar tu contacto. Mi nombre es...`);
    return `https://wa.me/${number}?text=${message}`;
  };
  
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn transition-all duration-300">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Contáctanos
        </h2>
        
        <div className="space-y-6">
          {contacts.map((contact) => (
            <div key={contact._id} className="bg-gray-50 rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {contact.name}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-indigo-500 mr-3" />
                  <a 
                    href={`mailto:${contact.email}`}
                    className="text-indigo-600 hover:text-indigo-800 text-lg"
                  >
                    {contact.email}
                  </a>
                </div>
                
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700 text-lg">
                    {contact.whatsapp}
                  </span>
                  <a
                    href={getWhatsAppLink(contact)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    ¡Agéndame!
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center text-gray-500 text-sm">
          Puedes contactarnos directamente a través de estos medios.
        </div>
      </div>
    </div>
  );
};

export default ContactsAudienceView;
