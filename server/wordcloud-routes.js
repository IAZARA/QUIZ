import { Router } from 'express';
import mongoose from 'mongoose';
import { io } from './index.js';

const router = Router();

// Esquema para las palabras de la nube
const wordCloudSchema = new mongoose.Schema({
  text: { type: String, required: true },
  count: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
});

// Modelo para las palabras de la nube
const WordCloud = mongoose.model('WordCloud', wordCloudSchema);

// Estado global de la nube de palabras
let wordCloudActive = false;

// Obtener todas las palabras
router.get('/', async (req, res) => {
  try {
    const words = await WordCloud.find().sort({ count: -1 });
    res.json({ words, isActive: wordCloudActive });
  } catch (error) {
    console.error('Error al obtener palabras:', error);
    res.status(500).json({ error: 'Error al obtener palabras' });
  }
});

// Iniciar la nube de palabras
router.post('/start', (req, res) => {
  wordCloudActive = true;
  io.emit('wordcloud:status', { isActive: true });
  res.json({ success: true, isActive: wordCloudActive });
});

// Detener la nube de palabras
router.post('/stop', (req, res) => {
  wordCloudActive = false;
  io.emit('wordcloud:status', { isActive: false });
  res.json({ success: true, isActive: wordCloudActive });
});

// Reiniciar la nube de palabras (eliminar todas las palabras)
router.post('/reset', async (req, res) => {
  try {
    await WordCloud.deleteMany({});
    io.emit('wordcloud:update', []);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al reiniciar la nube de palabras:', error);
    res.status(500).json({ error: 'Error al reiniciar la nube de palabras' });
  }
});

// Añadir una palabra
router.post('/word', async (req, res) => {
  try {
    const { word } = req.body;
    
    if (!word || typeof word !== 'string' || word.trim().length === 0) {
      return res.status(400).json({ error: 'Palabra inválida' });
    }
    
    if (!wordCloudActive) {
      return res.status(403).json({ error: 'La nube de palabras no está activa' });
    }
    
    const normalizedWord = word.trim().toLowerCase();
    
    // Buscar si la palabra ya existe
    let wordDoc = await WordCloud.findOne({ text: normalizedWord });
    
    if (wordDoc) {
      // Si existe, incrementar el contador
      wordDoc.count += 1;
      await wordDoc.save();
    } else {
      // Si no existe, crear una nueva
      wordDoc = new WordCloud({
        text: normalizedWord,
        count: 1
      });
      await wordDoc.save();
    }
    
    // Obtener todas las palabras actualizadas
    const words = await WordCloud.find().sort({ count: -1 });
    
    // Emitir actualización a todos los clientes
    io.emit('wordcloud:update', words);
    
    res.json({ success: true, word: wordDoc });
  } catch (error) {
    console.error('Error al añadir palabra:', error);
    res.status(500).json({ error: 'Error al añadir palabra' });
  }
});

export default router;
