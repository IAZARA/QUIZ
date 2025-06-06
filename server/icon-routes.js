import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads', 'icons');
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `icon-${uniqueSuffix}${extension}`);
  }
});

// Filtro para validar tipos de archivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no válido. Solo se permiten PNG, JPG y SVG.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB máximo
  }
});

// Endpoint para subir iconos
router.post('/upload', upload.single('icon'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No se ha proporcionado ningún archivo' 
      });
    }

    // Construir la URL del archivo
    const fileUrl = `/uploads/icons/${req.file.filename}`;

    res.json({
      success: true,
      path: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });

  } catch (error) {
    console.error('Error al subir icono:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al subir el archivo' 
    });
  }
});

// Endpoint para eliminar iconos personalizados
router.delete('/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', 'icons', filename);

    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'Archivo no encontrado' 
      });
    }

    // Eliminar el archivo
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'Archivo eliminado correctamente'
    });

  } catch (error) {
    console.error('Error al eliminar icono:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al eliminar el archivo' 
    });
  }
});

// Middleware de manejo de errores para multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'El archivo es demasiado grande. Máximo 2MB.' 
      });
    }
  }
  
  if (error.message) {
    return res.status(400).json({ 
      error: error.message 
    });
  }

  res.status(500).json({ 
    error: 'Error desconocido al procesar el archivo' 
  });
});

export default router;