import React, { useState, useEffect } from 'react';
import { useContactStore } from '../../store/contactStore';
import { Contact } from '../../types';
import { Phone, Mail, Trash, Edit, Plus, Save, X } from 'lucide-react';

interface ContactsTabProps {
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ContactsTab: React.FC<ContactsTabProps> = ({ showNotification }) => {
  const { contacts, loadContacts, addContact, updateContact, deleteContact, showContacts } = useContactStore();
  
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
  
  const handleShowContacts = () => {
    showContacts();
    showNotification('Contactos mostrados en la vista de audiencia', 'success');
  };
  
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Contactos</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Contacto
            </button>
            <button
              onClick={handleShowContacts}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Mail className="h-4 w-4 mr-2" />
              Mostrar en Audiencia
            </button>
          </div>
        </div>
        
        {showForm && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
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
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-6">
                  <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">
                    WhatsApp (formato internacional)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">+</span>
                    </div>
                    <input
                      type="text"
                      name="whatsapp"
                      id="whatsapp"
                      required
                      value={formData.whatsapp.replace(/^\+/, '')}
                      onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: '+' + e.target.value.replace(/^\+/, '') }))}
                      placeholder="5491112345678"
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Ejemplo: +5491112345678 (incluye código de país y área)
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Cargando contactos...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <Mail className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay contactos</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza agregando un nuevo contacto para mostrar en la vista de audiencia.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Contacto
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    WhatsApp
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contacts.map((contact) => (
                  <tr key={contact._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {contact.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {contact.whatsapp}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(contact)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => contact._id && handleDelete(contact._id)}
                        className="text-red-600 hover:text-red-900"
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
