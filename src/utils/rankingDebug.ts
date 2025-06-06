// Utilidad para debugging del sistema de ranking WebSocket
export const debugRankingWebSocket = () => {
  console.log('🔍 === DEBUG RANKING WEBSOCKET ===');
  
  // Verificar socket global
  const socket = (window as any).socketInstance;
  console.log('📡 Socket global:', {
    exists: !!socket,
    connected: socket?.connected,
    id: socket?.id,
    url: socket?.io?.uri
  });
  
  // Verificar listeners registrados
  if (socket) {
    const showRankingListeners = socket.listeners('show_ranking');
    const hideRankingListeners = socket.listeners('hide_ranking');
    
    console.log('👂 Listeners registrados:', {
      show_ranking: showRankingListeners.length,
      hide_ranking: hideRankingListeners.length
    });
  }
  
  // Verificar estado del store
  const quizConfigStore = (window as any).__QUIZ_CONFIG_STORE__;
  if (quizConfigStore) {
    console.log('🏪 Estado del store:', {
      isRankingVisible: quizConfigStore.isRankingVisible,
      config: quizConfigStore.config
    });
  }
  
  console.log('🔍 === FIN DEBUG ===');
};

// Función para probar la conectividad manualmente
export const testRankingConnectivity = async () => {
  console.log('🧪 === TEST CONECTIVIDAD RANKING ===');
  
  try {
    // Probar endpoint de estado
    const statusResponse = await fetch('/api/admin/ranking-status');
    const statusData = await statusResponse.json();
    console.log('📊 Estado del servidor:', statusData);
    
    // Probar emisión manual
    const socket = (window as any).socketInstance;
    if (socket) {
      console.log('📤 Emitiendo evento de prueba...');
      
      // Configurar listener para respuesta
      socket.once('test_ranking_response', (response: any) => {
        console.log('✅ Respuesta del test recibida:', response);
      });
      
      socket.emit('test_ranking_connection', {
        test: true,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
    }
    
  } catch (error) {
    console.error('❌ Error en test de conectividad:', error);
  }
  
  console.log('🧪 === FIN TEST ===');
};

// Exponer funciones globalmente para debugging desde consola
if (typeof window !== 'undefined') {
  (window as any).debugRankingWebSocket = debugRankingWebSocket;
  (window as any).testRankingConnectivity = testRankingConnectivity;
}