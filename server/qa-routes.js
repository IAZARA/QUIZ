const express = require('express');
const router = express.Router();
const Question = require('./models/Question'); // Adjust path as necessary

// POST /api/qa/questions - Create a new question
router.post('/questions', async (req, res) => {
  try {
    const { content, participantName, roomCode } = req.body;
    const newQuestion = new Question({
      content,
      participantName,
      roomCode, // Include roomCode if provided
    });
    await newQuestion.save();

    // Emit Socket.IO event for new question (to admins)
    // This requires access to the io instance, which is tricky in a separate routes file.
    // We'll handle emissions in server/index.js after merging routes or by passing io.
    const io = req.app.get('socketio'); // Assuming io is attached to app
    if (io) {
      io.to('admin_qa').emit('new_question', newQuestion);
    }

    res.status(201).json(newQuestion);
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ message: 'Error creating question', error: error.message });
  }
});

// GET /api/qa/questions - Fetch all questions (for Admin)
router.get('/questions', async (req, res) => {
  try {
    const { approved, answered, roomCode } = req.query;
    const filter = {};
    if (approved !== undefined) filter.isApproved = approved === 'true';
    if (answered !== undefined) filter.isAnswered = answered === 'true';
    if (roomCode) filter.roomCode = roomCode;

    const questions = await Question.find(filter).sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Error fetching questions', error: error.message });
  }
});

// PUT /api/qa/questions/:id/approve - Approve a question (for Admin)
router.put('/questions/:id/approve', async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const io = req.app.get('socketio');
    if (io) {
      // Emit to a general audience room, and admin room
      io.to('audience_room').emit('question_approved', question);
      io.to('admin_qa').emit('question_updated', question); // Also inform admins
    }

    res.json(question);
  } catch (error) {
    console.error('Error approving question:', error);
    res.status(500).json({ message: 'Error approving question', error: error.message });
  }
});

// PUT /api/qa/questions/:id/answer - Mark a question as answered (for Admin)
router.put('/questions/:id/answer', async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { isAnswered: true },
      { new: true }
    );
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const io = req.app.get('socketio');
    if (io) {
      io.to('audience_room').emit('question_answered', question);
      io.to('admin_qa').emit('question_updated', question); // Also inform admins
    }
    res.json(question);
  } catch (error) {
    console.error('Error answering question:', error);
    res.status(500).json({ message: 'Error answering question', error: error.message });
  }
});

// GET /api/qa/questions/audience - Fetch approved questions (for Audience)
router.get('/questions/audience', async (req, res) => {
  try {
    const { roomCode } = req.query;
    const filter = { isApproved: true };
    if (roomCode) filter.roomCode = roomCode;

    const questions = await Question.find(filter).sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    console.error('Error fetching audience questions:', error);
    res.status(500).json({ message: 'Error fetching audience questions', error: error.message });
  }
});

module.exports = router;
