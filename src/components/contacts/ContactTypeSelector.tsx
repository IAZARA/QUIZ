import React from 'react';
import { ContactMethodType } from '../../types';
import { CONTACT_TYPES } from '../../config/contactTypes';
import { X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface ContactTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: ContactMethodType) => void;
  excludeTypes?: ContactMethodType[];
}

const ContactTypeSelector: React.FC<ContactTypeSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  excludeTypes = []
}) => {
  if (!isOpen) return null;

  const availableTypes = CONTACT_TYPES.filter(
    type => !excludeTypes.includes(type.type)
  );

  const handleSelect = (type: ContactMethodType) => {
    onSelect(type);
    onClose();
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className="h-6 w-6" /> : null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bg-primary rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-color">
          <h3 className="text-lg font-semibold text-text-primary">
            Seleccionar tipo de contacto
          </h3>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 gap-3">
            {availableTypes.map((typeConfig) => (
              <button
                key={typeConfig.type}
                onClick={() => handleSelect(typeConfig.type)}
                className="flex flex-col items-center p-4 rounded-lg border border-border-color hover:border-accent hover:bg-accent/5 transition-all duration-200 group"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors mb-3">
                  <div className="text-accent">
                    {getIcon(typeConfig.icon)}
                  </div>
                </div>
                <span className="text-sm font-medium text-text-primary text-center">
                  {typeConfig.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-color bg-bg-secondary">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-text-secondary hover:text-text-primary border border-border-color rounded-md hover:bg-bg-primary transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactTypeSelector;