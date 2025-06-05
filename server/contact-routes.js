import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from './db.js';

const router = express.Router();
let ioInstance = null; // Variable to hold the io instance

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
    const { name, contactMethods = [], email, whatsapp } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
    }
    
    const db = await getDb();
    
    // Migrar campos legacy si existen
    const methods = [...contactMethods];
    if (email) {
      methods.push({
        _id: new ObjectId(),
        type: 'email',
        value: email
      });
    }
    if (whatsapp) {
      methods.push({
        _id: new ObjectId(),
        type: 'whatsapp',
        value: whatsapp
      });
    }
    
    const newContact = {
      name,
      contactMethods: methods,
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
    const { name, contactMethods, email, whatsapp } = req.body;
    
    if (!name && !contactMethods && !email && !whatsapp) {
      return res.status(400).json({ success: false, message: 'Se debe proporcionar al menos un campo para actualizar' });
    }
    
    const db = await getDb();
    
    const updates = {};
    if (name) updates.name = name;
    if (contactMethods) updates.contactMethods = contactMethods;
    
    // Soporte legacy para email y whatsapp
    if (email || whatsapp) {
      const contact = await db.collection('contacts').findOne({ _id: new ObjectId(id) });
      if (contact) {
        const methods = contact.contactMethods || [];
        
        if (email) {
          const emailIndex = methods.findIndex(m => m.type === 'email');
          if (emailIndex >= 0) {
            methods[emailIndex].value = email;
          } else {
            methods.push({
              _id: new ObjectId(),
              type: 'email',
              value: email
            });
          }
        }
        
        if (whatsapp) {
          const whatsappIndex = methods.findIndex(m => m.type === 'whatsapp');
          if (whatsappIndex >= 0) {
            methods[whatsappIndex].value = whatsapp;
          } else {
            methods.push({
              _id: new ObjectId(),
              type: 'whatsapp',
              value: whatsapp
            });
          }
        }
        
        updates.contactMethods = methods;
      }
    }
    
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
const configureContactSocketListeners = (io) => {
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

// New routes for activating/deactivating contacts status
router.post('/status/activate', (req, res) => {
  if (!ioInstance) {
    console.error('Socket.IO instance not available in contact-routes for activate');
    return res.status(500).json({ success: false, message: 'Server error: Socket.IO not initialized' });
  }
  try {
    ioInstance.emit('contacts:status', { isActive: true });
    console.log('Contacts activated, event emitted via /api/contacts/status/activate');
    res.status(200).json({ success: true, message: 'Contacts activated for audience' });
  } catch (error) {
    console.error('Error activating contacts:', error);
    res.status(500).json({ success: false, message: 'Failed to activate contacts' });
  }
});

router.post('/status/deactivate', (req, res) => {
  if (!ioInstance) {
    console.error('Socket.IO instance not available in contact-routes for deactivate');
    return res.status(500).json({ success: false, message: 'Server error: Socket.IO not initialized' });
  }
  try {
    ioInstance.emit('contacts:status', { isActive: false });
    console.log('Contacts deactivated, event emitted via /api/contacts/status/deactivate');
    res.status(200).json({ success: true, message: 'Contacts deactivated for audience' });
  } catch (error) {
    console.error('Error deactivating contacts:', error);
    res.status(500).json({ success: false, message: 'Failed to deactivate contacts' });
  }
});

// Agregar método de contacto a un contacto existente
router.post('/:id/methods', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, value, label } = req.body;
    
    if (!type || !value) {
      return res.status(400).json({ success: false, message: 'Tipo y valor son obligatorios' });
    }
    
    const db = await getDb();
    
    const newMethod = {
      _id: new ObjectId(),
      type,
      value,
      label: label || undefined
    };
    
    const result = await db.collection('contacts').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $push: { contactMethods: newMethod } },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Contacto no encontrado' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error al agregar método de contacto:', error);
    res.status(500).json({ success: false, message: 'Error al agregar método de contacto' });
  }
});

// Actualizar método de contacto específico
router.put('/:id/methods/:methodId', async (req, res) => {
  try {
    const { id, methodId } = req.params;
    const { type, value, label } = req.body;
    
    const db = await getDb();
    
    const updates = {};
    if (type) updates['contactMethods.$.type'] = type;
    if (value) updates['contactMethods.$.value'] = value;
    if (label !== undefined) updates['contactMethods.$.label'] = label || undefined;
    
    const result = await db.collection('contacts').findOneAndUpdate(
      {
        _id: new ObjectId(id),
        'contactMethods._id': new ObjectId(methodId)
      },
      { $set: updates },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Contacto o método no encontrado' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error al actualizar método de contacto:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar método de contacto' });
  }
});

// Eliminar método de contacto específico
router.delete('/:id/methods/:methodId', async (req, res) => {
  try {
    const { id, methodId } = req.params;
    
    const db = await getDb();
    
    const result = await db.collection('contacts').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $pull: { contactMethods: { _id: new ObjectId(methodId) } } },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Contacto no encontrado' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error al eliminar método de contacto:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar método de contacto' });
  }
});
// Export setupContactSockets to capture the io instance and configure listeners
export const setupContactSockets = (io) => {
  ioInstance = io; // Capture the io instance
  configureContactSocketListeners(io); // Call the function that sets up listeners
};



export default router;
