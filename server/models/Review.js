import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
  },
  // Campos tradicionales (opcionales para compatibilidad)
  rating: {
    type: Number,
    min: 1,
    max: 10,
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 5000,
  },
  // Campos para formularios dinámicos
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DynamicForm'
  },
  formTitle: {
    type: String,
    trim: true
  },
  structuredData: {
    type: mongoose.Schema.Types.Mixed, // Datos del formulario dinámico
  },
  // Información del autor
  authorId: {
    type: String,
    required: true,
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;
