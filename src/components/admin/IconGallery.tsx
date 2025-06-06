import React from 'react';
import { Check } from 'lucide-react';
import { IconOption } from '../../store/iconStore';

interface IconGalleryProps {
  icons: IconOption[];
  selectedIcon: IconOption;
  onSelectIcon: (icon: IconOption) => void;
  title: string;
}

const IconGallery: React.FC<IconGalleryProps> = ({
  icons,
  selectedIcon,
  onSelectIcon,
  title
}) => {
  return (
    <div className="mb-8">
      <h4 className="text-lg font-semibold text-text-primary mb-5 flex items-center">
        <div className="w-2 h-2 bg-accent rounded-full mr-3"></div>
        {title}
      </h4>
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
        {icons.map((icon) => (
          <button
            key={icon.id}
            onClick={() => onSelectIcon(icon)}
            className={`
              relative p-3 rounded-lg border-2 transition-all duration-200 
              hover:scale-105 hover:shadow-md group
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
                  onError={(e) => {
                    // Fallback para iconos que no existen
                    const target = e.target as HTMLImageElement;
                    target.src = '/escudo.png';
                  }}
                />
              </div>
              <span className="text-xs text-text-muted text-center leading-tight">
                {icon.name}
              </span>
            </div>
            
            {selectedIcon.id === icon.id && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default IconGallery;