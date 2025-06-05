# Módulo de Generación de Preguntas con IA

## Descripción

Este módulo permite generar preguntas automáticamente usando inteligencia artificial (Anthropic Claude) a partir de texto libre o documentos cargados. Las preguntas generadas requieren aprobación manual antes de ser agregadas al banco de preguntas.

## Características Principales

### 1. Generación desde Texto
- Permite ingresar un tema o contexto manualmente
- Genera preguntas de opción múltiple (3 opciones: A, B, C)
- Incluye explicaciones para cada respuesta correcta

### 2. Generación desde Documentos
- Soporta archivos: `.txt`, `.pdf`, `.docx`, `.pptx`
- Procesa el contenido del documento automáticamente
- Genera preguntas basadas en el contenido del documento

### 3. Sistema de Aprobación
- Vista previa de todas las preguntas generadas
- Botones de aprobar (✓) y rechazar (🗑️) para cada pregunta
- Solo las preguntas aprobadas se agregan al banco de preguntas

## Configuración

### 1. Variables de Entorno

Agregar al archivo `.env`:

```bash
ANTHROPIC_API_KEY=tu_clave_api_de_anthropic_aqui
```

### 2. Obtener Clave API de Anthropic

1. Visita [https://console.anthropic.com/](https://console.anthropic.com/)
2. Crea una cuenta o inicia sesión
3. Ve a "API Keys" en el panel de control
4. Genera una nueva clave API
5. Copia la clave y agrégala al archivo `.env`

### 3. Dependencias

Las siguientes dependencias se instalaron automáticamente:

```bash
npm install pdf-parse mammoth --legacy-peer-deps
```

- `pdf-parse`: Para procesar archivos PDF
- `mammoth`: Para procesar archivos DOCX

## Uso

### Acceso al Módulo

1. Inicia sesión en el panel de administración
2. En el dashboard principal, busca la sección "Gestión de Contenido"
3. Haz clic en "Generador de Preguntas IA" (ícono de robot morado)

### Generar Preguntas desde Texto

1. Selecciona la pestaña "Desde Texto"
2. Ingresa el tema o contexto en el área de texto
3. Selecciona el número de preguntas a generar (1-20)
4. Haz clic en "Generar Preguntas"

### Generar Preguntas desde Documento

1. Selecciona la pestaña "Desde Documento"
2. Arrastra y suelta un archivo o haz clic para seleccionar
3. Espera a que el documento se procese
4. Selecciona el número de preguntas a generar
5. Haz clic en "Generar Preguntas del Documento"

### Aprobar/Rechazar Preguntas

1. Después de la generación, revisa cada pregunta en la vista previa
2. Para cada pregunta puedes:
   - **Aprobar**: Haz clic en el botón verde con ✓ para agregar al banco
   - **Rechazar**: Haz clic en el botón rojo con 🗑️ para descartar

## Estructura de Archivos

```
server/
├── ai-routes.js          # Rutas de la API para IA
└── index.js              # Servidor principal (modificado)

src/components/admin/
├── AIQuestionModule.tsx  # Componente principal del módulo
├── DashboardHome.tsx     # Dashboard (modificado)
└── QuestionsList.tsx     # Lista de preguntas (modificado)

uploads/documents/        # Directorio para documentos temporales
```

## API Endpoints

### POST `/api/ai/generate-questions-anthropic`

Genera preguntas usando Anthropic Claude.

**Body:**
```json
{
  "source": {
    "type": "text" | "document",
    "content": "contenido del texto o documento",
    "documentName": "nombre del archivo (opcional)"
  },
  "numQuestions": 5
}
```

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "content": "¿Cuál es...?",
      "option_a": "Opción A",
      "option_b": "Opción B", 
      "option_c": "Opción C",
      "correct_option": "A",
      "explanation": "Explicación..."
    }
  ],
  "count": 5,
  "source": "text"
}
```

### POST `/api/ai/process-document`

Procesa un documento cargado.

**Form Data:**
- `document`: Archivo a procesar

**Response:**
```json
{
  "success": true,
  "content": "contenido extraído del documento",
  "originalName": "documento.pdf",
  "type": "application/pdf",
  "size": 12345
}
```

### GET `/api/ai/test`

Verifica el estado del módulo de IA.

**Response:**
```json
{
  "message": "Rutas de IA funcionando correctamente",
  "anthropicConfigured": true,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## Cambios Realizados

### Componentes Modificados

1. **QuestionsList.tsx**: Removido el botón "AI GENERATE QUESTIONS"
2. **DashboardHome.tsx**: Agregado el nuevo módulo de IA
3. **AdminDashboard.tsx**: Integrado el nuevo módulo en el sistema de navegación

### Nuevos Componentes

1. **AIQuestionModule.tsx**: Componente principal del módulo de IA

### Backend

1. **ai-routes.js**: Nuevas rutas para la funcionalidad de IA
2. **index.js**: Integración de las rutas de IA

## Limitaciones

1. **Archivos PPTX**: Actualmente no soportados completamente (mensaje informativo)
2. **Tamaño de archivos**: Máximo 10MB por documento
3. **Contenido**: Máximo 50,000 caracteres procesados por documento
4. **Rate limits**: Sujeto a los límites de la API de Anthropic

## Solución de Problemas

### Error: "ANTHROPIC_API_KEY no está configurada"
- Verifica que la clave API esté en el archivo `.env`
- Reinicia el servidor después de agregar la clave

### Error al procesar documentos PDF
- Verifica que el archivo no esté corrupto
- Asegúrate de que el archivo sea un PDF válido

### Error al procesar documentos DOCX
- Verifica que el archivo sea un documento Word válido
- Algunos documentos con formato complejo pueden fallar

### Preguntas no se generan
- Verifica la conexión a internet
- Revisa los logs del servidor para errores de la API
- Verifica que tengas créditos disponibles en tu cuenta de Anthropic

## Soporte

Para problemas o mejoras, revisa los logs del servidor y verifica:

1. Configuración de variables de entorno
2. Estado de la API de Anthropic
3. Formato y tamaño de los documentos
4. Conexión a la base de datos MongoDB