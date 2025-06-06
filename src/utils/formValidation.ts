import { FormField, FormValidationError, FieldType } from '../types/formTypes';

export class FormValidator {
  private fields: FormField[];
  private responses: Record<string, any>;

  constructor(fields: FormField[], responses: Record<string, any>) {
    this.fields = fields;
    this.responses = responses;
  }

  // Validar todas las respuestas del formulario
  validateAll(): FormValidationError[] {
    const errors: FormValidationError[] = [];

    this.fields.forEach(field => {
      const fieldErrors = this.validateField(field);
      errors.push(...fieldErrors);
    });

    return errors;
  }

  // Validar un campo específico
  validateField(field: FormField): FormValidationError[] {
    const errors: FormValidationError[] = [];
    const value = this.responses[field.id];

    // Validar campo requerido
    if (field.required && this.isEmpty(value)) {
      errors.push({
        fieldId: field.id,
        fieldLabel: field.label,
        message: 'Este campo es obligatorio'
      });
      return errors; // Si es requerido y está vacío, no validar más
    }

    // Si no es requerido y está vacío, no validar más
    if (!field.required && this.isEmpty(value)) {
      return errors;
    }

    // Validaciones específicas por tipo
    switch (field.type) {
      case 'email':
        if (!this.isValidEmail(value)) {
          errors.push({
            fieldId: field.id,
            fieldLabel: field.label,
            message: 'Ingrese un email válido'
          });
        }
        break;

      case 'number':
        const numErrors = this.validateNumber(field, value);
        errors.push(...numErrors);
        break;

      case 'stars-5':
        const stars5Errors = this.validateStars(field, value, 1, 5);
        errors.push(...stars5Errors);
        break;

      case 'stars-10':
        const stars10Errors = this.validateStars(field, value, 1, 10);
        errors.push(...stars10Errors);
        break;

      case 'select':
        const selectErrors = this.validateSelect(field, value);
        errors.push(...selectErrors);
        break;

      case 'checkbox':
        const checkboxErrors = this.validateCheckbox(field, value);
        errors.push(...checkboxErrors);
        break;

      case 'date':
        const dateErrors = this.validateDate(field, value);
        errors.push(...dateErrors);
        break;

      case 'text':
      case 'textarea':
        const textErrors = this.validateText(field, value);
        errors.push(...textErrors);
        break;
    }

    return errors;
  }

  // Verificar si un valor está vacío
  private isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    return false;
  }

  // Validar email
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validar campo numérico
  private validateNumber(field: FormField, value: any): FormValidationError[] {
    const errors: FormValidationError[] = [];
    const numValue = Number(value);

    if (isNaN(numValue)) {
      errors.push({
        fieldId: field.id,
        fieldLabel: field.label,
        message: 'Debe ser un número válido'
      });
      return errors;
    }

    if (field.min !== undefined && numValue < field.min) {
      errors.push({
        fieldId: field.id,
        fieldLabel: field.label,
        message: `El valor debe ser mayor o igual a ${field.min}`
      });
    }

    if (field.max !== undefined && numValue > field.max) {
      errors.push({
        fieldId: field.id,
        fieldLabel: field.label,
        message: `El valor debe ser menor o igual a ${field.max}`
      });
    }

    return errors;
  }

  // Validar campo de estrellas
  private validateStars(field: FormField, value: any, minStars: number, maxStars: number): FormValidationError[] {
    const errors: FormValidationError[] = [];
    const numValue = Number(value);

    if (isNaN(numValue)) {
      errors.push({
        fieldId: field.id,
        fieldLabel: field.label,
        message: 'Debe seleccionar una calificación válida'
      });
      return errors;
    }

    if (numValue < minStars || numValue > maxStars) {
      errors.push({
        fieldId: field.id,
        fieldLabel: field.label,
        message: `La calificación debe estar entre ${minStars} y ${maxStars}`
      });
    }

    return errors;
  }

  // Validar campo select
  private validateSelect(field: FormField, value: any): FormValidationError[] {
    const errors: FormValidationError[] = [];

    if (!field.options || field.options.length === 0) {
      errors.push({
        fieldId: field.id,
        fieldLabel: field.label,
        message: 'No hay opciones disponibles'
      });
      return errors;
    }

    if (!field.options.includes(value)) {
      errors.push({
        fieldId: field.id,
        fieldLabel: field.label,
        message: 'Debe seleccionar una opción válida'
      });
    }

    return errors;
  }

  // Validar campo checkbox
  private validateCheckbox(field: FormField, value: any): FormValidationError[] {
    const errors: FormValidationError[] = [];

    if (!Array.isArray(value)) {
      errors.push({
        fieldId: field.id,
        fieldLabel: field.label,
        message: 'Debe ser una lista de opciones'
      });
      return errors;
    }

    if (!field.options || field.options.length === 0) {
      errors.push({
        fieldId: field.id,
        fieldLabel: field.label,
        message: 'No hay opciones disponibles'
      });
      return errors;
    }

    const invalidOptions = value.filter(v => !field.options!.includes(v));
    if (invalidOptions.length > 0) {
      errors.push({
        fieldId: field.id,
        fieldLabel: field.label,
        message: `Opciones inválidas: ${invalidOptions.join(', ')}`
      });
    }

    return errors;
  }

  // Validar campo de fecha
  private validateDate(field: FormField, value: any): FormValidationError[] {
    const errors: FormValidationError[] = [];

    if (isNaN(Date.parse(value))) {
      errors.push({
        fieldId: field.id,
        fieldLabel: field.label,
        message: 'Debe ser una fecha válida'
      });
    }

    return errors;
  }

  // Validar campo de texto
  private validateText(field: FormField, value: any): FormValidationError[] {
    const errors: FormValidationError[] = [];

    if (typeof value !== 'string') {
      errors.push({
        fieldId: field.id,
        fieldLabel: field.label,
        message: 'Debe ser texto válido'
      });
      return errors;
    }

    // Validaciones adicionales de longitud si están definidas
    if (field.min !== undefined && value.length < field.min) {
      errors.push({
        fieldId: field.id,
        fieldLabel: field.label,
        message: `Debe tener al menos ${field.min} caracteres`
      });
    }

    if (field.max !== undefined && value.length > field.max) {
      errors.push({
        fieldId: field.id,
        fieldLabel: field.label,
        message: `No puede exceder ${field.max} caracteres`
      });
    }

    return errors;
  }
}

// Función de utilidad para validar un formulario completo
export function validateForm(fields: FormField[], responses: Record<string, any>): FormValidationError[] {
  const validator = new FormValidator(fields, responses);
  return validator.validateAll();
}

// Función de utilidad para validar un campo individual
export function validateSingleField(field: FormField, value: any): FormValidationError[] {
  const validator = new FormValidator([field], { [field.id]: value });
  return validator.validateField(field);
}

// Función para obtener reglas de validación en tiempo real
export function getFieldValidationRules(field: FormField): string[] {
  const rules: string[] = [];

  if (field.required) {
    rules.push('Obligatorio');
  }

  switch (field.type) {
    case 'email':
      rules.push('Formato de email válido');
      break;
    case 'number':
      if (field.min !== undefined && field.max !== undefined) {
        rules.push(`Entre ${field.min} y ${field.max}`);
      } else if (field.min !== undefined) {
        rules.push(`Mínimo ${field.min}`);
      } else if (field.max !== undefined) {
        rules.push(`Máximo ${field.max}`);
      }
      break;
    case 'stars-5':
      rules.push('Calificación del 1 al 5');
      break;
    case 'stars-10':
      rules.push('Calificación del 1 al 10');
      break;
    case 'text':
    case 'textarea':
      if (field.min !== undefined && field.max !== undefined) {
        rules.push(`Entre ${field.min} y ${field.max} caracteres`);
      } else if (field.min !== undefined) {
        rules.push(`Mínimo ${field.min} caracteres`);
      } else if (field.max !== undefined) {
        rules.push(`Máximo ${field.max} caracteres`);
      }
      break;
    case 'select':
      if (field.options && field.options.length > 0) {
        rules.push(`Opciones: ${field.options.join(', ')}`);
      }
      break;
    case 'checkbox':
      if (field.options && field.options.length > 0) {
        rules.push(`Seleccione una o más: ${field.options.join(', ')}`);
      }
      break;
  }

  return rules;
}

// Función para formatear mensajes de error
export function formatValidationErrors(errors: FormValidationError[]): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  errors.forEach(error => {
    if (!formatted[error.fieldId]) {
      formatted[error.fieldId] = [];
    }
    formatted[error.fieldId].push(error.message);
  });

  return formatted;
}

// Función para verificar si hay errores en un campo específico
export function hasFieldErrors(errors: FormValidationError[], fieldId: string): boolean {
  return errors.some(error => error.fieldId === fieldId);
}

// Función para obtener errores de un campo específico
export function getFieldErrors(errors: FormValidationError[], fieldId: string): string[] {
  return errors
    .filter(error => error.fieldId === fieldId)
    .map(error => error.message);
}