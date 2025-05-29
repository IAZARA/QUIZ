const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 5000,
  },
  authorId: {
    type: String, // Assuming String for now, can be changed to ObjectId if a User model exists
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

module.exports = Review;
