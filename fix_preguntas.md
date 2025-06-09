# Plan de Solución: Módulo de Preguntas y Respuestas

Este documento detalla el análisis y el plan de acción para solucionar los problemas identificados en el módulo de preguntas y respuestas de la aplicación.

## Problemas Identificados

1.  **Opción Correcta Incorrecta:** Aunque la opción correcta se configura y guarda al crear/editar la pregunta, al mostrar los resultados, la aplicación indica una opción incorrecta o una opción por defecto ('a').
2.  **Resultados No Mostrados a la Audiencia:** Al finalizar el contador, el presentador ve "Resultados mostrados", pero la audiencia sigue viendo "Esperando que el presentador muestre los resultados", sin visualizar los resultados reales (correcto/incorrecto/no respondió).

## Análisis de la Causa Raíz

### 1. Problema de la Opción Correcta Incorrecta

*   **Backend (`src/api/questions.ts`):** La función `startVoting` sobrescribe la `correct_option` a `null` cuando se inicia la votación. Esto elimina la opción correcta previamente configurada.
    *   `src/api/questions.ts:95`: `correct_option: null,`
*   **Frontend (`src/components/admin/VotingDashboard.tsx`):** La función `handleShowResults` utiliza un valor por defecto ('a') si `question.correct_option` es `null` o `undefined`. Esto agrava el problema al mostrar una opción incorrecta si el backend ya ha borrado la correcta.
    *   `src/components/admin/VotingDashboard.tsx:94`: `const correctOption = question.correct_option || 'a';`
*   **Frontend (`src/store/questionStore.ts`):** Las funciones `stopVoting` y `showResults` en el store están enviando `correctOption` al backend como parámetro. Esto es inconsistente con el flujo de que la opción correcta se define al crear/editar la pregunta y debería persistir.

### 2. Problema de Visualización de Resultados en la Audiencia

*   La lógica en `src/store/questionStore.ts` para los eventos de socket `show_question_results` y `show_results` parece actualizar `currentQuestion` correctamente en el store del presentador.
*   La causa probable es una falla en cómo el componente de la audiencia (`src/components/audience/QuestionInterface.tsx`) reacciona a estos cambios de estado o cómo el `audienceQAStore.ts` maneja la recepción de estos eventos.

## Plan de Solución Detallado

### Fase 1: Corrección de la Lógica de la Opción Correcta

1.  **Modificar `src/api/questions.ts`:**
    *   **Acción:** Eliminar la línea `correct_option: null` de la función `startVoting`.
    *   **Justificación:** La `correct_option` debe persistir desde la creación/edición de la pregunta y no debe ser borrada al iniciar la votación.
    *   **Acción:** Modificar las funciones `stopVoting` y `showResults` para que no requieran `correctOption` como parámetro. En su lugar, estas funciones deben recuperar la `correct_option` de la base de datos asociada a la pregunta.
    *   **Justificación:** La opción correcta ya está almacenada con la pregunta; no es necesario pasarla nuevamente desde el frontend en estas acciones.

2.  **Modificar `src/components/admin/VotingDashboard.tsx`:**
    *   **Acción:** En la función `handleShowResults`, eliminar el fallback `'a'` y asegurarse de que siempre se utilice `question.correct_option`.
    *   **Justificación:** Una vez que el backend no borre `correct_option`, este valor siempre estará disponible. Si por alguna razón no lo está, es un error que debe ser visible y no enmascarado por un fallback incorrecto.
    *   **Acción:** Ajustar la llamada a `onShowResults` para que no pase `correctOption` si la API de backend ya no lo requiere.

3.  **Modificar `src/store/questionStore.ts`:**
    *   **Acción:** Ajustar las llamadas a las funciones `stopVoting` y `showResults` para que no pasen `correctOption` como argumento, ya que el backend lo recuperará directamente.
    *   **Justificación:** Consistencia con los cambios en el backend.
    *   **Verificación:** Confirmar que el estado `currentQuestion` se actualiza correctamente con la `correct_option` después de los eventos `voting_stopped` y `show_results` (esto ya parece estar bien, pero se reconfirmará durante la implementación).

### Fase 2: Corrección de la Visualización de Resultados en la Audiencia

1.  **Modificar `src/components/audience/QuestionInterface.tsx`:**
    *   **Acción:** Revisar y confirmar las condiciones de renderizado para `PersonalResult` y `QuestionExplanation`. Deben activarse cuando `currentQuestion.votingClosed` sea `true` Y `currentQuestion.correct_option` esté presente.
    *   **Justificación:** Asegurar que los resultados solo se muestren cuando la votación esté cerrada y la respuesta correcta esté disponible.
    *   **Acción:** Verificar que `PersonalResult` y `QuestionExplanation` reciban las props `correct_option` y `explanation` correctamente del `currentQuestion` del store.

2.  **Modificar `src/store/audienceQAStore.ts`:**
    *   **Acción:** Asegurarse de que los listeners de socket (especialmente para `new_audience_question`, `question_answered`, y los eventos de resultados como `show_question_results` o `show_results`) actualicen el `currentQuestion` en el store de la audiencia con la `correct_option` y el estado `votingClosed` cuando corresponda.
    *   **Justificación:** El store de la audiencia debe tener la información más reciente y precisa de la pregunta para que los componentes de la UI puedan renderizar los resultados correctamente.

## Diagrama de Flujo Actualizado

```mermaid
graph TD
    subgraph Presentador
        A[Crear/Editar Pregunta] --> B{Guardar Opción Correcta?};
        B -- Sí --> C[Pregunta Guardada con correct_option];
        C --> D[Iniciar Pregunta];
        D --> E[Contador en Marcha];
        E -- Contador Termina --> F[Botón "Mostrar Resultados" Habilitado];
        F --> G[Clic en "Mostrar Resultados"];
    end

    subgraph Servidor (Backend)
        H[API: createQuestion/updateQuestion] --> I{Persistir correct_option};
        I -- Sí --> J[DB: Pregunta con correct_option];
        J --> K[API: startVoting (NO BORRA correct_option)];
        K --> L[Emitir Socket: voting_started];
        G --> M[API: showResults (Recupera correct_option de DB)];
        M --> N[Emitir Socket: show_question_results / show_results (con correct_option y votos)];
    end

    subgraph Audiencia
        O[Recibir Socket: voting_started] --> P[Mostrar Pregunta y Contador];
        P -- Contador Termina --> Q[Mostrar "Esperando resultados"];
        N --> R[Recibir Socket: show_question_results / show_results];
        R --> S{currentQuestion.votingClosed && currentQuestion.correct_option?};
        S -- Sí --> T[Mostrar Resultados (PersonalResult/QuestionExplanation)];
        S -- No --> Q;
    end

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#f9f,stroke:#333,stroke-width:2px
    style C fill:#f9f,stroke:#333,stroke-width:2px
    style D fill:#f9f,stroke:#333,stroke-width:2px
    style E fill:#f9f,stroke:#333,stroke-width:2px
    style F fill:#f9f,stroke:#333,stroke-width:2px
    style G fill:#f9f,stroke:#333,stroke-width:2px

    style H fill:#ccf,stroke:#333,stroke-width:2px
    style I fill:#ccf,stroke:#333,stroke-width:2px
    style J fill:#ccf,stroke:#333,stroke-width:2px
    style K fill:#ccf,stroke:#333,stroke-width:2px
    style L fill:#ccf,stroke:#333,stroke-width:2px
    style M fill:#ccf,stroke:#333,stroke-width:2px
    style N fill:#ccf,stroke:#333,stroke-width:2px

    style O fill:#cfc,stroke:#333,stroke-width:2px
    style P fill:#cfc,stroke:#333,stroke-width:2px
    style Q fill:#cfc,stroke:#333,stroke-width:2px
    style R fill:#cfc,stroke:#333,stroke-width:2px
    style S fill:#cfc,stroke:#333,stroke-width:2px
    style T fill:#cfc,stroke:#333,stroke-width:2px