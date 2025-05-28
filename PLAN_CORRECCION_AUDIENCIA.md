# Plan de Corrección - Vista de Audiencia

## Problemas Identificados

1. **Nube de Palabras**: Cuando se activa desde el panel de administración, la vista de audiencia no muestra el campo para introducir palabras.
2. **Q&A de Audiencia**: Cuando se activa, no aparece la interfaz para que los participantes hagan preguntas.
3. **Sincronización de Estado**: Los estados de las funciones especiales no se estaban sincronizando correctamente entre el servidor y el cliente.

## Soluciones Implementadas

### 1. Corrección del Store de Nube de Palabras
- **Archivo**: `src/store/wordCloudStore.ts`
- **Cambio**: Actualizado el método `fetchWords` para obtener también el estado `isActive` del servidor.
```typescript
const data = await response.json();
set({ 
  words: data.words || [],
  isActive: data.isActive || false
});
```

### 2. Corrección del Store de Q&A de Audiencia
- **Archivo**: `src/store/audienceQAStore.ts`
- **Cambio**: Actualizado el método `fetchQuestions` para obtener el estado `isActive` del servidor.
```typescript
const data = await response.json();
set({ 
  questions: data.questions || data,
  isAudienceQAActive: data.isActive !== undefined ? data.isActive : get().isAudienceQAActive,
  isLoading: false 
});
```

### 3. Actualización del Servidor
- **Archivo**: `server/index.js`
- **Cambios**:
  - Agregada variable global `audienceQAActive` para mantener el estado.
  - Modificada la ruta GET `/api/audience-questions` para devolver tanto las preguntas como el estado.
  - Actualizadas las rutas de activación/desactivación para modificar la variable global.

### 4. Reorganización de la Vista de Audiencia
- **Archivo**: `src/pages/AudienceView.tsx`
- **Cambio**: Reorganizada la lógica de renderizado para verificar primero las funciones especiales activas antes de verificar si hay una pregunta activa.
- **Orden de prioridad**:
  1. Torneo activo
  2. Nube de palabras activa
  3. Contactos activos
  4. Q&A de audiencia activo
  5. Documentos compartidos activos
  6. Pregunta de quiz activa
  7. Pantalla de espera (si no hay nada activo)

### 5. Traducciones Agregadas
- **Archivo**: `public/locales/es/translation.json`
- **Nuevas traducciones**:
  - `"audienceQA": "Preguntas y Respuestas"`
  - `"sharedDocuments": "Documentos Compartidos"`

## Flujo de Funcionamiento

1. **Activación desde el Panel de Admin**:
   - El administrador activa una función (ej: Nube de Palabras)
   - El servidor emite un evento Socket.IO con el nuevo estado
   - La vista de audiencia recibe el evento y actualiza su estado local

2. **Vista de Audiencia**:
   - Al cargar, obtiene el estado inicial de todas las funciones
   - Escucha eventos Socket.IO para cambios en tiempo real
   - Renderiza la interfaz correspondiente según la función activa

3. **Prioridad de Renderizado**:
   - Las funciones especiales tienen prioridad sobre el quiz
   - Solo se muestra una función a la vez
   - Si no hay nada activo, se muestra la pantalla de espera

## Pruebas Recomendadas

1. Activar la Nube de Palabras desde el panel de admin y verificar que aparezca el campo de entrada en la vista de audiencia.
2. Activar Q&A de Audiencia y verificar que aparezca el formulario para enviar preguntas.
3. Cambiar entre diferentes funciones y verificar que la vista se actualice correctamente.
4. Verificar que al desactivar una función, la vista vuelva a la pantalla de espera.
5. Probar con múltiples participantes para verificar la sincronización en tiempo real.