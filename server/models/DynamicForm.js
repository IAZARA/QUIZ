import mongoose from 'mongoose';

const formFieldSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['text', 'textarea', 'stars-5', 'stars-10', 'number', 'select', 'checkbox', 'email', 'date']
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  required: {
    type: Boolean,
    default: false
  },
  options: [{
    type: String,
    trim: true
  }], // Para select y checkbox
  min: {
    type: Number
  }, // Para number y stars
  max: {
    type: Number
  }, // Para number y stars
  placeholder: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    required: true,
    default: 0
  }
});

const dynamicFormSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Form title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  fields: {
    type: [formFieldSchema],
    required: true,
    validate: {
      validator: function(fields) {
        return fields && fields.length > 0;
      },
      message: 'Form must have at least one field'
    }
  },
  eventId: {
    type: String,
    required: [true, 'Event ID is required'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: String,
    required: [true, 'Creator ID is required'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  activatedAt: {
    type: Date
  },
  deactivatedAt: {
    type: Date
  }
});

// Índices para optimizar consultas
dynamicFormSchema.index({ eventId: 1, isActive: 1 });
dynamicFormSchema.index({ createdBy: 1 });
dynamicFormSchema.index({ createdAt: -1 });

// Middleware para actualizar updatedAt
dynamicFormSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Método para validar configuración de campos
dynamicFormSchema.methods.validateFieldConfiguration = function() {
  const errors = [];
  
  this.fields.forEach((field, index) => {
    // Validar opciones para select y checkbox
    if (['select', 'checkbox'].includes(field.type)) {
      if (!field.options || field.options.length === 0) {
        errors.push(`Field "${field.label}" of type "${field.type}" must have options`);
      }
    }
    
    // Validar rangos para number y stars
    if (['number', 'stars-5', 'stars-10'].includes(field.type)) {
      if (field.type === 'stars-5' && (field.min < 1 || field.max > 5)) {
        errors.push(`Field "${field.label}" of type "stars-5" must have min >= 1 and max <= 5`);
      }
      if (field.type === 'stars-10' && (field.min < 1 || field.max > 10)) {
        errors.push(`Field "${field.label}" of type "stars-10" must have min >= 1 and max <= 10`);
      }
      if (field.min !== undefined && field.max !== undefined && field.min > field.max) {
        errors.push(`Field "${field.label}" min value cannot be greater than max value`);
      }
    }
    
    // Validar IDs únicos
    const duplicateIds = this.fields.filter(f => f.id === field.id);
    if (duplicateIds.length > 1) {
      errors.push(`Duplicate field ID "${field.id}" found`);
    }
  });
  
  return errors;
};

// Método para obtener estadísticas del formulario
dynamicFormSchema.methods.getStats = async function() {
  const FormResponse = mongoose.model('FormResponse');
  
  const totalResponses = await FormResponse.countDocuments({ formId: this._id });
  const todayResponses = await FormResponse.countDocuments({
    formId: this._id,
    submittedAt: {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      $lt: new Date(new Date().setHours(23, 59, 59, 999))
    }
  });
  
  return {
    totalResponses,
    todayResponses,
    isActive: this.isActive,
    createdAt: this.createdAt,
    lastActivated: this.activatedAt
  };
};

const DynamicForm = mongoose.model('DynamicForm', dynamicFormSchema);

export default DynamicForm;