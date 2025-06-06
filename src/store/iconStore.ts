import { create } from 'zustand';

export interface IconOption {
  id: string;
  name: string;
  path: string;
  type: 'predefined' | 'custom';
  preview?: string;
}

interface IconState {
  selectedIcon: IconOption;
  predefinedIcons: IconOption[];
  customIcons: IconOption[];
  setSelectedIcon: (icon: IconOption) => void;
  addCustomIcon: (icon: IconOption) => void;
  removeCustomIcon: (iconId: string) => void;
  initializeStore: () => void;
}

// Iconos predefinidos
const defaultPredefinedIcons: IconOption[] = [
  {
    id: 'escudo-default',
    name: 'Escudo Universitario',
    path: '/escudo.png',
    type: 'predefined'
  },
  {
    id: 'book-open',
    name: 'Libro Abierto',
    path: '/icons/book-open.svg',
    type: 'predefined'
  },
  {
    id: 'graduation-cap',
    name: 'Birrete de Graduación',
    path: '/icons/graduation-cap.svg',
    type: 'predefined'
  },
  {
    id: 'lightbulb',
    name: 'Bombilla (Conocimiento)',
    path: '/icons/lightbulb.svg',
    type: 'predefined'
  },
  {
    id: 'brain',
    name: 'Cerebro (Inteligencia)',
    path: '/icons/brain.svg',
    type: 'predefined'
  },
  {
    id: 'star',
    name: 'Estrella (Excelencia)',
    path: '/icons/star.svg',
    type: 'predefined'
  },
  {
    id: 'globe',
    name: 'Globo (Educación Global)',
    path: '/icons/globe.svg',
    type: 'predefined'
  },
  {
    id: 'quiz',
    name: 'Quiz Interactivo',
    path: '/icons/quiz.svg',
    type: 'predefined'
  }
];

export const useIconStore = create<IconState>((set, get) => ({
  selectedIcon: defaultPredefinedIcons[0], // Escudo por defecto
  predefinedIcons: defaultPredefinedIcons,
  customIcons: [],

  setSelectedIcon: (icon: IconOption) => {
    localStorage.setItem('selectedIcon', JSON.stringify(icon));
    set({ selectedIcon: icon });
  },

  addCustomIcon: (icon: IconOption) => {
    const { customIcons } = get();
    const newCustomIcons = [...customIcons, icon];
    localStorage.setItem('customIcons', JSON.stringify(newCustomIcons));
    set({ customIcons: newCustomIcons });
  },

  removeCustomIcon: (iconId: string) => {
    const { customIcons, selectedIcon } = get();
    const newCustomIcons = customIcons.filter(icon => icon.id !== iconId);
    localStorage.setItem('customIcons', JSON.stringify(newCustomIcons));
    
    // Si el icono eliminado era el seleccionado, volver al por defecto
    if (selectedIcon.id === iconId) {
      const defaultIcon = defaultPredefinedIcons[0];
      localStorage.setItem('selectedIcon', JSON.stringify(defaultIcon));
      set({ customIcons: newCustomIcons, selectedIcon: defaultIcon });
    } else {
      set({ customIcons: newCustomIcons });
    }
  },

  initializeStore: () => {
    try {
      // Cargar icono seleccionado desde localStorage
      const savedIcon = localStorage.getItem('selectedIcon');
      if (savedIcon) {
        const parsedIcon = JSON.parse(savedIcon);
        set({ selectedIcon: parsedIcon });
      }

      // Cargar iconos personalizados desde localStorage
      const savedCustomIcons = localStorage.getItem('customIcons');
      if (savedCustomIcons) {
        const parsedCustomIcons = JSON.parse(savedCustomIcons);
        set({ customIcons: parsedCustomIcons });
      }
    } catch (error) {
      console.error('Error al inicializar el store de iconos:', error);
      // En caso de error, usar valores por defecto
      set({ 
        selectedIcon: defaultPredefinedIcons[0],
        customIcons: []
      });
    }
  }
}));

// Inicializar el store al cargar
if (typeof window !== 'undefined') {
  useIconStore.getState().initializeStore();
}