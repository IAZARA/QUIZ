/**
 * Templates de prompts optimizados para diferentes proveedores de IA
 */

export const createQuestionPrompt = (source, numQuestions, provider = 'anthropic') => {
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
      "correct_option": "A",
      "explanation": "Explicación detallada de por qué esta respuesta es correcta"
    }
  ]
}

CONTENIDO BASE PARA LAS PREGUNTAS:
${source.type === 'document' ? `Documento: ${source.documentName || 'Documento cargado'}` : 'Tema proporcionado'}

${source.content}

Responde ÚNICAMENTE con el JSON válido, sin texto adicional, sin markdown, sin explicaciones previas.`;

  return basePrompt;
};

export const createDeepSeekPrompt = (source, numQuestions) => {
  // Prompt optimizado específicamente para DeepSeek
  return createQuestionPrompt(source, numQuestions, 'deepseek');
};

export const createAnthropicPrompt = (source, numQuestions) => {
  // Prompt optimizado específicamente para Anthropic
  return createQuestionPrompt(source, numQuestions, 'anthropic');
};