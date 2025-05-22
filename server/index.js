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

// Exportar io para usarlo en otros módulos
export { io };

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Configuración para servir archivos estáticos
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rutas para la nube de palabras
app.use('/api/wordcloud', wordCloudRoutes);

// Rutas para contactos
app.use('/api/contacts', contactRoutes);

// En producción, servir archivos estáticos desde la carpeta dist
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  console.log(`Sirviendo archivos estáticos desde: ${distPath}`);
}

// Asegurarse de que la carpeta de uploads exista
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de multer para subir imágenes
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
    fileSize: 20 * 1024 * 1024 // límite de 20MB
  },
  fileFilter: function (req, file, cb) {
    // Validar tipos de archivo
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  }
});

// Variables de MongoDB
const MONGODB_URI = process.env.VITE_MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.VITE_MONGODB_DB || 'quiz_app';

// Cliente de MongoDB
let client;
let db;

// Importar funciones de conexión a la base de datos
import { initializeConnections } from './db.js';

// Conectar a MongoDB
async function connectToDatabase() {
  try {
    // Inicializar ambas conexiones (MongoDB nativo y Mongoose)
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
    
    // Configurar rutas del torneo
    setupTournamentRoutes(app, io, db);
    
    // Configurar sockets para contactos
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

// Subir imagen para explicación
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }
    
    // Construir la URL para acceder a la imagen
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
    
    // Verificar si el archivo existe
    if (fs.existsSync(filePath)) {
      // Eliminar el archivo
      fs.unlinkSync(filePath);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Archivo no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registrar un participante
app.post('/api/participants', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'El nombre es requerido' 
      });
    }
    
    // Verificar si el nombre ya existe
    const existingParticipant = await db.collection('participants').findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existingParticipant) {
      return res.status(409).json({ 
        success: false, 
        message: 'Ya existe un participante con este nombre' 
      });
    }
    
    // Crear nuevo participante
    const participant = {
      name: name.trim(),
      points: 0,
      totalTime: 0,
      created_at: new Date()
    };
    
    const result = await db.collection('participants').insertOne(participant);
    const newParticipant = { ...participant, _id: result.insertedId };
    
    res.status(201).json(newParticipant);
    
    // Notificar a todos los clientes sobre el nuevo participante
    io.emit('participant_registered', newParticipant);
    
  } catch (error) {
    console.error('Error al registrar participante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar participante'
    });
  }
});

// Obtener todos los participantes
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

// Obtener configuración del quiz
app.get('/api/admin/config', async (req, res) => {
  try {
    // Buscar la configuración existente, si no existe, crear una por defecto
    let config = await db.collection('quiz_config').findOne({});
    
    // Si no hay configuración, devolver valores por defecto
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

// Guardar configuración del quiz
app.post('/api/admin/config', async (req, res) => {
  try {
    const { defaultTimer, showRankings, allowJoinDuringQuiz } = req.body;
    
    // Validar los campos requeridos
    if (defaultTimer === undefined || showRankings === undefined || allowJoinDuringQuiz === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos en la configuración'
      });
    }
    
    // Validar que el timer sea un número positivo
    if (typeof defaultTimer !== 'number' || defaultTimer < 5 || defaultTimer > 300) {
      return res.status(400).json({
        success: false,
        message: 'El timer debe ser un número entre 5 y 300 segundos'
      });
    }
    
    // Buscar configuración existente
    const existingConfig = await db.collection('quiz_config').findOne({});
    
    let config;
    
    if (existingConfig) {
      // Actualizar configuración existente
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
      // Crear nueva configuración
      const newConfig = {
        defaultTimer,
        showRankings,
        allowJoinDuringQuiz,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const result = await db.collection('quiz_config').insertOne(newConfig);
      config = { ...newConfig, _id: result.insertedId };
    }
    
    // Notificar a todos los clientes que la configuración ha cambiado
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

// Iniciar votación
app.post('/api/questions/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Desactivar todas las preguntas
    await db.collection('questions').updateMany(
      {},
      { $set: { is_active: false, votingClosed: false, endTime: null } }
    );
    
    // Activar la pregunta seleccionada
    const question = await db.collection('questions').findOne({ _id: new ObjectId(id) });
    
    // Obtener configuración del quiz para usar el timer por defecto si no se especifica en la pregunta
    const quizConfig = await db.collection('quiz_config').findOne({});
    const defaultTimer = quizConfig ? quizConfig.defaultTimer : 30;
    
    // Usar el timer específico de la pregunta o el timer por defecto de la configuración
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
          timer // Asegurar que la pregunta tenga un timer definido
        } 
      }
    );
    
    // Limpiar votos anteriores
    await db.collection('votes').deleteMany({ question_id: id });
    
    const updatedQuestion = await db.collection('questions').findOne({ _id: new ObjectId(id) });
    res.json(updatedQuestion);
    io.emit('voting_started', { question: updatedQuestion, votes: { total: 0, counts: {} } });
    
    // Si hay temporizador, programar cierre automático
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

// Cerrar votación
app.post('/api/questions/:id/close', async (req, res) => {
  try {
    const { id } = req.params;
    await closeVoting(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Detener votación y establecer respuesta correcta
app.post('/api/questions/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    const { correctOption } = req.body;
    
    // Verificar si la pregunta existe
    const question = await db.collection('questions').findOne({ _id: new ObjectId(id) });
    if (!question) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }
    
    // Actualizar la pregunta: mantenerla activa pero cerrar la votación
    await db.collection('questions').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          is_active: true, // Mantener activa para que siga visible en la vista de audiencia
          correct_option: correctOption, 
          endTime: null, 
          votingClosed: true 
        } 
      }
    );
    
    // Obtener todos los votos de esta pregunta
    const votes = await db.collection('votes').find({ question_id: id }).toArray();
    
    // Actualizar los puntos de los participantes con respuestas correctas
    for (const vote of votes) {
      // Si la opción seleccionada por el participante coincide con la correcta
      if (vote.option.toUpperCase() === correctOption.toUpperCase()) {
        // Actualizar el participante sumando un punto y registrando respuesta correcta
        await db.collection('participants').updateOne(
          { _id: new ObjectId(vote.voter_id) },
          { 
            $inc: { 
              points: 1,              // Incrementar puntos
              correctAnswers: 1,      // Incrementar respuestas correctas
              totalAnswers: 1         // Incrementar total de respuestas
            }
          }
        );
        console.log(`Punto sumado al participante ${vote.voter_id} por respuesta correcta`);
      } else {
        // Solo incrementar el total de respuestas para respuestas incorrectas
        await db.collection('participants').updateOne(
          { _id: new ObjectId(vote.voter_id) },
          { $inc: { totalAnswers: 1 } }
        );
      }
    }
    
    const updatedQuestion = await db.collection('questions').findOne({ _id: new ObjectId(id) });
    const votesData = await getVotesForQuestion(id);
    
    console.log(`Votación detenida para la pregunta ${id}. Respuesta correcta: ${correctOption}`);
    
    res.json({ question: updatedQuestion, votes: votesData });
    io.emit('voting_stopped', { question: updatedQuestion, votes: votesData });
  } catch (error) {
    console.error('Error al detener la votación:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enviar un voto
app.post('/api/questions/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { option, voter_id } = req.body;
    
    // Verificar si la pregunta está activa
    const question = await db.collection('questions').findOne({ _id: new ObjectId(id) });
    if (!question || !question.is_active || question.votingClosed) {
      return res.status(400).json({ error: 'La votación no está activa' });
    }
    
    // Verificar si este votante ya ha votado
    const existingVote = await db.collection('votes').findOne({
      question_id: id,
      voter_id
    });
    
    if (existingVote) {
      return res.status(400).json({ error: 'Ya has votado en esta pregunta' });
    }
    
    // Calcular el tiempo de respuesta si hay un temporizador configurado
    let responseTime = 0;
    if (question.timer && question.endTime) {
      const endTime = new Date(question.endTime);
      const now = new Date();
      responseTime = Math.round((question.timer - Math.max(0, (endTime.getTime() - now.getTime()) / 1000)));
      
      // Evitar tiempos negativos o mayores que el timer
      responseTime = Math.max(0, Math.min(question.timer, responseTime));
      
      console.log(`Tiempo de respuesta para el participante ${voter_id}: ${responseTime}s`);
    }
    
    // Registrar el voto
    await db.collection('votes').insertOne({
      question_id: id,
      option,
      voter_id,
      responseTime,
      created_at: new Date()
    });
    
    // Actualizar el tiempo total del participante
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

// Función auxiliar para cerrar votación
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

// Función auxiliar para obtener votos
async function getVotesForQuestion(questionId) {
  const votes = await db.collection('votes').find({ question_id: questionId }).toArray();
  
  // Contar votos por opción
  const voteCounts = {};
  votes.forEach(vote => {
    voteCounts[vote.option] = (voteCounts[vote.option] || 0) + 1;
  });
  
  return {
    total: votes.length,
    counts: voteCounts
  };
}

// Autenticación de administrador
app.post('/api/auth/login', async (req, res) => {
  try {
    const { password } = req.body;
    // Contraseña simple para demostración - en producción usar algo más seguro
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

// Limpiar la vista de audiencia (nueva ruta)
app.post('/api/questions/clear', async (req, res) => {
  try {
    // Obtener la pregunta activa actual (si existe)
    const activeQuestion = await db.collection('questions').findOne({ is_active: true });
    
    // Desactivar todas las preguntas y limpiar sus estados
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
    
    // Emitir evento para limpiar la vista con información sobre la pregunta que estaba activa
    res.json({ success: true });
    io.emit('clear_view', { 
      message: 'Vista limpiada', 
      previousQuestion: activeQuestion ? activeQuestion._id : null 
    });
    
    console.log('Vista de audiencia limpiada correctamente');
  } catch (error) {
    console.error('Error al limpiar la vista:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar todos los participantes (reiniciar sesión)
app.post('/api/admin/reset-session', async (req, res) => {
  try {
    // Eliminar todos los participantes
    await db.collection('participants').deleteMany({});
    
    // Eliminar todos los votos
    await db.collection('votes').deleteMany({});
    
    // Notificar a los clientes que se ha reiniciado la sesión
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

// Endpoint para limpiar la vista de la audiencia
app.post('/api/admin/clear-view', async (req, res) => {
  try {
    // Emitir evento para limpiar la vista
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

// Endpoint para mostrar la clasificación a todos los participantes
app.post('/api/admin/show-ranking', async (req, res) => {
  try {
    // Emitir evento para mostrar la clasificación
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

// Endpoint para ocultar la clasificación a todos los participantes
app.post('/api/admin/hide-ranking', async (req, res) => {
  try {
    // Emitir evento para ocultar la clasificación
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

// Socket.io para tiempo real
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
  
  // Eventos para la nube de palabras
  socket.on('wordcloud:join', () => {
    console.log('Usuario se unió a la nube de palabras:', socket.id);
  });
  
  socket.on('wordcloud:word', async (data) => {
    try {
      // La lógica para manejar las palabras está en las rutas API
      // Este evento es solo para referencia
      console.log('Palabra recibida:', data.word);
    } catch (error) {
      console.error('Error al procesar palabra:', error);
    }
  });
});

// Rutas para Audience Q&A
// POST /api/audience-questions
app.post('/api/audience-questions', async (req, res) => {
  try {
    const { text, author } = req.body; // Added author
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'El texto de la pregunta es requerido.' });
    }

    const newAudienceQuestion = {
      text: text.trim(),
      author: author && typeof author === 'string' && author.trim() !== '' ? author.trim() : 'Anonymous', // Handle author
      isAnswered: false,
      upvotes: 0, // Initialize upvotes
      voters: [], // Initialize voters array
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

// GET /api/audience-questions
app.get('/api/audience-questions', async (req, res) => {
  try {
    // Sort by upvotes (descending) then createdAt (descending)
    const questions = await db.collection('audience_questions').find({}).sort({ upvotes: -1, createdAt: -1 }).toArray();
    res.json(questions);
  } catch (error) {
    console.error('Error al obtener preguntas de audiencia:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener las preguntas.' });
  }
});

// PUT /api/audience-questions/:id/answer
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

// DELETE /api/audience-questions/:id
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

// POST /api/audience-questions/:id/upvote
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
        $addToSet: { voters: userId }, // addToSet ensures userId is added only if not already present
      },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      // This case should ideally not be reached if the question was found earlier
      return res.status(404).json({ error: 'Pregunta no encontrada después de intentar actualizar.' });
    }

    io.emit('question_upvoted', result.value);
    res.json(result.value);
  } catch (error) {
    console.error('Error al dar upvote a la pregunta:', error);
    res.status(500).json({ error: 'Error interno del servidor al procesar el upvote.' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;

// En producción, manejar todas las rutas para que funcione el enrutamiento de React
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
  });
}

// Conectar a la base de datos y luego iniciar el servidor
connectToDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT} en modo ${process.env.NODE_ENV || 'desarrollo'}`);
  });
});
