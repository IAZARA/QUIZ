import React, { useState, useEffect } from 'react';
import { useContactStore } from '../../store/contactStore';
import { Contact, ContactMethod } from '../../types';
import { Trash, Edit, Plus, Save, X, User, ChevronDown, ChevronUp, Mail, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ContactMethodsList from './ContactMethodsList';

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
    addContactMethod,
    updateContactMethod,
    deleteContactMethod,
    isContactsActive,
    activateContacts,
    deactivateContacts
  } = useContactStore();
  const { t } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState<Omit<Contact, '_id' | 'created_at'>>({
    name: '',
    contactMethods: [],
  });
  
  // Cargar contactos al montar el componente
  useEffect(() => {
    const fetchContacts = async () => {
      await loadContacts();
      setIsLoading(false);
    };
    
    fetchContacts();
  }, [loadContacts]);

  // Expandir automáticamente contactos que tienen métodos
  useEffect(() => {
    const contactsWithMethods = contacts
      .filter(contact => contact.contactMethods && contact.contactMethods.length > 0)
      .map(contact => contact._id)
      .filter(Boolean) as string[];
    
    if (contactsWithMethods.length > 0) {
      setExpandedContacts(new Set(contactsWithMethods));
    }
  }, [contacts]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      contactMethods: [],
    });
    setEditingContact(null);
    setShowForm(false);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!formData.name.trim()) {
        showNotification('El nombre es obligatorio', 'error');
        return;
      }
      
      if (editingContact) {
        await updateContact(editingContact, { name: formData.name });
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
      contactMethods: contact.contactMethods || [],
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

  const handleAddContactMethod = async (contactId: string, method: Omit<ContactMethod, '_id'>) => {
    try {
      await addContactMethod(contactId, method);
      showNotification('Método de contacto agregado correctamente', 'success');
    } catch (error) {
      showNotification('Error al agregar método de contacto', 'error');
    }
  };

  const handleUpdateContactMethod = async (contactId: string, methodId: string, updates: Partial<ContactMethod>) => {
    try {
      await updateContactMethod(contactId, methodId, updates);
      showNotification('Método de contacto actualizado correctamente', 'success');
    } catch (error) {
      showNotification('Error al actualizar método de contacto', 'error');
    }
  };

  const handleDeleteContactMethod = async (contactId: string, methodId: string) => {
    try {
      await deleteContactMethod(contactId, methodId);
      showNotification('Método de contacto eliminado correctamente', 'success');
    } catch (error) {
      showNotification('Error al eliminar método de contacto', 'error');
    }
  };

  const toggleContactExpansion = (contactId: string) => {
    setExpandedContacts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
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
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">
                    Nombre del contacto
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ej: Juan Pérez"
                    className="shadow-sm focus:ring-accent focus:border-accent block w-full sm:text-sm border-border-color rounded-md bg-bg-primary text-text-primary"
                    autoFocus
                  />
                  <p className="mt-1 text-sm text-text-muted">
                    Después de crear el contacto podrás agregar sus métodos de contacto (email, teléfono, redes sociales, etc.)
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
          <div className="space-y-4">
            {contacts.map((contact) => {
              const isExpanded = expandedContacts.has(contact._id || '');
              const methodsCount = contact.contactMethods?.length || 0;
              
              return (
                <div key={contact._id} className="bg-bg-secondary rounded-lg border border-border-color overflow-hidden">
                  {/* Header del contacto */}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10">
                          <User className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-text-primary">{contact.name}</h3>
                          <p className="text-sm text-text-secondary">
                            {methodsCount === 0
                              ? 'Sin métodos de contacto'
                              : `${methodsCount} método${methodsCount !== 1 ? 's' : ''} de contacto`
                            }
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {methodsCount > 0 && (
                          <button
                            onClick={() => toggleContactExpansion(contact._id || '')}
                            className="p-2 text-text-secondary hover:text-text-primary transition-colors"
                            title={isExpanded ? 'Contraer' : 'Expandir'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(contact)}
                          className="p-2 text-text-secondary hover:text-accent transition-colors"
                          title="Editar nombre"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => contact._id && handleDelete(contact._id)}
                          className="p-2 text-text-secondary hover:text-red-500 transition-colors"
                          title="Eliminar contacto"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Métodos de contacto expandibles */}
                  {(isExpanded || methodsCount === 0) && (
                    <div className="border-t border-border-color p-4 bg-bg-primary">
                      <ContactMethodsList
                        contact={contact}
                        onAddMethod={(method) => contact._id && handleAddContactMethod(contact._id, method)}
                        onUpdateMethod={(methodId, updates) => contact._id && handleUpdateContactMethod(contact._id, methodId, updates)}
                        onDeleteMethod={(methodId) => contact._id && handleDeleteContactMethod(contact._id, methodId)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsTab;
