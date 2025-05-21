import mongoose from 'mongoose';

const fileMetadataSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true,
    trim: true,
  },
  serverPath: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  uniqueFilename: { // The unique name used to store the file on the server
    type: String,
    required: true,
    unique: true,
  },
  // You might also want to add a field for the user who uploaded it if you have users
  // uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const FileMetadata = mongoose.model('FileMetadata', fileMetadataSchema);

export default FileMetadata;
