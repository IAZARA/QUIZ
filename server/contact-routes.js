import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from './db.js';

const router = express.Router();

// Obtener todos los contactos
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const contacts = await db.collection('contacts').find().sort({ name: 1 }).toArray();
    
    res.json(contacts);
  } catch (error) {
    console.error('Error al obtener contactos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener contactos' });
  }
});

// Crear un nuevo contacto
router.post('/', async (req, res) => {
  try {
    const { name, email, whatsapp } = req.body;
    
    if (!name || !email || !whatsapp) {
      return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
    }
    
    const db = await getDb();
    
    const newContact = {
      name,
      email,
      whatsapp,
      created_at: new Date()
    };
    
    const result = await db.collection('contacts').insertOne(newContact);
    
    res.status(201).json({
      ...newContact,
      _id: result.insertedId
    });
  } catch (error) {
    console.error('Error al crear contacto:', error);
    res.status(500).json({ success: false, message: 'Error al crear contacto' });
  }
});

// Actualizar un contacto existente
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, whatsapp } = req.body;
    
    if (!name && !email && !whatsapp) {
      return res.status(400).json({ success: false, message: 'Se debe proporcionar al menos un campo para actualizar' });
    }
    
    const db = await getDb();
    
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (whatsapp) updates.whatsapp = whatsapp;
    
    const result = await db.collection('contacts').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Contacto no encontrado' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error al actualizar contacto:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar contacto' });
  }
});

// Eliminar un contacto
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = await getDb();
    
    const result = await db.collection('contacts').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Contacto no encontrado' });
    }
    
    res.json({ success: true, message: 'Contacto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar contacto:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar contacto' });
  }
});

// Eventos de Socket.IO para contactos
export const setupContactSockets = (io) => {
  // Mostrar contactos a la audiencia
  io.on('connection', (socket) => {
    socket.on('contacts:show', () => {
      io.emit('contacts:visibility', { isVisible: true });
    });
    
    socket.on('contacts:hide', () => {
      io.emit('contacts:visibility', { isVisible: false });
    });
  });
};

export default router;
