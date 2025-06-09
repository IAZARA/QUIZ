# Plan de Refactorización de Canvas para Dispositivos Móviles

Este documento detalla el plan para refactorizar los componentes de canvas en la aplicación, con el objetivo de mejorar su visualización y funcionalidad en dispositivos móviles, así como resolver problemas específicos de activación y visualización.

**Resumen de los problemas y requisitos:**

*   **`MachineLearningCanvas.tsx` (Canvas de Dibujos):** El celular se mueve al dibujar. Se requiere que el canvas ocupe toda la pantalla disponible en móvil y que el scroll de la página se deshabilite mientras se dibuja.
*   **`VerificadorEvidenciaCanvas.tsx`:** No se activa la visualización correctamente para la audiencia. Se requiere que el juego comience automáticamente para la audiencia cuando el administrador lo activa.
*   **`RedCriminalCanvas.tsx`:** Desaparece al hacer scroll. Se requiere que se adapte completamente al ancho de la pantalla sin scroll horizontal.
*   **Todos los Canvas:** Problemas generales de visualización y juego en móviles. Se requiere que se adapten completamente al ancho de la pantalla sin scroll horizontal.
*   **Prioridad:** Todas las prioridades son iguales.

## Plan de Refactorización:

El plan se dividirá en fases para abordar los problemas de manera estructurada:

### Fase 1: Adaptación General de Canvas para Móviles

**Objetivo:** Asegurar que todos los canvas se adapten correctamente a diferentes tamaños de pantalla y manejen los eventos táctiles de manera que no interfieran con el scroll de la página.

**Pasos:**

1.  **Implementar `event.preventDefault()` en eventos táctiles:**
    *   En todos los componentes de canvas que manejen eventos `onTouchStart`, `onTouchMove`, `onTouchEnd`, `onTouchCancel`, añadir `event.preventDefault()` para evitar el scroll de la página y el zoom involuntario. Esto es crucial para el `MachineLearningCanvas.tsx` pero beneficiará a todos los canvas interactivos.
2.  **Ajuste de tamaño del Canvas y Contenedores:**
    *   Revisar el CSS (Tailwind CSS) de los contenedores de los canvas para asegurar que utilizan unidades relativas (`%`, `vw`, `vh`) o clases de Tailwind que faciliten la responsividad (`w-full`, `h-full`, `max-w-full`, `aspect-square`).
    *   Asegurar que el canvas en sí mismo (`<canvas>`) se redimensiona dinámicamente para llenar su contenedor, manteniendo la relación de aspecto si es necesario.
    *   Considerar el uso de `useRef` para obtener las dimensiones del contenedor padre y ajustar el canvas en consecuencia.
3.  **Optimización de Elementos UI para Móviles:**
    *   Revisar la disposición de botones y texto alrededor de los canvas. Utilizar clases de Tailwind como `flex-col`, `gap-x`, `gap-y`, `text-sm`, `px-small`, `py-small` para asegurar que los elementos no se superpongan y sean fácilmente interactuables en pantallas pequeñas.
    *   Asegurar que los `font-size` y `padding` sean adecuados para la legibilidad y el tacto en dispositivos móviles.

### Fase 2: Refactorización Específica de `MachineLearningCanvas.tsx`

**Objetivo:** Resolver el problema del movimiento del celular al dibujar y asegurar que el canvas ocupe toda la pantalla disponible.

**Pasos:**

1.  **Prevención de Scroll en Eventos Táctiles:**
    *   Modificar las funciones `startDrawing` y `draw` para incluir `event.preventDefault()` en los eventos táctiles.
2.  **Ajuste Dinámico del Tamaño del Canvas a la Vista:**
    *   Asegurar que el contenedor del canvas se adapte dinámicamente al tamaño de la ventana (viewport) en móviles, posiblemente usando `w-screen` o `h-screen` o una combinación de `max-w-full` y `max-h-full` con un `aspect-ratio` fijo o dinámico.
    *   Ajustar la lógica de redimensionamiento del canvas en el `useEffect` para que el canvas siempre intente ocupar el máximo espacio disponible sin desbordarse.
3.  **Manejo de `overflow` en el Contenedor Principal:**
    *   Asegurar que el contenedor principal del componente no tenga un `overflow` que cause scroll no deseado cuando el canvas se expande.

### Fase 3: Refactorización Específica de `VerificadorEvidenciaCanvas.tsx`

**Objetivo:** Lograr que el juego comience automáticamente para la audiencia cuando el administrador lo activa.

**Pasos:**

1.  **Modificar la lógica de inicio en `CanvasInteractivosAudienceView.tsx`:**
    *   Cuando `activeCanvas` es `VerificadorEvidenciaCanvas` y `isRunning` es `true`, se debe llamar a la función `startGame` dentro de `VerificadorEvidenciaCanvas` automáticamente.
    *   Esto se puede lograr utilizando un `useEffect` dentro de `VerificadorEvidenciaCanvas` que reaccione a los cambios en `isInteractive` o `initialState` para llamar a `startGame` si las condiciones son las adecuadas para la audiencia.

### Fase 4: Refactorización Específica de `RedCriminalCanvas.tsx`

**Objetivo:** Asegurar que el canvas no desaparezca al hacer scroll y se adapte completamente al ancho de la pantalla sin scroll horizontal.

**Pasos:**

1.  **Revisar el tamaño fijo del Canvas:**
    *   Modificar la función `resizeCanvas` para que el canvas se ajuste al tamaño de su contenedor padre, utilizando `canvas.offsetWidth` y `canvas.offsetHeight` de manera más robusta, o calculando las dimensiones en función del viewport.
    *   Asegurar que el contenedor del canvas sea responsivo y permita que el canvas se expanda.
2.  **Posicionamiento de Nodos Responsivo:**
    *   Ajustar la función `getNodePositions` para que las posiciones de los nodos se escalen proporcionalmente al tamaño del canvas.
3.  **Manejo de `overflow` y `min-height`:**
    *   Asegurar que el contenedor principal del componente y sus hijos no tengan propiedades CSS que causen el recorte o la desaparición del canvas al hacer scroll.

## Diagrama de Flujo:

```mermaid
graph TD
    A[Inicio Refactorización] --> B{Análisis de Canvas y Problemas};
    B --> C[Problemas Identificados: Dibujo, Activación, Scroll, Responsividad];

    C --> D[Fase 1: Adaptación General Móvil];
    D --> D1[Implementar event.preventDefault() en eventos táctiles];
    D --> D2[Ajustar tamaño de Canvas y Contenedores con CSS responsivo];
    D --> D3[Optimizar elementos UI para móviles];

    C --> E[Fase 2: MachineLearningCanvas.tsx];
    E --> E1[Asegurar preventDefault() en startDrawing/draw];
    E --> E2[Canvas ocupa toda la pantalla en móvil];
    E --> E3[Deshabilitar scroll de página al dibujar];

    C --> F[Fase 3: VerificadorEvidenciaCanvas.tsx];
    F --> F1[Modificar CanvasInteractivosAudienceView.tsx para auto-iniciar juego];
    F --> F2[Ajustar VerificadorEvidenciaCanvas.tsx para inicio automático];

    C --> G[Fase 4: RedCriminalCanvas.tsx];
    G --> G1[Eliminar tamaño fijo del Canvas, usar responsivo];
    G --> G2[Escalar posiciones de nodos proporcionalmente];
    G --> G3[Asegurar que el canvas no desaparezca con scroll];

    D --> H[Pruebas de Responsividad];
    E --> H;
    F --> H;
    G --> H;

    H --> I{¿Problemas Resueltos?};
    I -- No --> C;
    I -- Sí --> J[Fin Refactorización];