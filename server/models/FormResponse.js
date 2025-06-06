import mongoose from 'mongoose';

const formResponseSchema = new mongoose.Schema({
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DynamicForm',
    required: [true, 'Form ID is required']
  },
  eventId: {
    type: String,
    required: [true, 'Event ID is required'],
    trim: true
  },
  responses: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    validate: {
      validator: function(responses) {
        return responses && typeof responses === 'object' && Object.keys(responses).length > 0;
      },
      message: 'Responses cannot be empty'
    }
  },
  participantInfo: {
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    participantId: {
      type: String,
      trim: true
    }
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processed', 'error'],
    default: 'pending'
  },
  sentToReviews: {
    type: Boolean,
    default: false
  },
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }
});

// Índices para optimizar consultas
formResponseSchema.index({ formId: 1, submittedAt: -1 });
formResponseSchema.index({ eventId: 1, submittedAt: -1 });
formResponseSchema.index({ 'participantInfo.email': 1 });
formResponseSchema.index({ processingStatus: 1 });
formResponseSchema.index({ sentToReviews: 1 });

// Método para validar respuestas contra el esquema del formulario
formResponseSchema.methods.validateAgainstForm = async function() {
  const DynamicForm = mongoose.model('DynamicForm');
  const form = await DynamicForm.findById(this.formId);
  
  if (!form) {
    throw new Error('Form not found');
  }
  
  const errors = [];
  const responses = this.responses;
  
  // Validar cada campo del formulario
  form.fields.forEach(field => {
    const value = responses[field.id];
    
    // Validar campos requeridos
    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push(`Field "${field.label}" is required`);
      return;
    }
    
    // Si el campo no es requerido y está vacío, no validar más
    if (!field.required && (value === undefined || value === null || value === '')) {
      return;
    }
    
    // Validaciones específicas por tipo
    switch (field.type) {
      case 'email':
        if (value && !/^\S+@\S+\.\S+$/.test(value)) {
          errors.push(`Field "${field.label}" must be a valid email`);
        }
        break;
        
      case 'number':
        if (value && isNaN(Number(value))) {
          errors.push(`Field "${field.label}" must be a number`);
        } else if (value) {
          const numValue = Number(value);
          if (field.min !== undefined && numValue < field.min) {
            errors.push(`Field "${field.label}" must be at least ${field.min}`);
          }
          if (field.max !== undefined && numValue > field.max) {
            errors.push(`Field "${field.label}" must be at most ${field.max}`);
          }
        }
        break;
        
      case 'stars-5':
        if (value && (isNaN(Number(value)) || Number(value) < 1 || Number(value) > 5)) {
          errors.push(`Field "${field.label}" must be a number between 1 and 5`);
        }
        break;
        
      case 'stars-10':
        if (value && (isNaN(Number(value)) || Number(value) < 1 || Number(value) > 10)) {
          errors.push(`Field "${field.label}" must be a number between 1 and 10`);
        }
        break;
        
      case 'select':
        if (value && field.options && !field.options.includes(value)) {
          errors.push(`Field "${field.label}" must be one of the provided options`);
        }
        break;
        
      case 'checkbox':
        if (value && Array.isArray(value)) {
          const invalidOptions = value.filter(v => !field.options.includes(v));
          if (invalidOptions.length > 0) {
            errors.push(`Field "${field.label}" contains invalid options: ${invalidOptions.join(', ')}`);
          }
        } else if (value && !Array.isArray(value)) {
          errors.push(`Field "${field.label}" must be an array for checkbox type`);
        }
        break;
        
      case 'date':
        if (value && isNaN(Date.parse(value))) {
          errors.push(`Field "${field.label}" must be a valid date`);
        }
        break;
        
      case 'text':
      case 'textarea':
        if (value && typeof value !== 'string') {
          errors.push(`Field "${field.label}" must be text`);
        }
        break;
    }
  });
  
  return errors;
};

// Método para convertir a formato de Review
formResponseSchema.methods.toReviewFormat = async function() {
  const DynamicForm = mongoose.model('DynamicForm');
  const form = await DynamicForm.findById(this.formId);
  
  if (!form) {
    throw new Error('Form not found');
  }
  
  // Buscar campo de rating (estrellas)
  let rating = null;
  const ratingField = form.fields.find(f => f.type.startsWith('stars-'));
  if (ratingField && this.responses[ratingField.id]) {
    rating = Number(this.responses[ratingField.id]);
    // Normalizar a escala de 10
    if (ratingField.type === 'stars-5') {
      rating = (rating / 5) * 10;
    }
  }
  
  // Buscar campo de comentario
  let comment = '';
  const commentField = form.fields.find(f => f.type === 'textarea' || f.type === 'text');
  if (commentField && this.responses[commentField.id]) {
    comment = this.responses[commentField.id];
  }
  
  // Crear objeto de review
  const reviewData = {
    eventId: this.eventId,
    formId: this.formId,
    formTitle: form.title,
    structuredData: this.responses,
    rating: rating,
    comment: comment,
    authorId: this.participantInfo.participantId || this.participantInfo.email || 'anonymous',
    isAnonymous: !this.participantInfo.name && !this.participantInfo.email,
    createdAt: this.submittedAt
  };
  
  return reviewData;
};

// Método para obtener resumen de respuesta
formResponseSchema.methods.getSummary = async function() {
  const DynamicForm = mongoose.model('DynamicForm');
  const form = await DynamicForm.findById(this.formId);
  
  if (!form) {
    return { error: 'Form not found' };
  }
  
  const summary = {
    formTitle: form.title,
    submittedAt: this.submittedAt,
    participantName: this.participantInfo.name || 'Anónimo',
    responses: {}
  };
  
  // Procesar cada respuesta
  form.fields.forEach(field => {
    const value = this.responses[field.id];
    if (value !== undefined && value !== null && value !== '') {
      summary.responses[field.label] = {
        type: field.type,
        value: value,
        formatted: this.formatValue(field, value)
      };
    }
  });
  
  return summary;
};

// Método auxiliar para formatear valores
formResponseSchema.methods.formatValue = function(field, value) {
  switch (field.type) {
    case 'stars-5':
    case 'stars-10':
      return `${value} ${value === 1 ? 'estrella' : 'estrellas'}`;
    case 'checkbox':
      return Array.isArray(value) ? value.join(', ') : value;
    case 'date':
      return new Date(value).toLocaleDateString('es-ES');
    case 'email':
      return value;
    default:
      return value;
  }
};

const FormResponse = mongoose.model('FormResponse', formResponseSchema);

export default FormResponse;