# Plan para Personalizar el Logo de la Audiencia

Este plan detalla los pasos necesarios para permitir que el administrador personalice el logo que se muestra a la audiencia desde la vista de configuración.

## 1. Análisis Inicial

- Se identificó que el componente `AudienceHeader.tsx` es el encargado de mostrar el encabezado a la audiencia, pero actualmente no incluye un logo.
- Se determinó que el componente `QuizConfigPanel.tsx` es el panel de configuración del administrador y es el lugar adecuado para añadir la opción de personalización del logo.
- Se observó la existencia del directorio `server/uploads/`, lo que sugiere que la aplicación ya tiene alguna capacidad de manejo de archivos subidos.

## 2. Pasos a Seguir

### 2.1. Actualización de Tipos y Estado Global

- Modificar la interfaz `QuizConfig` en `src/types.ts` para incluir un campo que almacene la ruta o URL del logo (ej: `logoUrl?: string;`).
- Actualizar el store de configuración (`src/store/quizConfigStore.ts`) para:
    - Incluir el nuevo campo `logoUrl` en el estado.
    - Modificar las acciones `saveConfig` y `getConfig` para manejar este nuevo campo, interactuando con el backend.

### 2.2. Modificación del Panel de Configuración (Frontend - Admin)

- Editar `src/components/QuizConfigPanel.tsx` para añadir:
    - Un campo de entrada de tipo `file` para que el administrador seleccione el archivo de imagen del logo.
    - Lógica en el estado del componente para manejar el archivo seleccionado.
    - Una función para previsualizar la imagen seleccionada antes de subirla.
    - Modificar la función `handleSubmit` para incluir la lógica de subida del archivo del logo al backend cuando se guarda la configuración. Esto probablemente requerirá usar `FormData` para enviar el archivo.
    - Mostrar la URL del logo actualmente configurado (si existe) y una opción para eliminarlo.

### 2.3. Implementación en el Backend

- Modificar `server/index.js` o crear un nuevo archivo de rutas (ej: `server/config-routes.js`) para manejar las operaciones relacionadas con la configuración, incluyendo la subida del logo.
- Implementar un endpoint API (ej: `POST /api/config/upload-logo`) que:
    - Reciba el archivo de imagen subido.
    - Valide el tipo de archivo y tamaño.
    - Guarde el archivo en el directorio `server/uploads/` con un nombre único y seguro.
    - Actualice la configuración del quiz en la base de datos (probablemente usando `src/lib/mongodb.ts` o `src/lib/supabase.ts` dependiendo de cuál se use para la configuración) con la ruta o URL del archivo guardado.
    - Devuelva la URL del logo guardado al frontend.
- Asegurar que el backend pueda servir archivos estáticos desde el directorio `server/uploads/` para que el logo sea accesible públicamente.

### 2.4. Visualización del Logo (Frontend - Audiencia)

- Editar `src/components/audience/AudienceHeader.tsx` para:
    - Obtener la configuración del quiz, incluyendo la `logoUrl`, probablemente usando el mismo `useQuizConfigStore` o una versión de solo lectura para la audiencia.
    - Añadir un elemento `<img>` en el encabezado.
    - Establecer el atributo `src` del `<img>` a la `logoUrl` obtenida de la configuración.
    - Añadir estilos CSS para posicionar y dimensionar el logo adecuadamente en el encabezado.
    - Considerar un logo por defecto si no se ha configurado uno personalizado.

## 3. Pruebas

- Probar la subida de diferentes tipos y tamaños de imágenes en el panel de administración.
- Verificar que el logo se muestra correctamente en la vista de audiencia después de ser configurado.
- Probar la opción de eliminar el logo.
- Asegurar que la configuración del logo persiste después de recargar la aplicación.
- Verificar que la aplicación maneja correctamente los casos donde no hay logo configurado.

## 4. Consideraciones Adicionales

- Implementar validaciones de seguridad en el backend para la subida de archivos (tipos permitidos, tamaño máximo).
- Considerar la limpieza de archivos de logo antiguos o no utilizados en el servidor.
- Asegurar una buena experiencia de usuario durante la subida del archivo (indicadores de carga, mensajes de error).