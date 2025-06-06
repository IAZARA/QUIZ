import React from 'react';
import { Trash2 } from 'lucide-react';
import { useIconStore, IconOption } from '../../store/iconStore';
import IconGallery from './IconGallery';
import IconUploader from './IconUploader';

const IconSelector: React.FC = () => {
  const {
    selectedIcon,
    predefinedIcons,
    customIcons,
    setSelectedIcon,
    addCustomIcon,
    removeCustomIcon
  } = useIconStore();

  const handleSelectIcon = (icon: IconOption) => {
    setSelectedIcon(icon);
  };

  const handleUploadIcon = (icon: IconOption) => {
    addCustomIcon(icon);
    setSelectedIcon(icon); // Seleccionar automáticamente el icono subido
  };

  const handleRemoveCustomIcon = (iconId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este icono personalizado?')) {
      removeCustomIcon(iconId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Vista previa del icono seleccionado */}
      <div className="bg-bg-secondary border border-border rounded-xl p-6 shadow-sm micro-hover">
        <h4 className="text-lg font-semibold text-text-primary mb-4">Icono Actual</h4>
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-gradient-to-br from-bg-tertiary to-bg-primary rounded-xl flex items-center justify-center border border-border shadow-inner">
            <img
              src={selectedIcon.path}
              alt={selectedIcon.name}
              className="w-14 h-14 object-contain drop-shadow-sm"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/escudo.png';
              }}
            />
          </div>
          <div>
            <p className="font-semibold text-text-primary text-lg">{selectedIcon.name}</p>
            <p className="text-sm text-text-secondary mt-1">
              {selectedIcon.type === 'predefined' ? 'Icono predefinido' : 'Icono personalizado'}
            </p>
          </div>
        </div>
      </div>

      {/* Galería de iconos predefinidos */}
      <IconGallery
        icons={predefinedIcons}
        selectedIcon={selectedIcon}
        onSelectIcon={handleSelectIcon}
        title="Iconos Predefinidos"
      />

      {/* Subir icono personalizado */}
      <IconUploader onUpload={handleUploadIcon} />

      {/* Galería de iconos personalizados */}
      {customIcons.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-text-primary">Iconos Personalizados</h4>
            <p className="text-sm text-text-muted">{customIcons.length} icono(s)</p>
          </div>
          
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {customIcons.map((icon) => (
              <div key={icon.id} className="relative group">
                <button
                  onClick={() => handleSelectIcon(icon)}
                  className={`
                    relative p-3 rounded-lg border-2 transition-all duration-200 
                    hover:scale-105 hover:shadow-md w-full
                    ${selectedIcon.id === icon.id 
                      ? 'border-accent bg-accent/10 shadow-lg' 
                      : 'border-border hover:border-accent/50 bg-bg-secondary'
                    }
                  `}
                  title={icon.name}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <img
                        src={icon.path}
                        alt={icon.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-xs text-text-muted text-center leading-tight">
                      {icon.name}
                    </span>
                  </div>
                </button>
                
                {/* Botón de eliminar */}
                <button
                  onClick={() => handleRemoveCustomIcon(icon.id)}
                  className="
                    absolute -top-1 -right-1 w-5 h-5 bg-error rounded-full 
                    flex items-center justify-center opacity-0 group-hover:opacity-100 
                    transition-opacity duration-200 hover:bg-error/80
                  "
                  title="Eliminar icono"
                >
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="bg-gradient-to-r from-accent/5 to-accent-blue-light/5 border border-accent/20 rounded-xl p-6">
        <h5 className="text-base font-semibold text-text-primary mb-3 flex items-center">
          <div className="w-2 h-2 bg-accent rounded-full mr-2"></div>
          Información
        </h5>
        <ul className="text-sm text-text-secondary space-y-2">
          <li className="flex items-start">
            <span className="text-accent mr-2">•</span>
            El icono seleccionado aparecerá en la pantalla de espera
          </li>
          <li className="flex items-start">
            <span className="text-accent mr-2">•</span>
            Los iconos personalizados se guardan en tu navegador
          </li>
          <li className="flex items-start">
            <span className="text-accent mr-2">•</span>
            Formatos soportados: PNG, JPG, SVG (máximo 2MB)
          </li>
          <li className="flex items-start">
            <span className="text-accent mr-2">•</span>
            Para mejores resultados, usa imágenes cuadradas
          </li>
        </ul>
      </div>
    </div>
  );
};

export default IconSelector;