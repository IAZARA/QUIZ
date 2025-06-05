import { ObjectId } from 'mongodb';

let db;

// Función para configurar las rutas de compartir links
export default function setupLinkSharingRoutes(app, io, database) {
  db = database;

  // Obtener todos los links
  app.get('/api/links', async (req, res) => {
    try {
      const links = await db.collection('shared_links').find({}).sort({ createdAt: -1 }).toArray();
      res.json(links);
    } catch (error) {
      console.error('Error fetching links:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Obtener link activo
  app.get('/api/links/active', async (req, res) => {
    try {
      const activeLink = await db.collection('shared_links').findOne({ isShared: true });
      res.json(activeLink);
    } catch (error) {
      console.error('Error fetching active link:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Crear un nuevo link
  app.post('/api/links', async (req, res) => {
    try {
      const linkData = {
        ...req.body,
        isShared: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('shared_links').insertOne(linkData);
      const newLink = { ...linkData, _id: result.insertedId };
      
      res.status(201).json(newLink);
      
      // Emitir evento de socket
      io.emit('link:created', newLink);
    } catch (error) {
      console.error('Error creating link:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Actualizar un link
  app.put('/api/links/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = {
        ...req.body,
        updatedAt: new Date()
      };

      await db.collection('shared_links').updateOne(
        { _id: new ObjectId(id) },
        { $set: updates }
      );

      const updatedLink = await db.collection('shared_links').findOne({ _id: new ObjectId(id) });
      
      res.json(updatedLink);
      
      // Emitir evento de socket
      io.emit('link:updated', updatedLink);
    } catch (error) {
      console.error('Error updating link:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Eliminar un link
  app.delete('/api/links/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar si el link que se va a eliminar está siendo compartido
      const linkToDelete = await db.collection('shared_links').findOne({ _id: new ObjectId(id) });
      if (linkToDelete && linkToDelete.isShared) {
        // Si está siendo compartido, detener el compartir primero
        io.emit('link:stopped');
      }

      await db.collection('shared_links').deleteOne({ _id: new ObjectId(id) });
      
      res.json({ success: true });
      
      // Emitir evento de socket
      io.emit('link:deleted', id);
    } catch (error) {
      console.error('Error deleting link:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Compartir un link específico
  app.post('/api/links/:id/share', async (req, res) => {
    try {
      const { id } = req.params;

      // Primero, desactivar cualquier link que esté siendo compartido
      await db.collection('shared_links').updateMany(
        { isShared: true },
        { $set: { isShared: false, updatedAt: new Date() } }
      );

      // Activar el link seleccionado
      await db.collection('shared_links').updateOne(
        { _id: new ObjectId(id) },
        { $set: { isShared: true, updatedAt: new Date() } }
      );

      const sharedLink = await db.collection('shared_links').findOne({ _id: new ObjectId(id) });
      
      if (!sharedLink) {
        return res.status(404).json({ error: 'Link no encontrado' });
      }
      
      res.json(sharedLink);
      
      // Emitir eventos de socket
      io.emit('link:shared', { link: sharedLink });
      io.emit('link:status', { isActive: true });
      
      console.log('Link shared:', sharedLink.title);
    } catch (error) {
      console.error('Error sharing link:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Compartir todos los links
  app.post('/api/links/share-all', async (req, res) => {
    try {
      // Obtener todos los links activos
      const allLinks = await db.collection('shared_links').find({ isActive: true }).toArray();
      
      if (allLinks.length === 0) {
        return res.status(400).json({ error: 'No hay links disponibles para compartir' });
      }

      // Marcar todos los links como compartidos
      await db.collection('shared_links').updateMany(
        { isActive: true },
        { $set: { isShared: true, updatedAt: new Date() } }
      );

      res.json({ success: true, sharedCount: allLinks.length, links: allLinks });
      
      // Emitir eventos de socket
      io.emit('links:shared-all', { links: allLinks });
      io.emit('link:status', { isActive: true });
      
      console.log(`Shared all links: ${allLinks.length} links`);
    } catch (error) {
      console.error('Error sharing all links:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Detener el compartir link
  app.post('/api/links/stop-sharing', async (req, res) => {
    try {
      // Desactivar todos los links compartidos
      await db.collection('shared_links').updateMany(
        { isShared: true },
        { $set: { isShared: false, updatedAt: new Date() } }
      );

      res.json({ success: true });
      
      // Emitir eventos de socket
      io.emit('link:stopped');
      
      console.log('Link sharing stopped');
    } catch (error) {
      console.error('Error stopping link sharing:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Activar la función de compartir links
  app.post('/api/links/status/activate', async (req, res) => {
    try {
      // Emitir evento de socket para activar la vista
      io.emit('link:status', { isActive: true });
      
      res.json({ success: true, message: 'Link sharing activated for audience' });
      
      console.log('Link sharing feature activated');
    } catch (error) {
      console.error('Error activating link sharing:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Desactivar la función de compartir links
  app.post('/api/links/status/deactivate', async (req, res) => {
    try {
      // Primero detener cualquier link que esté siendo compartido
      await db.collection('shared_links').updateMany(
        { isShared: true },
        { $set: { isShared: false, updatedAt: new Date() } }
      );

      // Emitir eventos de socket
      io.emit('link:status', { isActive: false });
      io.emit('link:stopped');
      
      res.json({ success: true, message: 'Link sharing deactivated for audience' });
      
      console.log('Link sharing feature deactivated');
    } catch (error) {
      console.error('Error deactivating link sharing:', error);
      res.status(500).json({ error: error.message });
    }
  });
}

// Función para configurar los listeners de socket específicos para links
export function setupLinkSharingSockets(io) {
  io.on('connection', (socket) => {
    console.log('Usuario conectado para link sharing:', socket.id);

    // Enviar el estado actual al conectarse
    socket.on('request:link-status', async () => {
      try {
        if (db) {
          const activeLink = await db.collection('shared_links').findOne({ isShared: true });
          if (activeLink) {
            socket.emit('link:shared', { link: activeLink });
            socket.emit('link:status', { isActive: true });
          } else {
            socket.emit('link:status', { isActive: false });
          }
        }
      } catch (error) {
        console.error('Error sending link status:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Usuario desconectado de link sharing:', socket.id);
    });
  });
}