import mongoose from 'mongoose';

const audienceDataSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required.'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required.'],
    trim: true,
    lowercase: true,
    // Basic email validation, consider using a more robust validator if needed
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address.'],
  },
  comments: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const AudienceData = mongoose.model('AudienceData', audienceDataSchema);

export default AudienceData;
