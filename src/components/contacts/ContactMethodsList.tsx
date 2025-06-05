import React, { useState } from 'react';
import { Contact, ContactMethod, ContactMethodType } from '../../types';
import { getContactTypeConfig, generateContactUrl } from '../../config/contactTypes';
import { Plus, Edit, Trash, ExternalLink } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import ContactTypeSelector from './ContactTypeSelector';
import ContactMethodForm from './ContactMethodForm';

interface ContactMethodsListProps {
  contact: Contact;
  onAddMethod: (method: Omit<ContactMethod, '_id'>) => void;
  onUpdateMethod: (methodId: string, updates: Partial<ContactMethod>) => void;
  onDeleteMethod: (methodId: string) => void;
}

const ContactMethodsList: React.FC<ContactMethodsListProps> = ({
  contact,
  onAddMethod,
  onUpdateMethod,
  onDeleteMethod
}) => {
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showMethodForm, setShowMethodForm] = useState(false);
  const [selectedType, setSelectedType] = useState<ContactMethodType | null>(null);
  const [editingMethod, setEditingMethod] = useState<ContactMethod | null>(null);

  const getIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
  };

  const handleTypeSelect = (type: ContactMethodType) => {
    setSelectedType(type);
    setShowMethodForm(true);
  };

  const handleAddMethod = (method: Omit<ContactMethod, '_id'>) => {
    onAddMethod(method);
    setSelectedType(null);
  };

  const handleEditMethod = (method: ContactMethod) => {
    setEditingMethod(method);
    setSelectedType(method.type);
    setShowMethodForm(true);
  };

  const handleUpdateMethod = (updatedMethod: Omit<ContactMethod, '_id'>) => {
    if (editingMethod?._id) {
      onUpdateMethod(editingMethod._id, updatedMethod);
    }
    setEditingMethod(null);
    setSelectedType(null);
  };

  const handleDeleteMethod = (methodId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este método de contacto?')) {
      onDeleteMethod(methodId);
    }
  };

  const handleCloseForm = () => {
    setShowMethodForm(false);
    setSelectedType(null);
    setEditingMethod(null);
  };

  // Obtener tipos ya utilizados para excluirlos del selector
  const usedTypes = contact.contactMethods?.map(method => method.type) || [];

  return (
    <div className="space-y-4">
      {/* Lista de métodos de contacto */}
      {contact.contactMethods && contact.contactMethods.length > 0 && (
        <div className="space-y-2">
          {contact.contactMethods.map((method) => {
            const typeConfig = getContactTypeConfig(method.type);
            const contactUrl = generateContactUrl(method.type, method.value);
            
            if (!typeConfig) return null;

            return (
              <div
                key={method._id}
                className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg border border-border-color hover:border-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10">
                    <div className="text-accent">
                      {getIcon(typeConfig.icon)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-text-secondary">
                        {method.label || typeConfig.label}
                      </span>
                      {contactUrl && (
                        <a
                          href={contactUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:text-accent/80 transition-colors"
                          title="Abrir enlace"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-text-primary truncate">
                      {method.value}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditMethod(method)}
                    className="p-1 text-text-secondary hover:text-accent transition-colors"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => method._id && handleDeleteMethod(method._id)}
                    className="p-1 text-text-secondary hover:text-red-500 transition-colors"
                    title="Eliminar"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Botón para agregar método */}
      <button
        onClick={() => setShowTypeSelector(true)}
        className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-border-color hover:border-accent hover:bg-accent/5 rounded-lg transition-colors group"
      >
        <Plus className="h-4 w-4 text-text-secondary group-hover:text-accent transition-colors" />
        <span className="text-sm font-medium text-text-secondary group-hover:text-accent transition-colors">
          Agregar método de contacto
        </span>
      </button>

      {/* Modales */}
      <ContactTypeSelector
        isOpen={showTypeSelector}
        onClose={() => setShowTypeSelector(false)}
        onSelect={handleTypeSelect}
        excludeTypes={usedTypes}
      />

      {selectedType && (
        <ContactMethodForm
          isOpen={showMethodForm}
          onClose={handleCloseForm}
          onSave={editingMethod ? handleUpdateMethod : handleAddMethod}
          contactType={selectedType}
          initialData={editingMethod || undefined}
          isEditing={!!editingMethod}
        />
      )}
    </div>
  );
};

export default ContactMethodsList;