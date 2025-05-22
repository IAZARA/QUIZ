import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import supertest from 'supertest';
import path from 'path';
import fs from 'fs'; // Import actual fs to mock specific functions
import setupFileRoutes from './file-routes.js';
import FileMetadata from './models/FileMetadata.js';
import { fileURLToPath } from 'url';

// Mock fs module for specific functions
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    unlink: jest.fn((path, callback) => callback(null)), // Mock successful unlink by default
    // We'll need to mock createReadStream for res.download if we go that deep
  };
});


// Since __dirname is not available in ES modules, we create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mongod;
let app;
let request;
let mockIo;

// Helper to create a dummy file buffer for upload tests
const createDummyFileBuffer = (content = 'dummy content') => Buffer.from(content);

describe('/api/files', () => {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    app = express();
    app.use(express.json()); // Ensure express.json() is used for parsing JSON request bodies

    // Mock Socket.IO instance and its emit function
    mockIo = {
      emit: jest.fn(),
    };
    // Pass the mockIo to setupFileRoutes
    setupFileRoutes(app, mockIo);
    
    request = supertest(app);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  beforeEach(async () => {
    // Clear all data from FileMetadata collection before each test
    await FileMetadata.deleteMany({});
    // Reset mocks
    fs.existsSync.mockReset();
    fs.mkdirSync.mockReset();
    fs.unlink.mockReset().mockImplementation((path, callback) => callback(null)); // Reset to success
    mockIo.emit.mockClear();

    // Default mock for existsSync (true means dir/file exists)
    fs.existsSync.mockReturnValue(true); 
  });

  describe('POST /api/files/upload', () => {
    it('should upload a file and save metadata', async () => {
      const dummyBuffer = createDummyFileBuffer('test file content');
      const dummyFileName = 'test.txt';

      // Ensure uploads directory exists for multer
      fs.existsSync.mockImplementation(dirPath => {
        // Check if it's the shared_files directory multer tries to use
        return dirPath.endsWith('shared_files');
      });


      const response = await request
        .post('/api/files/upload')
        .attach('file', dummyBuffer, dummyFileName);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.originalName).toBe(dummyFileName);
      expect(response.body.mimeType).toBe('text/plain'); // Supertest infers this for .txt

      const metadata = await FileMetadata.findById(response.body._id);
      expect(metadata).not.toBeNull();
      expect(metadata.originalName).toBe(dummyFileName);
      
      expect(mockIo.emit).toHaveBeenCalledWith('shared_files_updated');

      // Cleanup: fs.unlink will be called by the route if metadata save failed.
      // Here, we are testing successful upload, so the file should "exist".
      // We need to manually "delete" the file from our mock fs for cleanup if necessary,
      // or ensure our mock multer setup doesn't actually write.
      // Since multer writes to disk, and we're mocking fs, we need to be careful.
      // The `serverPath` in metadata will point to where multer *would* have saved it.
      // For this test, just verifying metadata and socket emit is key.
    });

    it('should return 400 if no file is uploaded', async () => {
      const response = await request.post('/api/files/upload');
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('No file uploaded.');
    });
  });

  describe('GET /api/files', () => {
    it('should return all file metadata', async () => {
      await FileMetadata.create([
        { originalName: 'file1.txt', uniqueFilename: 'f1', serverPath: '/path/f1', mimeType: 'text/plain', size: 100 },
        { originalName: 'file2.jpg', uniqueFilename: 'f2', serverPath: '/path/f2', mimeType: 'image/jpeg', size: 200 },
      ]);
      const response = await request.get('/api/files');
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(2);
      expect(response.body[0].originalName).toBe('file2.jpg'); // Sorted by uploadedAt desc
      expect(response.body[1].originalName).toBe('file1.txt');
    });
  });

  describe('GET /api/files/active_for_audience', () => {
    it('should return only active files', async () => {
      await FileMetadata.create([
        { originalName: 'active.txt', uniqueFilename: 'fa', serverPath: '/path/fa', mimeType: 'text/plain', size: 100, isActive: true },
        { originalName: 'inactive.jpg', uniqueFilename: 'fi', serverPath: '/path/fi', mimeType: 'image/jpeg', size: 200, isActive: false },
      ]);
      const response = await request.get('/api/files/active_for_audience');
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);
      expect(response.body[0].originalName).toBe('active.txt');
    });
  });

  describe('PUT /api/files/:fileId/toggle', () => {
    it('should toggle isActive status of a file', async () => {
      const file = await FileMetadata.create(
        { originalName: 'toggle.txt', uniqueFilename: 'ft', serverPath: '/path/ft', mimeType: 'text/plain', size: 100, isActive: false }
      );
      const response = await request.put(`/api/files/${file._id}/toggle`);
      expect(response.status).toBe(200);
      expect(response.body.isActive).toBe(true);
      const updatedFile = await FileMetadata.findById(file._id);
      expect(updatedFile.isActive).toBe(true);
      expect(mockIo.emit).toHaveBeenCalledWith('shared_files_updated');
    });

    it('should return 404 if file not found for toggle', async () => {
      const invalidId = new mongoose.Types.ObjectId().toString();
      const response = await request.put(`/api/files/${invalidId}/toggle`);
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/files/:fileId', () => {
    it('should delete a file and its metadata', async () => {
      const file = await FileMetadata.create(
        { originalName: 'delete.txt', uniqueFilename: 'fd', serverPath: '/uploads/shared_files/delete.txt', mimeType: 'text/plain', size: 100 }
      );
      // Mock fs.unlink to be successful for this specific path
      fs.unlink.mockImplementation((p, cb) => {
        if (p === file.serverPath) cb(null);
        else cb(new Error('File path mismatch in mock'));
      });

      const response = await request.delete(`/api/files/${file._id}`);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('File and metadata deleted successfully.');
      expect(await FileMetadata.findById(file._id)).toBeNull();
      expect(fs.unlink).toHaveBeenCalledWith(file.serverPath, expect.any(Function));
      expect(mockIo.emit).toHaveBeenCalledWith('shared_files_updated');
    });

    it('should return 404 if file not found for delete', async () => {
      const invalidId = new mongoose.Types.ObjectId().toString();
      const response = await request.delete(`/api/files/${invalidId}`);
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/files/download/:fileId', () => {
    it('should download an active file', async () => {
      const file = await FileMetadata.create(
        { originalName: 'download.txt', uniqueFilename: 'fdown', serverPath: path.join(__dirname, 'test-files', 'download.txt'), mimeType: 'text/plain', size: 123, isActive: true }
      );
      // Create a dummy file for download
      const testFilePath = path.join(__dirname, 'test-files');
      if (!fs.existsSync(testFilePath)) fs.mkdirSync(testFilePath, { recursive: true }); // Use original fs for this setup
      fs.writeFileSync(file.serverPath, 'dummy content for download'); // Use original fs for this setup

      fs.existsSync.mockReturnValue(true); // Ensure our mock says the file exists

      const response = await request.get(`/api/files/download/${file._id}`);
      expect(response.status).toBe(200);
      expect(response.headers['content-disposition']).toBe('attachment; filename="download.txt"');
      expect(response.text).toBe('dummy content for download');

      fs.unlinkSync(file.serverPath); // Clean up dummy file using original fs
    });

    it('should return 403 if file is not active for download', async () => {
      const file = await FileMetadata.create(
        { originalName: 'inactive_download.txt', uniqueFilename: 'fidine', serverPath: '/path/fidine', mimeType: 'text/plain', size: 123, isActive: false }
      );
      const response = await request.get(`/api/files/download/${file._id}`);
      expect(response.status).toBe(403);
    });

    it('should return 404 if file not found for download', async () => {
      const invalidId = new mongoose.Types.ObjectId().toString();
      const response = await request.get(`/api/files/download/${invalidId}`);
      expect(response.status).toBe(404);
    });
     it('should return 404 if file metadata exists but file not on disk', async () => {
      const file = await FileMetadata.create(
        { originalName: 'diskmissing.txt', uniqueFilename: 'fdm', serverPath: '/path/to/nonexistent/diskmissing.txt', mimeType: 'text/plain', size: 123, isActive: true }
      );
      fs.existsSync.mockReturnValue(false); // Mock that file does not exist on disk
      const response = await request.get(`/api/files/download/${file._id}`);
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('File not found on server disk.');
    });
  });
});
