import express from 'express';
import cors from 'cors';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import setupTournamentRoutes from './tournament-routes.js';
import wordCloudRoutes from './wordcloud-routes.js';
import contactRoutes, { setupContactSockets } from './contact-routes.js';
import audienceDataRoutes from './audience-data-routes.js'; // Import new audience data routes
import { GoogleGenerativeAI } from '@google/generative-ai';

// Cargar variables de entorno
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Endpoint para AI Question Generation
app.post('/api/ai/generate-questions', async (req, res) => {
  try {
    const { apiKey, aiProvider, topic, numQuestions } = req.body;

    if (!apiKey || !topic || !numQuestions) {
      return res.status(400).json({ error: 'Missing required fields: apiKey, topic, numQuestions.' });
    }

    if (aiProvider !== 'gemini') {
      return res.status(400).json({ error: 'Currently, only "gemini" provider is supported.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Or the latest stable model

    const prompt = `
      Generate ${numQuestions} quiz questions based on the following topic: "${topic}".
      For each question, provide:
      1. "case": A brief context or scenario for the question (max 1-2 sentences). This should be derived from or related to the main topic: "${topic}".
      2. "content": The main text of the question.
      3. "options": An object with three distinct answer choices, labeled "A", "B", and "C".
      4. "correct_answer_letter": The letter (A, B, or C) of the correct answer.
      5. "explanation": A brief explanation of why the answer is correct.

      Return the output as a valid JSON array of objects, where each object represents a question. Do not include any introductory text or explanations outside the JSON structure.
      Example of a single question object in the array:
      {
        "case": "Context related to the topic.",
        "content": "What is the primary function of this item?",
        "options": {
          "A": "Option A description",
          "B": "Option B description",
          "C": "Option C description"
        },
        "correct_answer_letter": "B",
        "explanation": "This is why B is the correct answer."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean the response text to ensure it's valid JSON
    // AI models sometimes add ```json ... ``` or other markdown
    text = text.replace(/^```json\s*|```$/g, '').trim();

    let generatedData;
    try {
      generatedData = JSON.parse(text);
    } catch (e) {
      console.error('AI response parsing error:', e);
      console.error('Raw AI response:', text);
      return res.status(500).json({ error: 'Failed to parse AI response. The response was not valid JSON.', details: text });
    }

    if (!Array.isArray(generatedData)) {
      console.error('AI response was not an array:', generatedData);
      return res.status(500).json({ error: 'AI response was not in the expected array format.', details: generatedData });
    }

    const savedQuestions = [];
    let questionsSavedCount = 0;

    for (const item of generatedData) {
      if (
        !item.content || !item.options ||
        !item.options.A || !item.options.B || !item.options.C ||
        !item.correct_answer_letter || !item.explanation
      ) {
        console.warn('Skipping invalid question item from AI:', item);
        continue; // Skip if essential fields are missing
      }

      const newQuestion = {
        case: item.case || '', // Provide a default if 'case' is missing
        content: item.content,
        option_a: item.options.A,
        option_b: item.options.B,
        option_c: item.options.C,
        correct_option: item.correct_answer_letter.toUpperCase(), 
        explanation: item.explanation,
        explanation_image: '', 
        is_active: false,
        votingClosed: false,
        timer: null, 
        created_at: new Date()
      };

      const insertResult = await db.collection('questions').insertOne(newQuestion);
      if (insertResult.insertedId) {
        questionsSavedCount++;
        savedQuestions.push({ ...newQuestion, _id: insertResult.insertedId });
      }
    }

    if (questionsSavedCount > 0) {
       io.emit('questions_generated_bulk', { count: questionsSavedCount, source: 'ai' });
    }

    res.status(201).json({
      message: `${questionsSavedCount} questions generated and saved successfully.`,
      count: questionsSavedCount,
    });

  } catch (error) {
    console.error('Error in /api/ai/generate-questions:', error);
    if (error.message && error.message.includes('API key not valid')) {
       return res.status(401).json({ error: 'Invalid AI API Key. Please check your key.' });
    }
    res.status(500).json({ error: 'Failed to generate questions.', details: error.message });
  }
});

export { io };

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/uploads/documents', express.static(path.join(process.cwd(), 'uploads/documents')));

app.use('/api/wordcloud', wordCloudRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/audience-data', audienceDataRoutes); // Use new audience data routes

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  console.log(`Sirviendo archivos estáticos desde: ${distPath}`);
}

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const documentsUploadsDir = path.join(process.cwd(), 'uploads/documents');
if (!fs.existsSync(documentsUploadsDir)) {
  fs.mkdirSync(documentsUploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix + ext)
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  }
});

const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, documentsUploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const documentUpload = multer({
  storage: documentStorage,
  limits: {
    fileSize: 25 * 1024 * 1024 
  },
  fileFilter: function (req, file, cb) {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se permiten PDF, Word y PowerPoint.'), false);
    }
  }
});

const MONGODB_URI = process.env.VITE_MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.VITE_MONGODB_DB || 'quiz_app';

let client;
let db;

import { initializeConnections } from './db.js';

async function connectToDatabase() {
  try {
    await initializeConnections();
    
    client = new MongoClient(MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
    await client.connect();
    db = client.db(MONGODB_DB);
    console.log('Conectado a MongoDB');
    
    setupTournamentRoutes(app, io, db);
    setupContactSockets(io);
  } catch (error) {
    console.error('Error conectando a MongoDB:', error);
    process.exit(1);
  }
}

// Rutas API

// Obtener todas las preguntas
app.get('/api/questions', async (req, res) => {
  try {
    const questions = await db.collection('questions').find({}).sort({ created_at: -1 }).toArray();
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener pregunta activa
app.get('/api/questions/active', async (req, res) => {
  try {
    const question = await db.collection('questions').findOne({ is_active: true });
    if (question) {
      const votes = await getVotesForQuestion(question._id.toString());
      res.json({ question, votes });
    } else {
      res.json({ question: null, votes: { total: 0, counts: {} } });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear una nueva pregunta
app.post('/api/questions', async (req, res) => {
  try {
    const question = {
      ...req.body,
      is_active: false,
      votingClosed: false,
      created_at: new Date()
    };
    const result = await db.collection('questions').insertOne(question);
    const newQuestion = { ...question, _id: result.insertedId };
    res.status(201).json(newQuestion);
    io.emit('question_created', newQuestion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar una pregunta
app.put('/api/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    await db.collection('questions').updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
    const updatedQuestion = await db.collection('questions').findOne({ _id: new ObjectId(id) });
    res.json(updatedQuestion);
    io.emit('question_updated', updatedQuestion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar una pregunta
app.delete('/api/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('questions').deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true });
    io.emit('question_deleted', id);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Document Routes ---

// Helper function to get all documents for emitting
async function getAllDocumentsForEmit(database) {
  if (!database) {
    console.error('Database instance is not available for getAllDocumentsForEmit');
    return [];
  }
  try {
    return await database.collection('documents').find({}).sort({ uploadDate: -1 }).toArray();
  } catch (error) {
    console.error('Error fetching documents for emit:', error);
    return []; // Return empty array on error
  }
}

// New status routes for Documents
app.post('/api/documents/status/activate', async (req, res) => {
  try {
    io.emit('documents:status', { isActive: true });
    console.log('Documents view activated, event emitted via /api/documents/status/activate.');
    res.status(200).json({ success: true, message: 'Documents view activated for audience' });
  } catch (error) {
    console.error('Error activating documents view:', error);
    res.status(500).json({ success: false, message: 'Failed to activate documents view', details: error.message });
  }
});

app.post('/api/documents/status/deactivate', async (req, res) => {
  try {
    io.emit('documents:status', { isActive: false });
    console.log('Documents view deactivated, event emitted via /api/documents/status/deactivate.');
    res.status(200).json({ success: true, message: 'Documents view deactivated for audience' });
  } catch (error) {
    console.error('Error deactivating documents view:', error);
    res.status(500).json({ success: false, message: 'Failed to deactivate documents view', details: error.message });
  }
});
// End of new status routes for Documents

// Endpoint para subir documentos
app.post('/api/documents/upload', documentUpload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo de documento.' });
    }

    const newDocument = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path, // Path on server
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadDate: new Date(),
      url: `/uploads/documents/${req.file.filename}`
    };

    const result = await db.collection('documents').insertOne(newDocument);
    // Construct the response object including the insertedId
    const createdDocument = { ...newDocument, _id: result.insertedId };
    
    // After successful insert, emit update
    if (result.insertedId) {
      const updatedDocumentList = await getAllDocumentsForEmit(db);
      io.emit('documents:list_update', updatedDocumentList);
      console.log('Document uploaded, documents:list_update event emitted.');
    }
    
    res.status(201).json(createdDocument);

  } catch (error) {
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ error: error.message });
    } else if (error.message.startsWith('Tipo de archivo no permitido')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al subir el documento y guardar en DB:', error);
    res.status(500).json({ error: 'Error interno del servidor al subir el documento: ' + error.message });
  }
});

// Endpoint para listar documentos
app.get('/api/documents', async (req, res) => {
  try {
    const documents = await db.collection('documents').find({}).sort({ uploadDate: -1 }).toArray();
    res.json(documents);
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener los documentos: ' + error.message });
  }
});

// Endpoint para eliminar un documento
app.delete('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de documento inválido.' });
    }

    const document = await db.collection('documents').findOne({ _id: new ObjectId(id) });
    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado.' });
    }

    // Construct the full file path for deletion
    // req.file.path stores the full path from multer diskStorage: e.g. "uploads/documents/1700000000-filename.pdf"
    // process.cwd() is needed if filePath is relative, but multer's `path` is usually absolute or relative to cwd based on setup.
    // Given documentsUploadsDir = path.join(process.cwd(), 'uploads/documents'), and filename in multer is Date.now() + '-' + file.originalname
    // The document.filePath should be correct as stored by multer.
    const filePath = document.filePath; // This should be the path like 'uploads/documents/filename.ext'

    // Check if file exists before attempting to delete
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, async (err) => {
        if (err) {
          // Log error but proceed to delete DB record if user wants to remove broken link
          console.error('Error al eliminar el archivo físico:', err);
          // Optionally, decide if you want to stop or continue if file deletion fails
          // For now, we'll log and continue to attempt DB deletion.
        }
        
        // Delete document from MongoDB
        try {
          await db.collection('documents').deleteOne({ _id: new ObjectId(id) });
          
          // After successful DB deletion, emit update
          const updatedDocumentList = await getAllDocumentsForEmit(db);
          io.emit('documents:list_update', updatedDocumentList);
          console.log('Document file deleted, documents:list_update event emitted.');

          res.json({ success: true, message: 'Documento eliminado correctamente.' });
        } catch (dbError) {
          console.error('Error al eliminar el documento de la base de datos:', dbError);
          res.status(500).json({ error: 'Error interno del servidor al eliminar el registro del documento.' });
        }
      });
    } else {
      console.warn(`El archivo físico no se encontró en ${filePath}, eliminando solo el registro de la base de datos.`);
      // If file does not exist, still attempt to delete the DB record
      await db.collection('documents').deleteOne({ _id: new ObjectId(id) });

      // After successful DB deletion (even if file was not found), emit update
      const updatedDocumentList = await getAllDocumentsForEmit(db);
      io.emit('documents:list_update', updatedDocumentList);
      console.log('Document record deleted (file not found), documents:list_update event emitted.');
      
      res.json({ success: true, message: 'Registro del documento eliminado. El archivo físico no se encontró.' });
    }

  } catch (error) {
    console.error('Error en el proceso de eliminación del documento:', error);
    res.status(500).json({ error: 'Error interno del servidor al eliminar el documento: ' + error.message });
  }
});
// --- End Document Routes ---

// Subir imagen para explicación
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }
    
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    res.json({ 
      success: true, 
      imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar imagen
app.delete('/api/upload/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Archivo no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/participants', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'El nombre es requerido' 
      });
    }
    
    const existingParticipant = await db.collection('participants').findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existingParticipant) {
      return res.status(409).json({ 
        success: false, 
        message: 'Ya existe un participante con este nombre' 
      });
    }
    
    const participant = {
      name: name.trim(),
      points: 0,
      totalTime: 0,
      created_at: new Date()
    };
    
    const result = await db.collection('participants').insertOne(participant);
    const newParticipant = { ...participant, _id: result.insertedId };
    
    res.status(201).json(newParticipant);
    io.emit('participant_registered', newParticipant);
    
  } catch (error) {
    console.error('Error al registrar participante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar participante'
    });
  }
});

app.get('/api/participants', async (req, res) => {
  try {
    const participants = await db.collection('participants')
      .find({})
      .sort({ points: -1, totalTime: 1 })
      .toArray();
      
    res.json(participants);
  } catch (error) {
    console.error('Error al obtener participantes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener participantes'
    });
  }
});

app.get('/api/admin/config', async (req, res) => {
  try {
    let config = await db.collection('quiz_config').findOne({});
    if (!config) {
      config = {
        defaultTimer: 30,
        showRankings: true,
        allowJoinDuringQuiz: true,
        created_at: new Date(),
        updated_at: new Date()
      };
    }
    res.json(config);
  } catch (error) {
    console.error('Error al obtener configuración del quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración del quiz'
    });
  }
});

app.post('/api/admin/config', async (req, res) => {
  try {
    const { defaultTimer, showRankings, allowJoinDuringQuiz } = req.body;
    
    if (defaultTimer === undefined || showRankings === undefined || allowJoinDuringQuiz === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos en la configuración'
      });
    }
    
    if (typeof defaultTimer !== 'number' || defaultTimer < 5 || defaultTimer > 300) {
      return res.status(400).json({
        success: false,
        message: 'El timer debe ser un número entre 5 y 300 segundos'
      });
    }
    
    const existingConfig = await db.collection('quiz_config').findOne({});
    let config;
    
    if (existingConfig) {
      await db.collection('quiz_config').updateOne(
        { _id: existingConfig._id },
        { 
          $set: {
            defaultTimer,
            showRankings,
            allowJoinDuringQuiz,
            updated_at: new Date()
          }
        }
      );
      config = await db.collection('quiz_config').findOne({ _id: existingConfig._id });
    } else {
      const newConfigData = {
        defaultTimer,
        showRankings,
        allowJoinDuringQuiz,
        created_at: new Date(),
        updated_at: new Date()
      };
      const result = await db.collection('quiz_config').insertOne(newConfigData);
      config = { ...newConfigData, _id: result.insertedId };
    }
    
    io.emit('quiz_config_updated', config);
    res.json(config);
  } catch (error) {
    console.error('Error al guardar configuración del quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar configuración del quiz'
    });
  }
});

app.post('/api/questions/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.collection('questions').updateMany(
      {},
      { $set: { is_active: false, votingClosed: false, endTime: null } }
    );
    
    const question = await db.collection('questions').findOne({ _id: new ObjectId(id) });
    const quizConfig = await db.collection('quiz_config').findOne({});
    const defaultTimer = quizConfig ? quizConfig.defaultTimer : 30;
    const timer = question.timer || defaultTimer;
    const endTime = timer ? new Date(Date.now() + (timer * 1000)) : null;
    
    await db.collection('questions').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          is_active: true, 
          correct_option: null, 
          endTime, 
          votingClosed: false,
          timer 
        } 
      }
    );
    
    await db.collection('votes').deleteMany({ question_id: id });
    
    const updatedQuestion = await db.collection('questions').findOne({ _id: new ObjectId(id) });
    res.json(updatedQuestion);
    io.emit('voting_started', { question: updatedQuestion, votes: { total: 0, counts: {} } });
    
    if (endTime) {
      const timeoutMs = timer * 1000;
      setTimeout(async () => {
        const currentQuestion = await db.collection('questions').findOne({ _id: new ObjectId(id) });
        if (currentQuestion && currentQuestion.is_active && !currentQuestion.votingClosed) {
          await closeVoting(id);
        }
      }, timeoutMs);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/questions/:id/close', async (req, res) => {
  try {
    const { id } = req.params;
    await closeVoting(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/questions/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    const { correctOption } = req.body;
    
    const question = await db.collection('questions').findOne({ _id: new ObjectId(id) });
    if (!question) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }
    
    await db.collection('questions').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          is_active: true, 
          correct_option: correctOption, 
          endTime: null, 
          votingClosed: true 
        } 
      }
    );
    
    const questionVotes = await db.collection('votes').find({ question_id: id }).toArray();
    
    for (const vote of questionVotes) {
      if (vote.option.toUpperCase() === correctOption.toUpperCase()) {
        await db.collection('participants').updateOne(
          { _id: new ObjectId(vote.voter_id) },
          { 
            $inc: { 
              points: 1,
              correctAnswers: 1,
              totalAnswers: 1
            }
          }
        );
      } else {
        await db.collection('participants').updateOne(
          { _id: new ObjectId(vote.voter_id) },
          { $inc: { totalAnswers: 1 } }
        );
      }
    }
    
    const updatedQuestion = await db.collection('questions').findOne({ _id: new ObjectId(id) });
    const votesData = await getVotesForQuestion(id);
    
    res.json({ question: updatedQuestion, votes: votesData });
    io.emit('voting_stopped', { question: updatedQuestion, votes: votesData });
  } catch (error) {
    console.error('Error al detener la votación:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/questions/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { option, voter_id } = req.body;
    
    const question = await db.collection('questions').findOne({ _id: new ObjectId(id) });
    if (!question || !question.is_active || question.votingClosed) {
      return res.status(400).json({ error: 'La votación no está activa' });
    }
    
    const existingVote = await db.collection('votes').findOne({
      question_id: id,
      voter_id
    });
    
    if (existingVote) {
      return res.status(400).json({ error: 'Ya has votado en esta pregunta' });
    }
    
    let responseTime = 0;
    if (question.timer && question.endTime) {
      const questionEndTime = new Date(question.endTime);
      const now = new Date();
      responseTime = Math.round((question.timer - Math.max(0, (questionEndTime.getTime() - now.getTime()) / 1000)));
      responseTime = Math.max(0, Math.min(question.timer, responseTime));
    }
    
    await db.collection('votes').insertOne({
      question_id: id,
      option,
      voter_id,
      responseTime,
      created_at: new Date()
    });
    
    await db.collection('participants').updateOne(
      { _id: new ObjectId(voter_id) },
      { $inc: { totalTime: responseTime } }
    );
    
    const votes = await getVotesForQuestion(id);
    res.json({ success: true, votes });
    io.emit('vote_submitted', { question_id: id, votes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function closeVoting(id) {
  await db.collection('questions').updateOne(
    { _id: new ObjectId(id) },
    { $set: { votingClosed: true, endTime: null } }
  );
  
  const updatedQuestion = await db.collection('questions').findOne({ _id: new ObjectId(id) });
  const votes = await getVotesForQuestion(id);
  
  io.emit('voting_closed', { question: updatedQuestion, votes });
  return { question: updatedQuestion, votes };
}

async function getVotesForQuestion(questionId) {
  const questionVotes = await db.collection('votes').find({ question_id: questionId }).toArray();
  const voteCounts = {};
  questionVotes.forEach(vote => {
    voteCounts[vote.option] = (voteCounts[vote.option] || 0) + 1;
  });
  
  return {
    total: questionVotes.length,
    counts: voteCounts
  };
}

app.post('/api/auth/login', async (req, res) => {
  try {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (password === adminPassword) {
      res.json({ success: true, token: 'admin-token' });
    } else {
      res.status(401).json({ error: 'Contraseña incorrecta' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/questions/clear', async (req, res) => {
  try {
    const activeQuestion = await db.collection('questions').findOne({ is_active: true });
    await db.collection('questions').updateMany(
      {},
      { 
        $set: { 
          is_active: false, 
          votingClosed: false, 
          endTime: null 
        } 
      }
    );
    
    res.json({ success: true });
    io.emit('clear_view', { 
      message: 'Vista limpiada', 
      previousQuestion: activeQuestion ? activeQuestion._id : null 
    });
    
  } catch (error) {
    console.error('Error al limpiar la vista:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/reset-session', async (req, res) => {
  try {
    await db.collection('participants').deleteMany({});
    await db.collection('votes').deleteMany({});
    io.emit('session_reset');
    res.json({
      success: true,
      message: 'Sesión reiniciada correctamente'
    });
  } catch (error) {
    console.error('Error al reiniciar la sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reiniciar la sesión'
    });
  }
});

app.post('/api/admin/clear-view', async (req, res) => {
  try {
    io.emit('clear_view', { 
      message: 'Vista limpiada por el administrador' 
    });
    res.json({
      success: true,
      message: 'Vista limpiada correctamente'
    });
  } catch (error) {
    console.error('Error al limpiar la vista:', error);
    res.status(500).json({
      success: false,
      message: 'Error al limpiar la vista'
    });
  }
});

app.post('/api/admin/show-ranking', async (req, res) => {
  try {
    io.emit('show_ranking', { 
      message: 'Clasificación mostrada por el administrador' 
    });
    res.json({
      success: true,
      message: 'Clasificación mostrada correctamente'
    });
  } catch (error) {
    console.error('Error al mostrar la clasificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al mostrar la clasificación'
    });
  }
});

app.post('/api/admin/hide-ranking', async (req, res) => {
  try {
    io.emit('hide_ranking', { 
      message: 'Clasificación ocultada por el administrador' 
    });
    res.json({
      success: true,
      message: 'Clasificación ocultada correctamente'
    });
  } catch (error) {
    console.error('Error al ocultar la clasificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al ocultar la clasificación'
    });
  }
});

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
  
  socket.on('wordcloud:join', () => {
    console.log('Usuario se unió a la nube de palabras:', socket.id);
  });
  
  socket.on('wordcloud:word', async (data) => {
    try {
      console.log('Palabra recibida:', data.word);
    } catch (error) {
      console.error('Error al procesar palabra:', error);
    }
  });
});

app.post('/api/audience-questions', async (req, res) => {
  try {
    const { text, author } = req.body; 
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'El texto de la pregunta es requerido.' });
    }

    const newAudienceQuestion = {
      text: text.trim(),
      author: author && typeof author === 'string' && author.trim() !== '' ? author.trim() : 'Anonymous', 
      isAnswered: false,
      upvotes: 0, 
      voters: [], 
      createdAt: new Date(),
    };

    const result = await db.collection('audience_questions').insertOne(newAudienceQuestion);
    const createdQuestion = { ...newAudienceQuestion, _id: result.insertedId };

    io.emit('new_audience_question', createdQuestion);
    res.status(201).json(createdQuestion);
  } catch (error) {
    console.error('Error al crear pregunta de audiencia:', error);
    res.status(500).json({ error: 'Error interno del servidor al crear la pregunta.' });
  }
});

// New routes for Audience Q&A status
app.post('/api/audience-questions/status/activate', async (req, res) => {
  try {
    audienceQAActive = true;
    io.emit('audienceQA:status', { isActive: true });
    console.log('Audience Q&A activated, event emitted via /api/audience-questions/status/activate');
    res.status(200).json({ success: true, message: 'Audience Q&A activated for audience' });
  } catch (error) {
    console.error('Error activating Audience Q&A:', error);
    res.status(500).json({ success: false, message: 'Failed to activate Audience Q&A', details: error.message });
  }
});

app.post('/api/audience-questions/status/deactivate', async (req, res) => {
  try {
    audienceQAActive = false;
    io.emit('audienceQA:status', { isActive: false });
    console.log('Audience Q&A deactivated, event emitted via /api/audience-questions/status/deactivate');
    res.status(200).json({ success: true, message: 'Audience Q&A deactivated for audience' });
  } catch (error) {
    console.error('Error deactivating Audience Q&A:', error);
    res.status(500).json({ success: false, message: 'Failed to deactivate Audience Q&A', details: error.message });
  }
});
// End of new Audience Q&A status routes

// Variable global para mantener el estado de audienceQA
let audienceQAActive = false;

app.get('/api/audience-questions', async (req, res) => {
  try {
    const questions = await db.collection('audience_questions').find({}).sort({ upvotes: -1, createdAt: -1 }).toArray();
    res.json({ questions, isActive: audienceQAActive });
  } catch (error) {
    console.error('Error al obtener preguntas de audiencia:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener las preguntas.' });
  }
});

app.put('/api/audience-questions/:id/answer', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de pregunta inválido.' });
    }

    const result = await db.collection('audience_questions').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { isAnswered: true } },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'Pregunta no encontrada.' });
    }

    io.emit('question_answered', result.value);
    res.json(result.value);
  } catch (error) {
    console.error('Error al marcar pregunta como respondida:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar la pregunta.' });
  }
});

app.delete('/api/audience-questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de pregunta inválido.' });
    }

    const result = await db.collection('audience_questions').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Pregunta no encontrada.' });
    }

    io.emit('question_deleted', id);
    res.json({ success: true, message: 'Pregunta eliminada correctamente.' });
  } catch (error) {
    console.error('Error al eliminar pregunta de audiencia:', error);
    res.status(500).json({ error: 'Error interno del servidor al eliminar la pregunta.' });
  }
});

app.post('/api/audience-questions/:id/upvote', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de pregunta inválido.' });
    }
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId es requerido.' });
    }

    const question = await db.collection('audience_questions').findOne({ _id: new ObjectId(id) });

    if (!question) {
      return res.status(404).json({ error: 'Pregunta no encontrada.' });
    }

    if (question.voters && question.voters.includes(userId)) {
      return res.status(400).json({ error: 'Ya has votado por esta pregunta.' });
    }

    const result = await db.collection('audience_questions').findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $inc: { upvotes: 1 },
        $addToSet: { voters: userId }, 
      },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'Pregunta no encontrada después de intentar actualizar.' });
    }

    io.emit('question_upvoted', result.value);
    res.json(result.value);
  } catch (error) {
    console.error('Error al dar upvote a la pregunta:', error);
    res.status(500).json({ error: 'Error interno del servidor al procesar el upvote.' });
  }
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
  });
}

connectToDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT} en modo ${process.env.NODE_ENV || 'desarrollo'}`);
  });
});
