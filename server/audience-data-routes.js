import express from 'express';
import AudienceData from './models/AudienceData.js';

const router = express.Router();

// POST /api/audience-data - Create new audience data
router.post('/', async (req, res) => {
  try {
    const { name, email, comments } = req.body;

    // Basic validation
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and Email are required.' });
    }

    // More specific email validation can be added here if the model's validation isn't sufficient
    // For example, using a library like validator.js, though the model already has a regex match.

    const newAudienceEntry = new AudienceData({
      name,
      email,
      comments,
    });

    const savedEntry = await newAudienceEntry.save();
    res.status(201).json({ message: 'Data saved successfully', data: savedEntry });
  } catch (error) {
    if (error.name === 'ValidationError') {
      // Mongoose validation error
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: 'Validation Error', errors: messages });
    }
    console.error('Error saving audience data:', error);
    res.status(500).json({ message: 'Server error while saving data.' });
  }
});

// GET /api/audience-data - Fetch all audience data
router.get('/', async (req, res) => {
  try {
    const allData = await AudienceData.find().sort({ createdAt: -1 }); // Sort by newest first
    res.status(200).json(allData);
  } catch (error) {
    console.error('Error fetching audience data:', error);
    res.status(500).json({ message: 'Server error while fetching data.' });
  }
});

// Estado global para controlar si el formulario de datos de audiencia está activo
let isAudienceDataActive = false;

// POST /api/audience-data/status/activate - Activate audience data form
router.post('/status/activate', (req, res) => {
  try {
    isAudienceDataActive = true;
    
    // Emitir evento de Socket.IO para notificar a todos los clientes
    if (req.app.get('io')) {
      req.app.get('io').emit('audienceData:status', { isActive: true });
    }
    
    res.json({ message: 'Audience data form activated', isActive: true });
  } catch (error) {
    console.error('Error activating audience data form:', error);
    res.status(500).json({ error: 'Error activating audience data form' });
  }
});

// POST /api/audience-data/status/deactivate - Deactivate audience data form
router.post('/status/deactivate', (req, res) => {
  try {
    isAudienceDataActive = false;
    
    // Emitir evento de Socket.IO para notificar a todos los clientes
    if (req.app.get('io')) {
      req.app.get('io').emit('audienceData:status', { isActive: false });
    }
    
    res.json({ message: 'Audience data form deactivated', isActive: false });
  } catch (error) {
    console.error('Error deactivating audience data form:', error);
    res.status(500).json({ error: 'Error deactivating audience data form' });
  }
});

// GET /api/audience-data/status - Get current status
router.get('/status', (req, res) => {
  res.json({ isActive: isAudienceDataActive });
});

export default router;
