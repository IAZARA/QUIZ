import React, { useState, useEffect } from 'react';
import { useContactStore } from '../../store/contactStore';
import { Contact } from '../../types';
import { Phone, Mail, Trash, Edit, Plus, Save, X } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // Import useTranslation

interface ContactsTabProps {
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ContactsTab: React.FC<ContactsTabProps> = ({ showNotification }) => {
  const { 
    contacts, 
    loadContacts, 
    addContact, 
    updateContact, 
    deleteContact, 
    isContactsActive,
    activateContacts,
    deactivateContacts
  } = useContactStore();
  const { t } = useTranslation(); // Initialize useTranslation
  
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<Contact, '_id' | 'created_at'>>({
    name: '',
    email: '',
    whatsapp: '',
  });
  
  // Cargar contactos al montar el componente
  useEffect(() => {
    const fetchContacts = async () => {
      await loadContacts();
      setIsLoading(false);
    };
    
    fetchContacts();
  }, [loadContacts]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      whatsapp: '',
    });
    setEditingContact(null);
    setShowForm(false);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validar formato de WhatsApp (debe comenzar con + y tener solo números)
      if (!/^\+[0-9]+$/.test(formData.whatsapp)) {
        showNotification('El número de WhatsApp debe tener formato internacional (ej: +5491112345678)', 'error');
        return;
      }
      
      // Validar email
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        showNotification('Por favor ingresa un email válido', 'error');
        return;
      }
      
      if (editingContact) {
        await updateContact(editingContact, formData);
        showNotification('Contacto actualizado correctamente', 'success');
      } else {
        await addContact(formData);
        showNotification('Contacto agregado correctamente', 'success');
      }
      
      resetForm();
    } catch (error) {
      showNotification('Error al guardar el contacto', 'error');
    }
  };
  
  const handleEdit = (contact: Contact) => {
    if (!contact._id) return;
    
    setFormData({
      name: contact.name,
      email: contact.email,
      whatsapp: contact.whatsapp,
    });
    
    setEditingContact(contact._id);
    setShowForm(true);
  };
  
  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este contacto?')) {
      try {
        await deleteContact(id);
        showNotification('Contacto eliminado correctamente', 'success');
      } catch (error) {
        showNotification('Error al eliminar el contacto', 'error');
      }
    }
  };
  
  const handleToggleContactsVisibility = async () => {
    try {
      if (isContactsActive) {
        await deactivateContacts();
        showNotification('Vista de contactos desactivada para la audiencia.', 'info');
      } else {
        await activateContacts();
        showNotification('Vista de contactos activada para la audiencia.', 'success');
      }
    } catch (error) {
      showNotification('Error al cambiar la visibilidad de los contactos.', 'error');
      console.error("Error toggling contacts visibility:", error);
    }
  };
  
  return (
    <div className="bg-bg-primary shadow-lg rounded-lg overflow-hidden">
      <div className="p-6 text-text-primary">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Gestión de Contactos</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-button-text bg-accent hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-offset-bg-primary focus:ring-accent"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Contacto
            </button>
            <button
              onClick={handleToggleContactsVisibility}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isContactsActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-bg-primary focus:ring-accent`}
            >
              <Mail className="h-4 w-4 mr-2" />
              {isContactsActive ? 'Desactivar Vista de Contactos' : 'Activar Vista de Contactos'}
            </button>
          </div>
        </div>
        
        {showForm && (
          <div className="mb-8 p-6 bg-bg-secondary rounded-lg border border-border-color">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-text-primary">
                {editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
              </h3>
              <button
                onClick={resetForm}
                className="text-text-secondary hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="name" className="block text-sm font-medium text-text-secondary">
                    Nombre
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="shadow-sm focus:ring-accent focus:border-accent block w-full sm:text-sm border-border-color rounded-md bg-bg-primary text-text-primary"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
                    Email
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="shadow-sm focus:ring-accent focus:border-accent block w-full sm:text-sm border-border-color rounded-md bg-bg-primary text-text-primary"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-6">
                  <label htmlFor="whatsapp" className="block text-sm font-medium text-text-secondary">
                    WhatsApp (formato internacional)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-text-secondary sm:text-sm">+</span>
                    </div>
                    <input
                      type="text"
                      name="whatsapp"
                      id="whatsapp"
                      required
                      value={formData.whatsapp.replace(/^\+/, '')}
                      onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: '+' + e.target.value.replace(/^\+/, '') }))}
                      placeholder="5491112345678"
                      className="focus:ring-accent focus:border-accent block w-full pl-7 sm:text-sm border-border-color rounded-md bg-bg-primary text-text-primary"
                    />
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">
                    Ejemplo: +5491112345678 (incluye código de país y área)
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center px-4 py-2 border border-border-color shadow-sm text-sm font-medium rounded-md text-text-primary bg-bg-primary hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-offset-bg-primary focus:ring-accent"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-button-text bg-accent hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-offset-bg-primary focus:ring-accent"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingContact ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {isLoading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
            <p className="mt-2 text-text-secondary">Cargando contactos...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-10 bg-bg-secondary rounded-lg">
            <Mail className="mx-auto h-12 w-12 text-text-secondary opacity-50" />
            <h3 className="mt-2 text-sm font-medium text-text-primary">No hay contactos</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Comienza agregando un nuevo contacto para mostrar en la vista de audiencia.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-button-text bg-accent hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-offset-bg-primary focus:ring-accent"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Contacto
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-color">
              <thead className="bg-bg-secondary">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Nombre
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    WhatsApp
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-bg-primary divide-y divide-border-color">
                {contacts.map((contact) => (
                  <tr key={contact._id} className="hover:bg-bg-secondary">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-text-primary">{contact.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-text-secondary">
                        <Mail className="h-4 w-4 mr-2 text-text-secondary opacity-75" />
                        {contact.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-text-secondary">
                        <Phone className="h-4 w-4 mr-2 text-text-secondary opacity-75" />
                        {contact.whatsapp}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(contact)}
                        className="text-accent hover:brightness-125 mr-4"
                        aria-label={t('editContact')}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => contact._id && handleDelete(contact._id)}
                        className="text-red-600 hover:text-red-900"
                        aria-label={t('deleteContact')}
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsTab;
