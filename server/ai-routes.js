import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

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

// Función para llamar a la API de Anthropic
async function callAnthropicAPI(prompt) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY no está configurada en las variables de entorno');
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error de Anthropic API: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Error llamando a Anthropic API:', error);
    throw error;
  }
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

// Función para crear el prompt para Anthropic
function createQuestionPrompt(source, numQuestions) {
  const basePrompt = `
Eres un experto en educación y creación de contenido académico. Tu tarea es generar preguntas de opción múltiple de alta calidad basadas en el contenido proporcionado.

INSTRUCCIONES ESPECÍFICAS:
1. Genera exactamente ${numQuestions} preguntas
2. Cada pregunta debe tener exactamente 3 opciones (A, B, C)
3. Solo una opción debe ser correcta
4. Incluye una explicación clara de por qué la respuesta correcta es la adecuada
5. Las preguntas deben ser claras, precisas y educativas
6. Evita preguntas ambiguas o con múltiples interpretaciones
7. Varía el nivel de dificultad (básico, intermedio, avanzado)

FORMATO DE RESPUESTA REQUERIDO (JSON):
{
  "questions": [
    {
      "content": "Texto de la pregunta aquí",
      "option_a": "Primera opción",
      "option_b": "Segunda opción", 
      "option_c": "Tercera opción",
      "correct_option": "A", // Solo A, B o C
      "explanation": "Explicación detallada de por qué esta respuesta es correcta"
    }
  ]
}

CONTENIDO BASE PARA LAS PREGUNTAS:
${source.type === 'document' ? `Documento: ${source.documentName || 'Documento cargado'}` : 'Tema proporcionado'}

${source.content}

Genera las preguntas en formato JSON válido, asegurándote de que cada pregunta sea educativa y bien fundamentada en el contenido proporcionado.`;

  return basePrompt;
}

// Ruta para generar preguntas con Anthropic
router.post('/generate-questions-anthropic', async (req, res) => {
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

    // Crear el prompt
    const prompt = createQuestionPrompt(source, numQuestions);

    // Llamar a Anthropic API
    const response = await callAnthropicAPI(prompt);

    // Parsear la respuesta JSON
    let parsedResponse;
    try {
      // Limpiar la respuesta si tiene texto adicional
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : response;
      parsedResponse = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Error parseando respuesta de IA:', parseError);
      console.log('Respuesta original:', response);
      
      return res.status(500).json({ 
        error: 'Error procesando respuesta de IA',
        details: 'La IA no devolvió un formato JSON válido'
      });
    }

    // Validar estructura de respuesta
    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      return res.status(500).json({ 
        error: 'Formato de respuesta inválido',
        details: 'La IA no devolvió preguntas en el formato esperado'
      });
    }

    // Validar cada pregunta
    const validQuestions = parsedResponse.questions.filter(q => {
      return q.content && q.option_a && q.option_b && q.option_c && 
             q.correct_option && ['A', 'B', 'C'].includes(q.correct_option) &&
             q.explanation;
    });

    if (validQuestions.length === 0) {
      return res.status(500).json({ 
        error: 'No se generaron preguntas válidas',
        details: 'Las preguntas generadas no cumplen con el formato requerido'
      });
    }

    res.json({
      success: true,
      questions: validQuestions,
      count: validQuestions.length,
      source: source.type
    });

  } catch (error) {
    console.error('Error en generate-questions-anthropic:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
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

// Ruta de prueba para verificar configuración
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Rutas de IA funcionando correctamente',
    anthropicConfigured: !!process.env.ANTHROPIC_API_KEY,
    timestamp: new Date().toISOString()
  });
});

export default router;