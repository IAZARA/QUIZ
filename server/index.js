import express from 'express';
import cors from 'cors';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Configuración para servir archivos estáticos
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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

// Conectar a MongoDB
async function connectToDatabase() {
  try {
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
    const endTime = question.timer ? new Date(Date.now() + (question.timer * 1000)) : null;
    
    await db.collection('questions').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          is_active: true, 
          correct_option: null, 
          endTime, 
          votingClosed: false 
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
      const timeoutMs = question.timer * 1000;
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
    
    const updatedQuestion = await db.collection('questions').findOne({ _id: new ObjectId(id) });
    const votes = await getVotesForQuestion(id);
    
    console.log(`Votación detenida para la pregunta ${id}. Respuesta correcta: ${correctOption}`);
    
    res.json({ question: updatedQuestion, votes });
    io.emit('voting_stopped', { question: updatedQuestion, votes });
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
    
    // Registrar el voto
    await db.collection('votes').insertOne({
      question_id: id,
      option,
      voter_id,
      created_at: new Date()
    });
    
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

// Socket.io para tiempo real
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
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
