const express = require('express');
const AudienceData = require('./models/AudienceData'); // Adjust path if your model is elsewhere

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

module.exports = router;
