// Tipos para campos de formulario
export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'stars-5' 
  | 'stars-10' 
  | 'number' 
  | 'select' 
  | 'checkbox' 
  | 'email' 
  | 'date';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: string[]; // Para select y checkbox
  min?: number; // Para number y stars
  max?: number; // Para number y stars
  placeholder?: string;
  order: number;
}

export interface DynamicForm {
  _id?: string;
  title: string;
  description?: string;
  fields: FormField[];
  eventId: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  activatedAt?: Date;
  deactivatedAt?: Date;
}

export interface FormResponse {
  _id?: string;
  formId: string;
  eventId: string;
  responses: Record<string, any>; // fieldId -> value
  participantInfo?: {
    name?: string;
    email?: string;
    participantId?: string;
  };
  submittedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  processingStatus: 'pending' | 'processed' | 'error';
  sentToReviews: boolean;
  reviewId?: string;
}

export interface FormStats {
  totalResponses: number;
  todayResponses: number;
  isActive: boolean;
  createdAt: Date;
  lastActivated?: Date;
}

export interface FormWithStats extends DynamicForm {
  stats: FormStats;
}

export interface ResponseSummary {
  formTitle: string;
  submittedAt: Date;
  participantName: string;
  responses: Record<string, {
    type: FieldType;
    value: any;
    formatted: string;
  }>;
}

// Tipos para validación
export interface FieldValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern';
  value?: any;
  message: string;
}

export interface FormValidationError {
  fieldId: string;
  fieldLabel: string;
  message: string;
}

// Tipos para el constructor de formularios
export interface FieldTemplate {
  type: FieldType;
  label: string;
  icon: string;
  description: string;
  defaultConfig: Partial<FormField>;
}

export interface FormBuilderState {
  currentForm: Partial<DynamicForm>;
  selectedField: FormField | null;
  draggedField: FieldTemplate | null;
  isPreviewMode: boolean;
  validationErrors: FormValidationError[];
}

// Tipos para eventos de Socket.IO
export interface SocketFormEvents {
  'audienceForm:created': (data: { formId: string; eventId: string; title: string }) => void;
  'audienceForm:updated': (data: { formId: string; eventId: string }) => void;
  'audienceForm:activated': (data: { formId: string; eventId: string; form: DynamicForm }) => void;
  'audienceForm:deactivated': (data: { formId: string; eventId: string }) => void;
  'audienceForm:deleted': (data: { formId: string; eventId: string }) => void;
  'audienceForm:newResponse': (data: { 
    formId: string; 
    eventId: string; 
    responseId: string; 
    participantName: string 
  }) => void;
  'audienceForm:statusUpdate': (data: { formId: string; isActive: boolean }) => void;
}

// Tipos para análisis y estadísticas
export interface FieldAnalytics {
  fieldId: string;
  fieldLabel: string;
  fieldType: FieldType;
  totalResponses: number;
  uniqueResponses: number;
  averageValue?: number; // Para campos numéricos
  distribution?: Record<string, number>; // Para opciones múltiples
  mostCommon?: string; // Valor más común
}

export interface FormAnalytics {
  formId: string;
  formTitle: string;
  totalResponses: number;
  completionRate: number;
  averageCompletionTime?: number;
  fieldAnalytics: FieldAnalytics[];
  responsesByDay: Record<string, number>;
}

// Tipos para exportación
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  includeAnalytics: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  fields?: string[]; // IDs de campos específicos a exportar
}

export interface ExportResult {
  filename: string;
  url: string;
  size: number;
  recordCount: number;
}

// Constantes útiles
export const FIELD_TYPES: Record<FieldType, FieldTemplate> = {
  text: {
    type: 'text',
    label: 'Texto Corto',
    icon: 'Type',
    description: 'Campo de texto de una línea',
    defaultConfig: {
      placeholder: 'Ingrese su respuesta...',
      required: false
    }
  },
  textarea: {
    type: 'textarea',
    label: 'Texto Largo',
    icon: 'AlignLeft',
    description: 'Campo de texto multilínea',
    defaultConfig: {
      placeholder: 'Escriba su comentario...',
      required: false
    }
  },
  'stars-5': {
    type: 'stars-5',
    label: 'Estrellas (1-5)',
    icon: 'Star',
    description: 'Calificación con estrellas del 1 al 5',
    defaultConfig: {
      min: 1,
      max: 5,
      required: false
    }
  },
  'stars-10': {
    type: 'stars-10',
    label: 'Estrellas (1-10)',
    icon: 'Star',
    description: 'Calificación con estrellas del 1 al 10',
    defaultConfig: {
      min: 1,
      max: 10,
      required: false
    }
  },
  number: {
    type: 'number',
    label: 'Número',
    icon: 'Hash',
    description: 'Campo numérico con rango personalizable',
    defaultConfig: {
      min: 0,
      max: 100,
      required: false
    }
  },
  select: {
    type: 'select',
    label: 'Opción Múltiple',
    icon: 'ChevronDown',
    description: 'Lista desplegable con opciones',
    defaultConfig: {
      options: ['Opción 1', 'Opción 2', 'Opción 3'],
      required: false
    }
  },
  checkbox: {
    type: 'checkbox',
    label: 'Casillas de Verificación',
    icon: 'CheckSquare',
    description: 'Múltiples opciones seleccionables',
    defaultConfig: {
      options: ['Opción 1', 'Opción 2', 'Opción 3'],
      required: false
    }
  },
  email: {
    type: 'email',
    label: 'Email',
    icon: 'Mail',
    description: 'Campo de correo electrónico',
    defaultConfig: {
      placeholder: 'ejemplo@correo.com',
      required: false
    }
  },
  date: {
    type: 'date',
    label: 'Fecha',
    icon: 'Calendar',
    description: 'Selector de fecha',
    defaultConfig: {
      required: false
    }
  }
};

export const VALIDATION_MESSAGES = {
  required: 'Este campo es obligatorio',
  email: 'Ingrese un email válido',
  min: 'El valor debe ser mayor o igual a {min}',
  max: 'El valor debe ser menor o igual a {max}',
  minLength: 'Debe tener al menos {min} caracteres',
  maxLength: 'No puede exceder {max} caracteres',
  pattern: 'El formato no es válido'
};