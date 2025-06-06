import express from 'express';
import DynamicForm from './models/DynamicForm.js';
import FormResponse from './models/FormResponse.js';
import Review from './models/Review.js';

const router = express.Router();

// Middleware para hacer el objeto io disponible en req.app
router.use((req, res, next) => {
  if (!req.app.get('io')) {
    // Si no hay io disponible, continuar sin emitir eventos
    console.warn('Socket.IO not available in form-builder routes');
  }
  next();
});

// POST /api/form-builder/forms - Crear nuevo formulario dinámico
router.post('/forms', async (req, res) => {
  try {
    const { title, description, fields, eventId, createdBy } = req.body;

    // Validación básica
    if (!title || !fields || !eventId || !createdBy) {
      return res.status(400).json({ 
        message: 'Title, fields, eventId, and createdBy are required' 
      });
    }

    if (!Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ 
        message: 'Fields must be a non-empty array' 
      });
    }

    // Crear formulario
    const newForm = new DynamicForm({
      title,
      description,
      fields,
      eventId,
      createdBy
    });

    // Validar configuración de campos
    const validationErrors = newForm.validateFieldConfiguration();
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Field configuration errors',
        errors: validationErrors 
      });
    }

    const savedForm = await newForm.save();
    
    // Emitir evento de socket
    if (req.app.get('io')) {
      req.app.get('io').emit('audienceForm:created', {
        formId: savedForm._id,
        eventId: savedForm.eventId,
        title: savedForm.title
      });
    }

    res.status(201).json({ 
      message: 'Form created successfully', 
      form: savedForm 
    });
  } catch (error) {
    console.error('Error creating form:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: 'Validation Error', errors: messages });
    }
    res.status(500).json({ message: 'Server error while creating form' });
  }
});

// GET /api/form-builder/forms/:eventId - Obtener formularios de un evento
router.get('/forms/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { includeStats } = req.query;

    const forms = await DynamicForm.find({ eventId }).sort({ createdAt: -1 });
    
    if (includeStats === 'true') {
      const formsWithStats = await Promise.all(
        forms.map(async (form) => {
          const stats = await form.getStats();
          return {
            ...form.toObject(),
            stats
          };
        })
      );
      return res.json(formsWithStats);
    }

    res.json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ message: 'Server error while fetching forms' });
  }
});

// GET /api/form-builder/forms/single/:formId - Obtener formulario específico
router.get('/forms/single/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    
    const form = await DynamicForm.findById(formId);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    res.json(form);
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({ message: 'Server error while fetching form' });
  }
});

// PUT /api/form-builder/forms/:formId - Actualizar formulario
router.put('/forms/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    const { title, description, fields } = req.body;

    const form = await DynamicForm.findById(formId);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // No permitir edición si el formulario está activo
    if (form.isActive) {
      return res.status(400).json({ 
        message: 'Cannot edit active form. Deactivate first.' 
      });
    }

    // Actualizar campos
    if (title) form.title = title;
    if (description !== undefined) form.description = description;
    if (fields) {
      form.fields = fields;
      
      // Validar nueva configuración
      const validationErrors = form.validateFieldConfiguration();
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          message: 'Field configuration errors',
          errors: validationErrors 
        });
      }
    }

    const updatedForm = await form.save();

    // Emitir evento de socket
    if (req.app.get('io')) {
      req.app.get('io').emit('audienceForm:updated', {
        formId: updatedForm._id,
        eventId: updatedForm.eventId
      });
    }

    res.json({ 
      message: 'Form updated successfully', 
      form: updatedForm 
    });
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ message: 'Server error while updating form' });
  }
});

// POST /api/form-builder/forms/:formId/activate - Activar formulario
router.post('/forms/:formId/activate', async (req, res) => {
  try {
    const { formId } = req.params;

    // Desactivar otros formularios del mismo evento
    const form = await DynamicForm.findById(formId);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // Desactivar otros formularios activos del mismo evento
    await DynamicForm.updateMany(
      { eventId: form.eventId, isActive: true },
      { 
        isActive: false, 
        deactivatedAt: new Date() 
      }
    );

    // Activar el formulario solicitado
    form.isActive = true;
    form.activatedAt = new Date();
    await form.save();

    // Emitir evento de socket
    if (req.app.get('io')) {
      req.app.get('io').emit('audienceForm:activated', {
        formId: form._id,
        eventId: form.eventId,
        form: form
      });
    }

    res.json({ 
      message: 'Form activated successfully', 
      form: form 
    });
  } catch (error) {
    console.error('Error activating form:', error);
    res.status(500).json({ message: 'Server error while activating form' });
  }
});

// POST /api/form-builder/forms/:formId/deactivate - Desactivar formulario
router.post('/forms/:formId/deactivate', async (req, res) => {
  try {
    const { formId } = req.params;

    const form = await DynamicForm.findById(formId);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    form.isActive = false;
    form.deactivatedAt = new Date();
    await form.save();

    // Emitir evento de socket
    if (req.app.get('io')) {
      req.app.get('io').emit('audienceForm:deactivated', {
        formId: form._id,
        eventId: form.eventId
      });
    }

    res.json({ 
      message: 'Form deactivated successfully', 
      form: form 
    });
  } catch (error) {
    console.error('Error deactivating form:', error);
    res.status(500).json({ message: 'Server error while deactivating form' });
  }
});

// DELETE /api/form-builder/forms/:formId - Eliminar formulario
router.delete('/forms/:formId', async (req, res) => {
  try {
    const { formId } = req.params;

    const form = await DynamicForm.findById(formId);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // No permitir eliminación si tiene respuestas
    const responseCount = await FormResponse.countDocuments({ formId });
    if (responseCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete form with ${responseCount} responses. Archive instead.` 
      });
    }

    await DynamicForm.findByIdAndDelete(formId);

    // Emitir evento de socket
    if (req.app.get('io')) {
      req.app.get('io').emit('audienceForm:deleted', {
        formId: formId,
        eventId: form.eventId
      });
    }

    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ message: 'Server error while deleting form' });
  }
});

// POST /api/form-builder/responses - Enviar respuesta de formulario
router.post('/responses', async (req, res) => {
  try {
    const { formId, responses, participantInfo } = req.body;

    if (!formId || !responses) {
      return res.status(400).json({ 
        message: 'FormId and responses are required' 
      });
    }

    // Verificar que el formulario existe y está activo
    const form = await DynamicForm.findById(formId);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    if (!form.isActive) {
      return res.status(400).json({ 
        message: 'Form is not currently active' 
      });
    }

    // Crear respuesta
    const formResponse = new FormResponse({
      formId,
      eventId: form.eventId,
      responses,
      participantInfo: participantInfo || {},
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Validar respuestas contra el esquema del formulario
    const validationErrors = await formResponse.validateAgainstForm();
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Response validation errors',
        errors: validationErrors 
      });
    }

    const savedResponse = await formResponse.save();

    // Procesar y enviar a Reviews en background
    processResponseToReviews(savedResponse._id);

    // Emitir evento de socket
    if (req.app.get('io')) {
      req.app.get('io').emit('audienceForm:newResponse', {
        formId: form._id,
        eventId: form.eventId,
        responseId: savedResponse._id,
        participantName: participantInfo?.name || 'Anónimo'
      });
    }

    res.status(201).json({ 
      message: 'Response submitted successfully',
      responseId: savedResponse._id
    });
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ message: 'Server error while submitting response' });
  }
});

// GET /api/form-builder/responses/:formId - Obtener respuestas de un formulario
router.get('/responses/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    const { page = 1, limit = 50, summary = false } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const responses = await FormResponse.find({ formId })
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await FormResponse.countDocuments({ formId });

    if (summary === 'true') {
      const summaries = await Promise.all(
        responses.map(response => response.getSummary())
      );
      return res.json({
        responses: summaries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    }

    res.json({
      responses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ message: 'Server error while fetching responses' });
  }
});

// GET /api/form-builder/active/:eventId - Obtener formulario activo de un evento
router.get('/active/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    const activeForm = await DynamicForm.findOne({ 
      eventId, 
      isActive: true 
    });

    if (!activeForm) {
      return res.status(404).json({ message: 'No active form found for this event' });
    }

    res.json(activeForm);
  } catch (error) {
    console.error('Error fetching active form:', error);
    res.status(500).json({ message: 'Server error while fetching active form' });
  }
});

// Función auxiliar para procesar respuestas a Reviews (background)
async function processResponseToReviews(responseId) {
  try {
    const response = await FormResponse.findById(responseId);
    if (!response || response.sentToReviews) {
      return;
    }

    // Convertir a formato de Review
    const reviewData = await response.toReviewFormat();

    // Crear Review
    const review = new Review(reviewData);
    const savedReview = await review.save();

    // Marcar como procesado
    response.sentToReviews = true;
    response.reviewId = savedReview._id;
    response.processingStatus = 'processed';
    await response.save();

    console.log(`Response ${responseId} processed to Review ${savedReview._id}`);
  } catch (error) {
    console.error(`Error processing response ${responseId} to Reviews:`, error);
    
    // Marcar como error
    await FormResponse.findByIdAndUpdate(responseId, {
      processingStatus: 'error'
    });
  }
}

export default router;