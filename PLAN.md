**PLAN.md: Mejoras en la Vista de Audiencia y Nueva Funcionalidad de Recopilación de Datos**

**Objetivo General:** Mejorar la interfaz de usuario de la vista de audiencia para hacerla más atractiva, entretenida y funcional, e implementar una nueva funcionalidad para que la audiencia envíe datos a través de un formulario y el presentador pueda visualizar y exportar estos datos.

**Análisis Inicial:**
Hemos identificado los siguientes componentes clave en la vista de audiencia:
*   [`src/components/audience/AudienceHeader.tsx`](src/components/audience/AudienceHeader.tsx): Encabezado de la vista.
*   [`src/components/audience/WaitingScreen.tsx`](src/components/audience/WaitingScreen.tsx): Pantalla mostrada mientras se espera.
*   [`src/components/audience/QuestionInterface.tsx`](src/components/audience/QuestionInterface.tsx): Interfaz principal para responder preguntas.
*   [`src/components/audience/QuestionTimer.tsx`](src/components/audience/QuestionTimer.tsx): Temporizador de preguntas.
*   [`src/components/audience/QuestionOption.tsx`](src/components/audience/QuestionOption.tsx): Componente para cada opción de respuesta.
*   [`src/components/audience/QuestionExplanation.tsx`](src/components/audience/QuestionExplanation.tsx): Muestra la explicación de la respuesta correcta.
*   [`src/components/audience/RankingModal.tsx`](src/components/audience/RankingModal.tsx): Modal para mostrar el ranking.
*   [`src/components/DocumentDownloadList.tsx`](src/components/DocumentDownloadList.tsx): Lista de documentos para descargar.
*   [`src/components/wordcloud/WordCloudParticipant.tsx`](src/components/wordcloud/WordCloudParticipant.tsx): Vista de la nube de palabras para el participante.

**Propuestas de Mejora y Nuevas Funcionalidades:**

1.  **Imagen para Enviar Preguntas/Pantalla de Espera:**
    *   **Descripción:** Añadir una imagen o ilustración atractiva en la pantalla de espera (`WaitingScreen.tsx`) o en la interfaz de preguntas (`QuestionInterface.tsx`) cuando no haya una pregunta activa. Esto hará que la interfaz sea más amigable y visualmente interesante durante los periodos de inactividad o espera.
    *   **Implementación:** Integrar un elemento `<img>` o un componente de imagen con una ilustración adecuada en el componente `WaitingScreen.tsx`.

2.  **Mejoras en la Nube de Palabras:**
    *   **Descripción:** Mejorar la presentación visual de la nube de palabras en `WordCloudParticipant.tsx`. Esto puede incluir ajustes en el tamaño de las fuentes según la frecuencia de las palabras, diferentes colores dentro de la paleta azul, y animaciones más fluidas para la aparición y actualización de las palabras.
    *   **Implementación:** Modificar el renderizado de las palabras en `WordCloudParticipant.tsx`, posiblemente utilizando una biblioteca de visualización de nubes de palabras o implementando lógica de estilo y animación personalizada.

3.  **Iconos de Documentos por Tipo:**
    *   **Descripción:** En la lista de documentos (`DocumentDownloadList.tsx`), reemplazar el icono genérico actual (`FileText`) por iconos que representen el tipo de archivo (por ejemplo, un icono para PDF, otro para DOC/DOCX, otro para imágenes, etc.).
    *   **Implementación:** Añadir lógica en `DocumentDownloadList.tsx` para determinar la extensión del archivo (`doc.originalName`) y seleccionar el icono apropiado de una biblioteca (como `lucide-react` u otra) para mostrar junto al nombre del archivo.

4.  **Tema de Color Azul:**
    *   **Descripción:** Aplicar una paleta de colores azules consistente en todos los componentes de la vista de audiencia para crear una interfaz visualmente unificada y agradable, según lo solicitado.
    *   **Implementación:** Definir una paleta de colores azules en el archivo de configuración de Tailwind CSS (`tailwind.config.js`). Luego, aplicar estas clases de color a los fondos, textos, bordes, botones y otros elementos visuales en los componentes de la audiencia (`src/components/audience/` y `src/components/wordcloud/`), así como posiblemente en el CSS global (`src/index.css`).

5.  **Interfaz de Usuario General:**
    *   **Descripción:** Asegurar que todas las mejoras contribuyan a una experiencia de usuario entretenida y visualmente atractiva, manteniendo la coherencia en el diseño, la tipografía y el espaciado.

6.  **Formulario de Recopilación de Datos para la Audiencia:**
    *   **Descripción:** Crear un nuevo módulo/componente en la vista de audiencia que permita a los participantes enviar datos estructurados (ej: nombre, email, comentarios).
    *   **Implementación:**
        *   Definir la estructura de datos del formulario (campos, tipos de datos).
        *   Crear un componente React (`AudienceDataForm.tsx`) con los campos del formulario y validación básica.
        *   Integrar este componente en la vista principal de la audiencia (`AudienceView.tsx`), controlando su visibilidad (ej: activado por el presentador).
        *   Implementar la lógica para enviar los datos del formulario al backend.

7.  **Backend para Recopilación de Datos:**
    *   **Descripción:** Crear endpoints en el servidor para recibir, almacenar y servir los datos enviados por la audiencia.
    *   **Implementación:**
        *   Definir un modelo de datos para almacenar la información (ej: en MongoDB, usando Mongoose).
        *   Crear una nueva ruta API (ej: `/api/audience-data`) para recibir las submisiones del formulario (método POST).
        *   Implementar la lógica para guardar los datos recibidos en la base de datos.
        *   Crear una ruta API (ej: `/api/audience-data`) para que el presentador pueda obtener todos los datos recopilados (método GET).

8.  **Vista de Presentador: Tabla de Datos y Exportación:**
    *   **Descripción:** Añadir una nueva pestaña o sección en el panel de administración para que el presentador pueda ver los datos recopilados en una tabla y exportarlos.
    *   **Implementación:**
        *   Crear un nuevo componente React (`AudienceDataTable.tsx`) para mostrar los datos en formato de tabla. Utilizar una biblioteca de tablas si es necesario (ej: `react-table`).
        *   Implementar la lógica para obtener los datos del backend (`/api/audience-data` GET).
        *   Añadir una nueva pestaña en el panel de administración (`AdminDashboard.tsx`) que renderice el componente `AudienceDataTable.tsx`.
        *   Implementar la funcionalidad de exportación a Excel/CSV en el componente `AudienceDataTable.tsx`. Esto puede implicar formatear los datos y usar una biblioteca para generar el archivo (ej: `xlsx` o `file-saver`).

**Pasos de Implementación Detallados para el Equipo:**

1.  **Configuración Inicial y Tema Azul:**
    *   Modificar [`tailwind.config.js`](tailwind.config.js) para definir la paleta de colores azules.
    *   Actualizar las clases de CSS en los componentes de la audiencia (`src/components/audience/*.tsx`) y nube de palabras (`src/components/wordcloud/WordCloudParticipant.tsx`) para usar la nueva paleta de colores.
    *   Añadir una imagen a [`src/components/audience/WaitingScreen.tsx`](src/components/audience/WaitingScreen.tsx).
    *   Refactorizar el renderizado de la nube de palabras en [`src/components/wordcloud/WordCloudParticipant.tsx`](src/components/wordcloud/WordCloudParticipant.tsx) para mejorar la visualización y animación.
    *   Añadir lógica en [`src/components/DocumentDownloadList.tsx`](src/components/DocumentDownloadList.tsx) para mostrar iconos basados en la extensión del archivo.
    *   Revisar y ajustar estilos en todos los componentes de la audiencia para asegurar la coherencia y una buena experiencia de usuario.

2.  **Desarrollo del Formulario de Audiencia:**
    *   Crear el archivo [`src/components/audience/AudienceDataForm.tsx`](src/components/audience/AudienceDataForm.tsx).
    *   Implementar la estructura del formulario con campos de entrada (input, textarea, etc.) según los datos requeridos.
    *   Añadir validación básica del lado del cliente.
    *   Integrar el formulario en [`src/pages/AudienceView.tsx`](src/pages/AudienceView.tsx), controlando su visibilidad mediante estado o props.
    *   Implementar la función `handleSubmit` en `AudienceDataForm.tsx` para enviar los datos al backend.

3.  **Desarrollo del Backend para Datos de Audiencia:**
    *   Crear un nuevo archivo de modelo de Mongoose (ej: `server/models/AudienceData.js`) con el esquema de datos.
    *   Crear un nuevo archivo de rutas (ej: `server/audience-data-routes.js`).
    *   En `server/audience-data-routes.js`, definir la ruta POST (`/api/audience-data`) para recibir y guardar los datos del formulario.
    *   En `server/audience-data-routes.js`, definir la ruta GET (`/api/audience-data`) para obtener todos los datos.
    *   Integrar las nuevas rutas en el archivo principal del servidor (`server/index.js`).

4.  **Desarrollo de la Vista de Presentador (Tabla y Exportación):**
    *   Crear el archivo [`src/components/admin/AudienceDataTable.tsx`](src/components/admin/AudienceDataTable.tsx).
    *   En `AudienceDataTable.tsx`, implementar la lógica para obtener los datos de `/api/audience-data` al cargar el componente.
    *   Renderizar los datos obtenidos en una tabla HTML o utilizando un componente de tabla de una biblioteca. Definir las columnas de la tabla según la estructura de datos.
    *   Añadir un botón en `AudienceDataTable.tsx` para iniciar la exportación.
    *   Implementar la función de exportación en `AudienceDataTable.tsx`, formateando los datos y generando un archivo (CSV o Excel).
    *   Añadir una nueva pestaña en [`src/pages/AdminDashboard.tsx`](src/pages/AdminDashboard.tsx) que cargue el componente `AudienceDataTable.tsx`.

5.  **Integración y Pruebas:**
    *   Asegurar que el formulario en la vista de audiencia se comunica correctamente con el nuevo endpoint POST del backend.
    *   Verificar que la tabla en la vista del presentador carga los datos correctamente del endpoint GET del backend.
    *   Probar la funcionalidad de exportación de datos.
    *   Realizar pruebas de interfaz de usuario en la vista de audiencia para confirmar que el tema azul se aplica correctamente y las mejoras visuales funcionan como se espera.

**Diagrama de Componentes y Flujo de Datos (Actualizado):**

```mermaid
graph TD
    A[Vista de Audiencia] --> B(AudienceHeader);
    A --> C(WaitingScreen);
    A --> D(QuestionInterface);
    D --> D1(QuestionTimer);
    D --> D2(QuestionOption);
    D --> D3(QuestionExplanation);
    A --> E(RankingModal);
    A --> F(DocumentDownloadList);
    A --> G(WordCloudParticipant);
    A --> H(AudienceDataForm);

    subgraph Mejoras Visuales Audiencia
        C -- Añadir Imagen --> C;
        G -- Mejoras Visuales --> G;
        F -- Iconos por Tipo --> F;
        A -- Aplicar Tema Azul --> A;
    end

    subgraph Recopilación de Datos
        H -- Envío de Datos --> I(Backend API);
        I -- Guardar Datos --> J(Base de Datos);
        K[Vista de Presentador] --> L(AudienceDataTable);
        L -- Obtener Datos --> I;
        L -- Exportar Datos --> M(Archivo Excel/CSV);
    end

    I -- Rutas POST/GET --> J;