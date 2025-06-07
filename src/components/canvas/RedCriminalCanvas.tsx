import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface Node {
  id: string;
  name: string;
  isLeader: boolean;
  x: number;
  y: number;
}

interface Edge {
  from: string;
  to: string;
  type: string;
}

interface Level {
  nodes: Omit<Node, 'x' | 'y'>[];
  edges: Edge[];
  leaderId: string;
  description: string;
  explanation: string;
}

interface RedCriminalCanvasProps {
  onStateChange?: (state: any) => void;
  initialState?: any;
  isInteractive?: boolean;
}

const RedCriminalCanvas: React.FC<RedCriminalCanvasProps> = ({
  onStateChange,
  initialState = {},
  isInteractive = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [gameMessage, setGameMessage] = useState('');
  const [gameState, setGameState] = useState<'playing' | 'won' | 'completed'>('playing');
  const [showNextLevel, setShowNextLevel] = useState(false);
  const [showReset, setShowReset] = useState(false);

  // Niveles más desafiantes
  const levels: Level[] = [
    {
      nodes: [
        { id: 'A', name: 'Ana', isLeader: false },
        { id: 'B', name: 'Bruno', isLeader: true },
        { id: 'C', name: 'Carlos', isLeader: false },
        { id: 'D', name: 'Diana', isLeader: false },
        { id: 'E', name: 'Elena', isLeader: false }
      ],
      edges: [
        { from: 'A', to: 'B', type: 'Financiero' },
        { from: 'A', to: 'C', type: 'Operativo' },
        { from: 'B', to: 'D', type: 'Comunicación' },
        { from: 'C', to: 'D', type: 'Logística' },
        { from: 'C', to: 'E', type: 'Contacto' },
        { from: 'D', to: 'E', type: 'Información' }
      ],
      leaderId: 'B',
      description: "Red de 5 miembros. Observa las etiquetas en las conexiones. ¿Quién controla los recursos más importantes?",
      explanation: "Bruno es el líder porque controla las FINANZAS (conexión con Ana) y las COMUNICACIONES (conexión con Diana). Aunque Diana tiene más conexiones, Bruno controla los recursos críticos de la organización."
    },
    {
      nodes: [
        { id: '1', name: 'Laura', isLeader: false },
        { id: '2', name: 'Miguel', isLeader: false },
        { id: '3', name: 'Nora', isLeader: false },
        { id: '4', name: 'Óscar', isLeader: true },
        { id: '5', name: 'Paula', isLeader: false },
        { id: '6', name: 'Roberto', isLeader: false }
      ],
      edges: [
        { from: '1', to: '2', type: 'Operativo' },
        { from: '1', to: '3', type: 'Financiero' },
        { from: '2', to: '4', type: 'Comunicación' },
        { from: '3', to: '5', type: 'Logística' },
        { from: '4', to: '5', type: 'Coordinación' },
        { from: '4', to: '6', type: 'Seguridad' },
        { from: '5', to: '6', type: 'Contacto' }
      ],
      leaderId: '4',
      description: "Red de 6 miembros con múltiples subgrupos. ¿Quién coordina todo?",
      explanation: "Óscar es el líder. Aunque Laura y Paula también tienen 2 conexiones, Óscar es el único que conecta los dos subgrupos principales (Laura-Miguel-Nora y Paula-Roberto), controlando la comunicación y seguridad."
    },
    {
      nodes: [
        { id: 'X', name: 'Xavier', isLeader: false },
        { id: 'Y', name: 'Yara', isLeader: false },
        { id: 'Z', name: 'Zoe', isLeader: false },
        { id: 'W', name: 'Walter', isLeader: true },
        { id: 'V', name: 'Valeria', isLeader: false },
        { id: 'U', name: 'Úrsula', isLeader: false },
        { id: 'T', name: 'Tomás', isLeader: false }
      ],
      edges: [
        { from: 'X', to: 'Y', type: 'Financiero' },
        { from: 'Y', to: 'Z', type: 'Operativo' },
        { from: 'Z', to: 'W', type: 'Comunicación' },
        { from: 'W', to: 'V', type: 'Logística' },
        { from: 'V', to: 'U', type: 'Contacto' },
        { from: 'X', to: 'W', type: 'Control' },
        { from: 'W', to: 'T', type: 'Seguridad' },
        { from: 'U', to: 'T', type: 'Información' }
      ],
      leaderId: 'W',
      description: "Red compleja de 7 miembros. El líder puede estar oculto en la estructura.",
      explanation: "Walter es el líder. Aunque no es el más conectado, es el único punto de conexión entre las cadenas Xavier-Yara-Zoe y Valeria-Úrsula-Tomás, controlando tanto el flujo principal como las operaciones de seguridad."
    }
  ];

  // Constantes de diseño
  const NODE_RADIUS = 30;
  const NODE_COLOR = '#3B82F6';
  const LEADER_COLOR = '#EF4444';
  const SELECTED_COLOR = '#F59E0B';
  const EDGE_COLOR = '#6B7280';

  // Posiciones más complejas para ocultar al líder
  const getNodePositions = useCallback((levelIndex: number, canvasWidth: number, canvasHeight: number) => {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    if (levelIndex === 0) {
      // Nivel 1: 5 nodos - líder no está en el centro visual
      return [
        { x: centerX - 120, y: centerY - 60 }, // A - izquierda arriba
        { x: centerX - 60, y: centerY + 80 },  // B - izquierda abajo (líder)
        { x: centerX + 60, y: centerY - 60 },  // C - derecha arriba
        { x: centerX + 120, y: centerY + 20 }, // D - derecha centro
        { x: centerX, y: centerY - 120 }       // E - arriba centro
      ];
    } else if (levelIndex === 1) {
      // Nivel 2: 6 nodos en dos grupos
      return [
        { x: centerX - 150, y: centerY - 80 }, // 1 - grupo izquierdo arriba
        { x: centerX - 80, y: centerY - 40 },  // 2 - grupo izquierdo centro
        { x: centerX - 120, y: centerY + 60 }, // 3 - grupo izquierdo abajo
        { x: centerX + 40, y: centerY - 20 },  // 4 - centro (líder)
        { x: centerX + 120, y: centerY + 40 }, // 5 - grupo derecho centro
        { x: centerX + 80, y: centerY - 80 }   // 6 - grupo derecho arriba
      ];
    } else {
      // Nivel 3: 7 nodos en cadena compleja
      return [
        { x: centerX - 180, y: centerY },      // X - extremo izquierdo
        { x: centerX - 120, y: centerY - 80 }, // Y - izquierda arriba
        { x: centerX - 60, y: centerY + 60 },  // Z - izquierda abajo
        { x: centerX + 20, y: centerY - 20 },  // W - centro (líder)
        { x: centerX + 100, y: centerY + 80 }, // V - derecha abajo
        { x: centerX + 140, y: centerY - 60 }, // U - derecha arriba
        { x: centerX + 60, y: centerY + 120 }  // T - abajo centro
      ];
    }
  }, []);

  // Función para dibujar el canvas
  const drawNetwork = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar aristas con etiquetas
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      if (!fromNode || !toNode) return;

      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.strokeStyle = selectedNode && (selectedNode.id === fromNode.id || selectedNode.id === toNode.id)
        ? '#8B5CF6' : EDGE_COLOR;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Dibujar etiqueta del tipo de conexión
      const midX = (fromNode.x + toNode.x) / 2;
      const midY = (fromNode.y + toNode.y) / 2;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(midX - 25, midY - 8, 50, 16);
      ctx.strokeStyle = '#6B7280';
      ctx.lineWidth = 1;
      ctx.strokeRect(midX - 25, midY - 8, 50, 16);
      
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(edge.type, midX, midY);
    });

    // Dibujar nodos
    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
      
      if (node.isLeader && gameState === 'won') {
        ctx.fillStyle = LEADER_COLOR;
      } else if (selectedNode && selectedNode.id === node.id) {
        ctx.fillStyle = SELECTED_COLOR;
      } else {
        ctx.fillStyle = NODE_COLOR;
      }
      
      ctx.fill();
      ctx.strokeStyle = '#1F2937';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Texto del nombre
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.name, node.x, node.y);
    });
  }, [nodes, edges, selectedNode, gameState]);

  // Cargar nivel
  const loadLevel = useCallback((levelIndex: number) => {
    if (levelIndex >= levels.length) {
      setGameMessage("¡Felicitaciones! Has completado todos los niveles.");
      setGameState('completed');
      setShowReset(true);
      return;
    }

    const level = levels[levelIndex];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const positions = getNodePositions(levelIndex, canvas.width, canvas.height);
    const newNodes = level.nodes.map((node, index) => ({
      ...node,
      x: positions[index].x,
      y: positions[index].y
    }));

    setNodes(newNodes);
    setEdges([...level.edges]);
    setSelectedNode(null);
    setCurrentLevel(levelIndex);
    setGameMessage(`Nivel ${levelIndex + 1}: ${level.description}`);
    setGameState('playing');
    setShowNextLevel(false);
    setShowReset(false);

    if (onStateChange) {
      onStateChange({
        currentLevel: levelIndex,
        gameState: 'playing'
      });
    }
  }, [levels, getNodePositions, onStateChange]);

  // Manejar clics en el canvas
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isInteractive || gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Verificar si se hizo clic en un nodo
    for (const node of nodes) {
      const distance = Math.sqrt((mouseX - node.x)**2 + (mouseY - node.y)**2);
      
      if (distance < NODE_RADIUS) {
        setSelectedNode(node);
        setGameMessage(`Has seleccionado a: ${node.name}. Analiza sus conexiones.`);
        return;
      }
    }

    // Si no se hizo clic en ningún nodo, deseleccionar
    setSelectedNode(null);
    setGameMessage("Haz clic en un nodo para seleccionarlo, luego en 'Identificar Líder'.");
  }, [nodes, isInteractive, gameState]);

  // Identificar líder
  const handleIdentifyLeader = useCallback(() => {
    if (!selectedNode) {
      setGameMessage("¡Primero selecciona un miembro!");
      return;
    }

    const leader = levels[currentLevel].leaderId;
    if (selectedNode.id === leader) {
      setGameMessage(`¡Correcto! ${selectedNode.name} es el líder.`);
      setGameState('won');
      
      // Marcar el líder
      setNodes(prev => prev.map(node =>
        node.id === leader ? { ...node, isLeader: true } : node
      ));

      setTimeout(() => {
        setGameMessage(levels[currentLevel].explanation);
        
        if (currentLevel === levels.length - 1) {
          setTimeout(() => {
            setGameMessage("¡Felicitaciones! Has completado todos los niveles.");
            setGameState('completed');
            setShowReset(true);
          }, 2000);
        } else {
          setShowNextLevel(true);
        }
      }, 1500);

      if (onStateChange) {
        onStateChange({
          currentLevel,
          gameState: 'won',
          selectedLeader: selectedNode.name
        });
      }
    } else {
      setGameMessage(`${selectedNode.name} no es el líder. ¡Inténtalo de nuevo!`);
      setSelectedNode(null);
      
      setTimeout(() => {
        setGameMessage("Analiza las conexiones y selecciona al verdadero líder.");
      }, 2000);
    }
  }, [selectedNode, currentLevel, levels, onStateChange]);

  // Siguiente nivel
  const handleNextLevel = useCallback(() => {
    loadLevel(currentLevel + 1);
  }, [currentLevel, loadLevel]);

  // Reiniciar juego
  const handleResetGame = useCallback(() => {
    loadLevel(0);
  }, [loadLevel]);

  // Redimensionar canvas
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 600;
    canvas.height = 400;
    
    // Recargar el nivel actual para reposicionar nodos
    if (nodes.length > 0) {
      loadLevel(currentLevel);
    }
  }, [nodes.length, currentLevel, loadLevel]);

  // Efectos
  useEffect(() => {
    resizeCanvas();
    loadLevel(initialState.currentLevel || 0);
    
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    drawNetwork();
  }, [drawNetwork]);

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Red Criminal</h1>
        <p className="text-blue-100">
          Identifica al líder de la red criminal analizando las conexiones.
        </p>
      </div>

      {/* Game Area */}
      <div className="p-6">
        <div className="bg-gray-50 rounded-lg p-4 mb-4 flex justify-center">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            width={600}
            height={400}
            className="bg-white rounded-lg shadow-md cursor-pointer border border-gray-200"
          />
        </div>

        {/* Message Box */}
        <motion.div 
          className={`bg-white border rounded-lg p-4 text-center mb-4 ${
            gameState === 'won' ? 'border-green-400 bg-green-50 text-green-800' :
            'border-gray-300 text-gray-700'
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {gameMessage || "Haz clic en un nodo para seleccionarlo, luego en 'Identificar Líder'."}
        </motion.div>

        {/* Info Panel */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">Nivel {currentLevel + 1}</div>
            <div className="text-sm text-gray-600">
              {selectedNode ? `Seleccionado: ${selectedNode.name}` : 'Ningún nodo seleccionado'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-3">
          {gameState === 'playing' && (
            <motion.button
              onClick={handleIdentifyLeader}
              disabled={!selectedNode}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                !selectedNode
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              whileHover={selectedNode ? { scale: 1.05 } : {}}
              whileTap={selectedNode ? { scale: 0.95 } : {}}
            >
              Identificar Líder
            </motion.button>
          )}

          {showNextLevel && (
            <motion.button
              onClick={handleNextLevel}
              className="px-6 py-3 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Siguiente Nivel
            </motion.button>
          )}

          {(showReset || gameState === 'completed') && (
            <motion.button
              onClick={handleResetGame}
              className="px-6 py-3 rounded-lg font-medium bg-gray-600 text-white hover:bg-gray-700"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Reiniciar Juego
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RedCriminalCanvas;