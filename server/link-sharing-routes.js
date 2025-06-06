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
      // Validar datos requeridos
      if (!req.body.title || !req.body.url) {
        return res.status(400).json({ error: 'Título y URL son requeridos' });
      }

      const linkData = {
        title: req.body.title.trim(),
        url: req.body.url.trim(),
        description: req.body.description ? req.body.description.trim() : '',
        isActive: req.body.isActive || true,
        isShared: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Intentando crear link:', linkData);
      const result = await db.collection('shared_links').insertOne(linkData);
      const newLink = { ...linkData, _id: result.insertedId };
      
      console.log('Link creado exitosamente:', newLink._id);
      res.status(201).json(newLink);
      
      // Emitir evento de socket
      io.emit('link:created', newLink);
      console.log('Link created and broadcasted:', newLink.title);
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

  // Compartir un link específico (activa automáticamente la función)
  app.post('/api/links/:id/share', async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar que el link existe
      const linkToShare = await db.collection('shared_links').findOne({ _id: new ObjectId(id) });
      if (!linkToShare) {
        return res.status(404).json({ error: 'Link no encontrado' });
      }

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
      
      res.json(sharedLink);
      
      // Emitir eventos de socket - FUNCIÓN SE ACTIVA AUTOMÁTICAMENTE
      io.emit('link:shared', { link: sharedLink });
      io.emit('link:status', { isActive: true });
      
      console.log('Link compartido individualmente (función activada):', sharedLink.title);
    } catch (error) {
      console.error('Error sharing link:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Compartir todos los links (activa automáticamente la función)
  app.post('/api/links/share-all', async (req, res) => {
    try {
      // Obtener todos los links activos
      const allLinks = await db.collection('shared_links').find({ isActive: { $ne: false } }).toArray();
      
      if (allLinks.length === 0) {
        return res.status(400).json({ error: 'No hay links disponibles para compartir' });
      }

      // Primero, desactivar cualquier link que esté siendo compartido individualmente
      await db.collection('shared_links').updateMany(
        { isShared: true },
        { $set: { isShared: false, updatedAt: new Date() } }
      );

      // Marcar todos los links activos como compartidos
      await db.collection('shared_links').updateMany(
        { isActive: { $ne: false } },
        { $set: { isShared: true, updatedAt: new Date() } }
      );

      // Obtener los links actualizados
      const updatedLinks = await db.collection('shared_links').find({ isShared: true }).toArray();

      res.json({ success: true, sharedCount: updatedLinks.length, links: updatedLinks });
      
      // Emitir eventos de socket - FUNCIÓN SE ACTIVA AUTOMÁTICAMENTE
      io.emit('links:shared-all', { links: updatedLinks });
      io.emit('link:status', { isActive: true });
      
      console.log(`Compartidos todos los links (función activada): ${updatedLinks.length} links`);
    } catch (error) {
      console.error('Error sharing all links:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Detener el compartir link (desactiva automáticamente la función)
  app.post('/api/links/stop-sharing', async (req, res) => {
    try {
      // Desactivar todos los links compartidos
      await db.collection('shared_links').updateMany(
        { isShared: true },
        { $set: { isShared: false, updatedAt: new Date() } }
      );

      res.json({ success: true });
      
      // Emitir eventos de socket - FUNCIÓN SE DESACTIVA AUTOMÁTICAMENTE
      io.emit('link:stopped');
      io.emit('link:status', { isActive: false });
      
      console.log('Compartir links detenido (función desactivada automáticamente)');
    } catch (error) {
      console.error('Error stopping link sharing:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // NOTA: Las rutas de activar/desactivar función se eliminaron
  // porque ahora la función se activa/desactiva automáticamente
  // al compartir/detener compartir links
}

// Función para configurar los listeners de socket específicos para links
export function setupLinkSharingSockets(io) {
  io.on('connection', (socket) => {
    console.log('Usuario conectado para link sharing:', socket.id);

    // Enviar el estado actual al conectarse
    socket.on('request:link-status', async () => {
      try {
        if (db) {
          // Verificar si hay un link individual compartido
          const activeLink = await db.collection('shared_links').findOne({ isShared: true });
          
          if (activeLink) {
            // Verificar si hay múltiples links compartidos
            const allSharedLinks = await db.collection('shared_links').find({ isShared: true }).toArray();
            
            if (allSharedLinks.length > 1) {
              // Múltiples links compartidos
              socket.emit('links:shared-all', { links: allSharedLinks });
              socket.emit('link:status', { isActive: true });
              console.log(`Sent multiple shared links status to ${socket.id}: ${allSharedLinks.length} links`);
            } else {
              // Un solo link compartido
              socket.emit('link:shared', { link: activeLink });
              socket.emit('link:status', { isActive: true });
              console.log(`Sent single shared link status to ${socket.id}: ${activeLink.title}`);
            }
          } else {
            socket.emit('link:status', { isActive: false });
            console.log(`Sent inactive status to ${socket.id}`);
          }
        }
      } catch (error) {
        console.error('Error sending link status:', error);
        socket.emit('link:status', { isActive: false });
      }
    });

    socket.on('disconnect', () => {
      console.log('Usuario desconectado de link sharing:', socket.id);
    });
  });
}