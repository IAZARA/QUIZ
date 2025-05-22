const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  participantName: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  isAnswered: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  roomCode: {
    type: String,
    required: false, // Assuming this might not be needed immediately
    index: true,
  },
});

module.exports = mongoose.model('Question', QuestionSchema);
