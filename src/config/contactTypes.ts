import { ContactTypeConfig } from '../types';

export const CONTACT_TYPES: ContactTypeConfig[] = [
  {
    type: 'email',
    label: 'Email',
    icon: 'Mail',
    placeholder: 'ejemplo@correo.com',
    validation: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    urlTemplate: 'mailto:{value}'
  },
  {
    type: 'phone',
    label: 'Teléfono',
    icon: 'Phone',
    placeholder: '+5491112345678',
    validation: /^\+[1-9]\d{1,14}$/,
    urlTemplate: 'tel:{value}'
  },
  {
    type: 'whatsapp',
    label: 'WhatsApp',
    icon: 'MessageCircle',
    placeholder: '+5491112345678',
    validation: /^\+[1-9]\d{1,14}$/,
    urlTemplate: 'https://wa.me/{value}'
  },
  {
    type: 'linkedin',
    label: 'LinkedIn',
    icon: 'Linkedin',
    placeholder: 'usuario-linkedin',
    validation: /^[a-zA-Z0-9-]+$/,
    urlTemplate: 'https://linkedin.com/in/{value}'
  },
  {
    type: 'facebook',
    label: 'Facebook',
    icon: 'Facebook',
    placeholder: 'usuario.facebook',
    validation: /^[a-zA-Z0-9.]+$/,
    urlTemplate: 'https://facebook.com/{value}'
  },
  {
    type: 'instagram',
    label: 'Instagram',
    icon: 'Instagram',
    placeholder: 'usuario_instagram',
    validation: /^[a-zA-Z0-9_.]+$/,
    urlTemplate: 'https://instagram.com/{value}'
  },
  {
    type: 'twitter',
    label: 'Twitter/X',
    icon: 'Twitter',
    placeholder: 'usuario_twitter',
    validation: /^[a-zA-Z0-9_]+$/,
    urlTemplate: 'https://twitter.com/{value}'
  },
  {
    type: 'discord',
    label: 'Discord',
    icon: 'MessageSquare',
    placeholder: 'usuario#1234',
    validation: /^.{2,32}#[0-9]{4}$/,
    urlTemplate: undefined // Discord no tiene URL directa
  },
  {
    type: 'reddit',
    label: 'Reddit',
    icon: 'MessageSquareMore',
    placeholder: 'usuario_reddit',
    validation: /^[a-zA-Z0-9_-]+$/,
    urlTemplate: 'https://reddit.com/u/{value}'
  },
  {
    type: 'youtube',
    label: 'YouTube',
    icon: 'Play',
    placeholder: '@canalyoutube',
    validation: /^@?[a-zA-Z0-9_-]+$/,
    urlTemplate: 'https://youtube.com/{value}'
  },
  {
    type: 'tiktok',
    label: 'TikTok',
    icon: 'Music',
    placeholder: '@usuario_tiktok',
    validation: /^@?[a-zA-Z0-9_.]+$/,
    urlTemplate: 'https://tiktok.com/{value}'
  },
  {
    type: 'telegram',
    label: 'Telegram',
    icon: 'Send',
    placeholder: '@usuario_telegram',
    validation: /^@?[a-zA-Z0-9_]+$/,
    urlTemplate: 'https://t.me/{value}'
  }
];

// Función helper para obtener configuración de un tipo
export const getContactTypeConfig = (type: string): ContactTypeConfig | undefined => {
  return CONTACT_TYPES.find(config => config.type === type);
};

// Función helper para generar URL de contacto
export const generateContactUrl = (type: string, value: string): string | undefined => {
  const config = getContactTypeConfig(type);
  if (!config?.urlTemplate) return undefined;
  
  // Limpiar el valor para URLs específicas
  let cleanValue = value;
  if (type === 'whatsapp' || type === 'phone') {
    cleanValue = value.replace(/\+/g, '');
  } else if (type === 'telegram' || type === 'tiktok' || type === 'youtube') {
    cleanValue = value.startsWith('@') ? value : `@${value}`;
  }
  
  return config.urlTemplate.replace('{value}', cleanValue);
};

// Función helper para validar un valor de contacto
export const validateContactValue = (type: string, value: string): boolean => {
  const config = getContactTypeConfig(type);
  if (!config) return false;
  return config.validation.test(value);
};