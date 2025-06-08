import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { MongoClient, ObjectId } from 'mongodb';
import AIService from './services/aiService.js';

// Inicializar el servicio de IA unificado
let aiService;
try {
  aiService = new AIService();
  console.log('✅ AIService inicializado correctamente');
} catch (error) {
  console.error('❌ Error inicializando AIService:', error.message);
  console.error('💡 Verifica que las variables de entorno estén configuradas correctamente');
}

const router = express.Router();

// Configuración de MongoDB
let db;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz-app';

async function connectToDatabase() {
  if (!db) {
    try {
      const client = new MongoClient(mongoUri);
      await client.connect();
      db = client.db();
      console.log('Conectado a MongoDB desde ai-routes');
    } catch (error) {
      console.error('Error conectando a MongoDB:', error);
      throw error;
    }
  }
  return db;
}

// Configuración de multer para carga de archivos
const upload = multer({
  dest: 'uploads/documents/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no soportado'), false);
    }
  }
});

// Función para registrar el uso de IA para métricas
function logAIUsage(provider, success, responseTime, questionsGenerated, fallbackUsed = false, originalError = null) {
  const logEntry = {
    provider,
    success,
    responseTime,
    questionsGenerated,
    fallbackUsed,
    originalError,
    timestamp: new Date().toISOString()
  };
  
  console.log('📊 Registro de uso de IA:', JSON.stringify(logEntry, null, 2));
  
  // Aquí podrías guardar las métricas en base de datos si lo deseas
  // await db.collection('ai_usage_logs').insertOne(logEntry);
}

// Función para procesar diferentes tipos de documentos
async function processDocument(filePath, mimetype) {
  try {
    switch (mimetype) {
      case 'text/plain':
        return await fs.readFile(filePath, 'utf-8');
      
      case 'application/pdf':
        try {
          const pdfParse = (await import('pdf-parse')).default;
          const pdfBuffer = await fs.readFile(filePath);
          const pdfData = await pdfParse(pdfBuffer);
          return pdfData.text;
        } catch (error) {
          throw new Error('Error procesando PDF: ' + error.message);
        }
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        try {
          const mammoth = await import('mammoth');
          const docxBuffer = await fs.readFile(filePath);
          const docxResult = await mammoth.extractRawText({ buffer: docxBuffer });
          return docxResult.value;
        } catch (error) {
          throw new Error('Error procesando DOCX: ' + error.message);
        }
      
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        // Para PPTX necesitaremos una librería específica
        // Por ahora retornamos un mensaje indicando que se procesará en el futuro
        return 'Procesamiento de archivos PPTX estará disponible próximamente. Por favor, use TXT, PDF o DOCX.';
      
      default:
        throw new Error('Tipo de archivo no soportado');
    }
  } catch (error) {
    console.error('Error procesando documento:', error);
    throw new Error(`Error procesando documento: ${error.message}`);
  }
}

// Ruta para generar preguntas con sistema de fallback automático
router.post('/generate-questions-anthropic', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Conectar a la base de datos
    await connectToDatabase();
    
    const { source, numQuestions } = req.body;

    // Validaciones
    if (!source || !source.content) {
      return res.status(400).json({
        error: 'Fuente de contenido requerida',
        details: 'Debe proporcionar contenido para generar preguntas'
      });
    }

    if (!numQuestions || numQuestions < 1 || numQuestions > 20) {
      return res.status(400).json({
        error: 'Número de preguntas inválido',
        details: 'Debe ser entre 1 y 20 preguntas'
      });
    }

    // Verificar que el servicio de IA esté disponible
    if (!aiService) {
      return res.status(500).json({
        error: 'Servicio de IA no disponible',
        details: 'El servicio de IA no se pudo inicializar. Verifica la configuración de las API keys.'
      });
    }

    // Usar el servicio de IA unificado con fallback automático
    const result = await aiService.generateQuestions(source, numQuestions);
    
    // Registrar métricas de uso
    logAIUsage(
      result.provider,
      true,
      result.responseTime,
      result.count,
      result.fallbackUsed,
      result.originalError
    );

    // Preparar respuesta con información adicional
    const response = {
      success: true,
      questions: result.questions,
      count: result.count,
      source: source.type,
      provider: result.provider,
      fallbackUsed: result.fallbackUsed,
      responseTime: result.responseTime
    };

    // Agregar información sobre el fallback si se usó
    if (result.fallbackUsed) {
      response.message = `Preguntas generadas exitosamente usando ${result.provider} como respaldo`;
      if (result.originalError) {
        response.originalError = result.originalError;
      }
    } else {
      response.message = `Preguntas generadas exitosamente usando ${result.provider}`;
    }

    res.json(response);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('Error en generate-questions-anthropic:', error);
    
    // Registrar el fallo en las métricas
    logAIUsage('unknown', false, responseTime, 0, false, error.message);
    
    // Determinar el tipo de error para dar una respuesta más específica
    let statusCode = 500;
    let errorMessage = 'Error interno del servidor';
    
    if (error.message.includes('API key') || error.message.includes('401')) {
      statusCode = 401;
      errorMessage = 'Error de autenticación con los proveedores de IA';
    } else if (error.message.includes('rate') || error.message.includes('429')) {
      statusCode = 429;
      errorMessage = 'Límite de requests excedido en los proveedores de IA';
    } else if (error.message.includes('timeout') || error.message.includes('network')) {
      statusCode = 503;
      errorMessage = 'Error de conectividad con los proveedores de IA';
    }
    
    res.status(statusCode).json({
      error: errorMessage,
      details: error.message,
      timestamp: new Date().toISOString(),
      responseTime
    });
  }
});

// Ruta para procesar documentos
router.post('/process-document', upload.single('document'), async (req, res) => {
  try {
    // Conectar a la base de datos
    await connectToDatabase();
    
    if (!req.file) {
      return res.status(400).json({
        error: 'No se proporcionó archivo',
        details: 'Debe cargar un archivo para procesar'
      });
    }

    const { path: filePath, mimetype, originalname } = req.file;

    // Procesar el documento según su tipo
    const content = await processDocument(filePath, mimetype);

    // Limpiar el archivo temporal
    try {
      await fs.unlink(filePath);
    } catch (unlinkError) {
      console.warn('No se pudo eliminar archivo temporal:', unlinkError);
    }

    // Validar que el contenido no esté vacío
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Documento vacío',
        details: 'El documento no contiene texto procesable'
      });
    }

    // Limitar el tamaño del contenido para evitar prompts muy largos
    const maxContentLength = 50000; // ~50k caracteres
    const processedContent = content.length > maxContentLength 
      ? content.substring(0, maxContentLength) + '\n\n[Contenido truncado...]'
      : content;

    res.json({
      success: true,
      content: processedContent,
      originalName: originalname,
      type: mimetype,
      size: content.length
    });

  } catch (error) {
    console.error('Error procesando documento:', error);
    
    // Limpiar archivo temporal en caso de error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.warn('No se pudo eliminar archivo temporal tras error:', unlinkError);
      }
    }

    res.status(500).json({ 
      error: 'Error procesando documento',
      details: error.message 
    });
  }
});

// Ruta de prueba para verificar configuración del sistema de IA
router.get('/test', async (req, res) => {
  try {
    const testResult = {
      message: 'Sistema de IA con fallback funcionando correctamente',
      timestamp: new Date().toISOString(),
      aiService: {
        initialized: !!aiService,
        anthropic: {
          configured: !!process.env.ANTHROPIC_API_KEY,
          keyFormat: process.env.ANTHROPIC_API_KEY ?
            `${process.env.ANTHROPIC_API_KEY.substring(0, 15)}...` : 'No configurada'
        },
        deepseek: {
          configured: !!process.env.DEEPSEEK_API_KEY,
          model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
          keyFormat: process.env.DEEPSEEK_API_KEY ?
            `${process.env.DEEPSEEK_API_KEY.substring(0, 15)}...` : 'No configurada'
        }
      },
      database: {
        connected: !!db
      }
    };
    
    res.json(testResult);
  } catch (error) {
    console.error('Error en ruta de prueba:', error);
    res.status(500).json({
      error: 'Error verificando configuración',
      details: error.message
    });
  }
});

// Ruta de diagnóstico completa para debugging
router.get('/debug', async (req, res) => {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        workingDirectory: process.cwd(),
        processId: process.pid
      },
      aiService: {
        initialized: !!aiService,
        status: aiService ? 'Operativo' : 'No inicializado'
      },
      anthropic: {
        apiKeyConfigured: !!process.env.ANTHROPIC_API_KEY,
        apiKeyLength: process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.length : 0,
        apiKeyFormat: process.env.ANTHROPIC_API_KEY ?
          `${process.env.ANTHROPIC_API_KEY.substring(0, 15)}...` : 'No configurada'
      },
      deepseek: {
        apiKeyConfigured: !!process.env.DEEPSEEK_API_KEY,
        apiKeyLength: process.env.DEEPSEEK_API_KEY ? process.env.DEEPSEEK_API_KEY.length : 0,
        apiKeyFormat: process.env.DEEPSEEK_API_KEY ?
          `${process.env.DEEPSEEK_API_KEY.substring(0, 15)}...` : 'No configurada',
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
        maxTokens: process.env.DEEPSEEK_MAX_TOKENS || 4000,
        temperature: process.env.DEEPSEEK_TEMPERATURE || 0.7
      },
      database: {
        connected: !!db,
        mongoUri: process.env.MONGODB_URI ? 'Configurada' : 'No configurada'
      },
      server: {
        port: process.env.PORT || 3000,
        uptime: process.uptime()
      }
    };
    
    console.log('🔍 Diagnóstico completo solicitado:', diagnostics);
    res.json(diagnostics);
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    res.status(500).json({
      error: 'Error en diagnóstico',
      details: error.message
    });
  }
});

// Ruta para probar conectividad con proveedores de IA
router.post('/test-providers', async (req, res) => {
  try {
    console.log('🧪 Probando conectividad con proveedores de IA...');
    
    if (!aiService) {
      return res.status(500).json({
        success: false,
        error: 'AIService no inicializado',
        timestamp: new Date().toISOString()
      });
    }

    const results = {};
    
    // Probar Anthropic si está configurado
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const anthropicResult = await aiService.testProvider('anthropic');
        results.anthropic = anthropicResult;
      } catch (error) {
        results.anthropic = { success: false, error: error.message };
      }
    } else {
      results.anthropic = { success: false, error: 'No configurado' };
    }
    
    // Probar DeepSeek si está configurado
    if (process.env.DEEPSEEK_API_KEY) {
      try {
        const deepseekResult = await aiService.testProvider('deepseek');
        results.deepseek = deepseekResult;
      } catch (error) {
        results.deepseek = { success: false, error: error.message };
      }
    } else {
      results.deepseek = { success: false, error: 'No configurado' };
    }
    
    const overallSuccess = Object.values(results).some(result => result.success);
    
    res.json({
      success: overallSuccess,
      message: overallSuccess ? 'Al menos un proveedor está funcionando' : 'Ningún proveedor está funcionando',
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error probando proveedores de IA:', error);
    res.status(500).json({
      success: false,
      error: 'Error probando proveedores de IA',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;