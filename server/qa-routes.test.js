import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import qaRoutes from './qa-routes.js'; // Adjust path as necessary
import Question from './models/Question.js'; // Adjust path as necessary

let mongoServer;
let app;
let mockIo;

// Helper function to create a mock Socket.IO
const createMockIo = () => {
  const roomMocks = {}; // Store mocks for each room

  return {
    // General emit (not used by these routes for room-specific messages)
    emit: jest.fn(), 
    
    // Room-specific emitting
    to: jest.fn((roomName) => {
      if (!roomMocks[roomName]) {
        roomMocks[roomName] = { emit: jest.fn() }; // Each room gets its own emit mock
      }
      return roomMocks[roomName];
    }),

    // To allow resetting mocks for specific rooms or all rooms
    _clearRoomMock: (roomName) => {
      if (roomMocks[roomName]) {
        roomMocks[roomName].emit.mockClear();
      }
    },
    _clearAllRoomMocks: () => {
      Object.values(roomMocks).forEach(roomMock => roomMock.emit.mockClear());
    },

    // Mock other io properties/methods if needed by your routes
    sockets: {
      adapter: {
        rooms: new Map(), 
      },
    },
    // Mock other io properties/methods if needed by your routes
  };
};


beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  app = express();
  app.use(express.json());
  mockIo = createMockIo();
  app.set('socketio', mockIo); // Make mock io available to routes
  app.use('/api/qa', qaRoutes);
});

afterEach(async () => {
  await Question.deleteMany({});
  // Reset mocks after each test
  mockIo.emit.mockClear(); // General emit
  mockIo.to.mockClear();   // Clear calls to 'to' itself
  mockIo._clearAllRoomMocks(); // Clear all room-specific emit mocks
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Q&A API Endpoints', () => {
  describe('POST /api/qa/questions', () => {
    it('should create a new question successfully', async () => {
      const res = await request(app)
        .post('/api/qa/questions')
        .send({ content: 'Test question?', participantName: 'Tester', roomCode: 'ROOM123' });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.content).toBe('Test question?');
      expect(res.body.participantName).toBe('Tester');
      expect(res.body.roomCode).toBe('ROOM123');
      expect(mockIo.to).toHaveBeenCalledWith('admin_qa');
      expect(mockIo.to('admin_qa').emit).toHaveBeenCalledWith('new_question', expect.objectContaining({ content: 'Test question?' }));
    });

    it('should return 500 if content is missing', async () => {
      const res = await request(app)
        .post('/api/qa/questions')
        .send({ participantName: 'Tester' });
      expect(res.statusCode).toEqual(500); // Based on current route error handling
      // Ideally, this should be a 400 for validation error
      expect(res.body.message).toContain('Error creating question');
    });
  });

  describe('GET /api/qa/questions (Admin)', () => {
    beforeEach(async () => {
      await Question.create([
        { content: 'Q1 Approved', isApproved: true, roomCode: 'R1' },
        { content: 'Q2 Pending', isApproved: false, roomCode: 'R1' },
        { content: 'Q3 Answered', isApproved: true, isAnswered: true, roomCode: 'R2' },
      ]);
    });

    it('should fetch all questions', async () => {
      const res = await request(app).get('/api/qa/questions');
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBe(3);
    });

    it('should filter by isApproved=true', async () => {
      const res = await request(app).get('/api/qa/questions?approved=true');
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBe(2);
      res.body.forEach(q => expect(q.isApproved).toBe(true));
    });

    it('should filter by isAnswered=true', async () => {
      const res = await request(app).get('/api/qa/questions?answered=true');
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].isAnswered).toBe(true);
    });
    
    it('should filter by roomCode', async () => {
      const res = await request(app).get('/api/qa/questions?roomCode=R1');
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBe(2);
      res.body.forEach(q => expect(q.roomCode).toBe('R1'));
    });
  });

  describe('PUT /api/qa/questions/:id/approve', () => {
    let pendingQuestion;
    beforeEach(async () => {
      pendingQuestion = await Question.create({ content: 'Needs approval' });
    });

    it('should approve a question successfully', async () => {
      const res = await request(app)
        .put(`/api/qa/questions/${pendingQuestion._id}/approve`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.isApproved).toBe(true);
      
      const updatedQuestion = await Question.findById(pendingQuestion._id);
      expect(updatedQuestion.isApproved).toBe(true);

      expect(mockIo.to).toHaveBeenCalledWith('audience_room');
      expect(mockIo.to('audience_room').emit).toHaveBeenCalledWith('question_approved', expect.objectContaining({ _id: pendingQuestion._id.toString(), isApproved: true }));
      
      expect(mockIo.to).toHaveBeenCalledWith('admin_qa');
      // Ensure we check the emit for the 'admin_qa' room specifically
      expect(mockIo.to('admin_qa').emit).toHaveBeenCalledWith('question_updated', expect.objectContaining({ _id: pendingQuestion._id.toString(), isApproved: true }));
    });

    it('should return 404 for non-existent question ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/qa/questions/${nonExistentId}/approve`);
      expect(res.statusCode).toEqual(404);
    });
  });

  describe('PUT /api/qa/questions/:id/answer', () => {
    let approvedQuestion;
    beforeEach(async () => {
      approvedQuestion = await Question.create({ content: 'Needs answer', isApproved: true });
    });

    it('should mark a question as answered successfully', async () => {
      const res = await request(app)
        .put(`/api/qa/questions/${approvedQuestion._id}/answer`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.isAnswered).toBe(true);

      const updatedQuestion = await Question.findById(approvedQuestion._id);
      expect(updatedQuestion.isAnswered).toBe(true);
      
      expect(mockIo.to).toHaveBeenCalledWith('audience_room');
      expect(mockIo.to('audience_room').emit).toHaveBeenCalledWith('question_answered', expect.objectContaining({ _id: approvedQuestion._id.toString(), isAnswered: true }));
      
      expect(mockIo.to).toHaveBeenCalledWith('admin_qa');
      expect(mockIo.to('admin_qa').emit).toHaveBeenCalledWith('question_updated', expect.objectContaining({ _id: approvedQuestion._id.toString(), isAnswered: true }));
    });
    
    it('should return 404 for non-existent question ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/qa/questions/${nonExistentId}/answer`);
      expect(res.statusCode).toEqual(404);
    });
  });

  describe('GET /api/qa/questions/audience', () => {
    beforeEach(async () => {
      await Question.create([
        { content: 'Audience Q1 Approved', isApproved: true, roomCode: 'AUD1' },
        { content: 'Audience Q2 Pending', isApproved: false, roomCode: 'AUD1' },
        { content: 'Audience Q3 Approved Answered', isApproved: true, isAnswered: true, roomCode: 'AUD2' },
      ]);
    });

    it('should fetch only approved questions', async () => {
      const res = await request(app).get('/api/qa/questions/audience');
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBe(2);
      res.body.forEach(q => expect(q.isApproved).toBe(true));
    });
    
    it('should filter by roomCode for audience', async () => {
      const res = await request(app).get('/api/qa/questions/audience?roomCode=AUD1');
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBe(1); // Only Q1 is approved in AUD1
      expect(res.body[0].content).toBe('Audience Q1 Approved');
    });
  });
});
