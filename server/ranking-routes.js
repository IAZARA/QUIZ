import { Router } from 'express';
import { io } from './index.js';

const router = Router();

// Estado global del ranking (siguiendo el patrón de wordcloud-routes.js)
let rankingVisible = false;

// Obtener estado actual del ranking
router.get('/status', (req, res) => {
  try {
    const connectedClients = io.engine.clientsCount;
    const socketIds = Array.from(io.sockets.sockets.keys());
    
    console.log(`📊 Estado del ranking solicitado - Visible: ${rankingVisible}, Clientes: ${connectedClients}`);
    
    res.json({
      success: true,
      isVisible: rankingVisible,
      connectedClients: connectedClients,
      socketIds: socketIds,
      timestamp: new Date().toISOString(),
      serverStatus: 'active'
    });
  } catch (error) {
    console.error('❌ Error al obtener estado del ranking:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estado del ranking',
      error: error.message
    });
  }
});

// Mostrar ranking (siguiendo el patrón de wordcloud)
router.post('/show', (req, res) => {
  try {
    rankingVisible = true;
    const connectedClients = io.engine.clientsCount;
    
    console.log(`🎯 Mostrando ranking a ${connectedClients} clientes conectados`);
    console.log('📊 Sockets conectados:', Array.from(io.sockets.sockets.keys()));
    
    // Emitir evento específico del ranking (siguiendo patrón wordcloud:status)
    io.emit('ranking:status', { isVisible: true });
    
    // Mantener compatibilidad con eventos existentes
    io.emit('show_ranking', {
      message: 'Clasificación mostrada por el administrador',
      timestamp: new Date().toISOString(),
      adminAction: true
    });
    
    console.log('✅ Evento ranking:status emitido correctamente');
    res.json({
      success: true,
      message: 'Clasificación mostrada correctamente',
      isVisible: rankingVisible,
      clientsNotified: connectedClients,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error al mostrar la clasificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al mostrar la clasificación',
      error: error.message
    });
  }
});

// Ocultar ranking
router.post('/hide', (req, res) => {
  try {
    rankingVisible = false;
    const connectedClients = io.engine.clientsCount;
    
    console.log(`🎯 Ocultando ranking a ${connectedClients} clientes conectados`);
    console.log('📊 Sockets conectados:', Array.from(io.sockets.sockets.keys()));
    
    // Emitir evento específico del ranking
    io.emit('ranking:status', { isVisible: false });
    
    // Mantener compatibilidad con eventos existentes
    io.emit('hide_ranking', {
      message: 'Clasificación ocultada por el administrador',
      timestamp: new Date().toISOString(),
      adminAction: true
    });
    
    console.log('✅ Evento ranking:status emitido correctamente');
    res.json({
      success: true,
      message: 'Clasificación ocultada correctamente',
      isVisible: rankingVisible,
      clientsNotified: connectedClients,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error al ocultar la clasificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al ocultar la clasificación',
      error: error.message
    });
  }
});

export default router;