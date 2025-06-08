# Plan de Solución para el Módulo de IA

## Problema

1.  Las respuestas generadas por la IA siempre tienen la opción 'A' como la correcta.
2.  La vista del presentador para crear o editar preguntas tiene un tema oscuro que dificulta la lectura.

## Solución

1.  **Corregir el sesgo en la IA:**
    *   Modificar el prompt utilizado para generar las preguntas para que la IA elija aleatoriamente la opción correcta.
    *   Editar el archivo [`server/utils/promptTemplates.js`](server/utils/promptTemplates.js) para:
        *   Eliminar la línea `"correct_option": "A"`.
        *   Agregar la instrucción "Selecciona una opción correcta al azar (A, B o C)".
2.  **Arreglar la vista del presentador:**
    *   Identificar el componente responsable de la vista del presentador para crear o editar preguntas (probablemente [`src/components/admin/QuestionForm.tsx`](src/components/admin/QuestionForm.tsx) o [`src/components/admin/QuestionsTabContent.tsx`](src/components/admin/QuestionsTabContent.tsx)).
    *   Modificar el componente para asegurar que siempre use un tema claro (light) con tonos blancos. Esto podría implicar cambiar clases de CSS o modificar la lógica de selección de temas.
3.  **Pruebas:**
    *   Generar nuevas preguntas con la IA y verificar que la opción correcta ya no sea siempre la A.
    *   Verificar que la vista del presentador se muestre correctamente con un tema claro.
4.  **Mejora Opcional:**
    *   Considerar la aleatorización de las opciones en la vista de la audiencia para evitar cualquier sesgo percibido por los usuarios.

## Diagrama de Flujo

```mermaid
graph LR
    A[Inicio] --> B{Identificar y corregir el sesgo en la IA};
    B --> C[Modificar server/utils/promptTemplates.js];
    C --> D{Arreglar la vista del presentador};
    D --> E[Modificar src/components/admin/QuestionForm.tsx o QuestionsTabContent.tsx];
    E --> F{Probar la solución};
    F --> G[Generar preguntas y verificar la vista del presentador];
    G --> H{Ajustar la solución si es necesario};
    H --> I[Fin];