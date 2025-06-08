import { createAnthropicPrompt, createDeepSeekPrompt } from '../utils/promptTemplates.js';

/**
 * Servicio unificado de IA que maneja múltiples proveedores con fallback automático
 */
class AIService {
  constructor() {
    this.anthropicKey = process.env.ANTHROPIC_API_KEY;
    this.deepseekKey = process.env.DEEPSEEK_API_KEY;
    this.deepseekModel = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
    this.deepseekBaseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
    this.deepseekMaxTokens = parseInt(process.env.DEEPSEEK_MAX_TOKENS) || 4000;
    this.deepseekTemperature = parseFloat(process.env.DEEPSEEK_TEMPERATURE) || 0.7;
    
    // Validar configuraciones al inicializar
    this.validateConfiguration();
  }

  validateConfiguration() {
    console.log('🔧 Validando configuración de AIService...');
    console.log(`📊 Anthropic Key disponible: ${!!this.anthropicKey}`);
    console.log(`📊 DeepSeek Key disponible: ${!!this.deepseekKey}`);
    console.log(`📊 DeepSeek Model: ${this.deepseekModel}`);
    
    if (!this.anthropicKey && !this.deepseekKey) {
      console.error('❌ ERROR: No hay claves de API configuradas para ningún proveedor');
      throw new Error('Al menos una clave de API debe estar configurada (ANTHROPIC_API_KEY o DEEPSEEK_API_KEY)');
    }
    
    if (!this.deepseekKey) {
      console.warn('⚠️ ADVERTENCIA: DEEPSEEK_API_KEY no configurada, fallback no disponible');
    }
  }

  /**
   * Método principal para generar preguntas con fallback automático
   */
  async generateQuestions(source, numQuestions) {
    const startTime = Date.now();
    let lastError = null;
    
    console.log(`🚀 Iniciando generación de ${numQuestions} preguntas...`);
    console.log(`📝 Fuente: ${source.type} (${source.content?.length || 0} caracteres)`);

    // Intentar primero con Anthropic si está disponible
    if (this.anthropicKey) {
      try {
        console.log('🤖 Intentando generar preguntas con Anthropic Claude...');
        const result = await this.tryAnthropic(source, numQuestions);
        const duration = Date.now() - startTime;
        console.log(`✅ Anthropic exitoso en ${duration}ms`);
        
        return {
          ...result,
          provider: 'anthropic',
          responseTime: duration,
          fallbackUsed: false
        };
      } catch (error) {
        lastError = error;
        console.log(`❌ Anthropic falló: ${error.message}`);
        
        // Si es un error 401, es probable que la clave sea inválida
        if (error.message.includes('401') || error.message.includes('API key')) {
          console.log('🔑 Error de autenticación detectado, la clave de Anthropic puede ser inválida');
        }
      }
    } else {
      console.log('⚠️ Anthropic no configurado, saltando al fallback');
    }

    // Fallback a DeepSeek
    if (this.deepseekKey) {
      try {
        console.log('🔄 Cambiando a DeepSeek como fallback...');
        const result = await this.tryDeepSeek(source, numQuestions);
        const duration = Date.now() - startTime;
        console.log(`✅ DeepSeek exitoso en ${duration}ms`);
        
        return {
          ...result,
          provider: 'deepseek',
          responseTime: duration,
          fallbackUsed: true,
          originalError: lastError?.message
        };
      } catch (deepseekError) {
        console.error('❌ DeepSeek también falló:', deepseekError.message);
        
        // Ambos proveedores fallaron
        const errorMessage = lastError 
          ? `Todos los proveedores de IA fallaron. Anthropic: ${lastError.message}, DeepSeek: ${deepseekError.message}`
          : `DeepSeek falló: ${deepseekError.message}`;
        
        throw new Error(errorMessage);
      }
    } else {
      // No hay fallback disponible
      const errorMessage = lastError 
        ? `Anthropic falló y no hay fallback configurado: ${lastError.message}`
        : 'No hay proveedores de IA configurados';
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Intentar generar preguntas con Anthropic Claude
   */
  async tryAnthropic(source, numQuestions) {
    const prompt = createAnthropicPrompt(source, numQuestions);
    
    console.log('📡 Llamando a Anthropic API...');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.anthropicKey,
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
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
        
        if (response.status === 401) {
          errorMessage = 'API Key de Anthropic inválida o expirada';
        } else if (response.status === 429) {
          errorMessage = 'Límite de rate de Anthropic excedido';
        }
      } catch (parseError) {
        console.error('Error parseando respuesta de error de Anthropic:', parseError);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Respuesta de Anthropic en formato inesperado');
    }
    
    return this.parseAIResponse(data.content[0].text, 'anthropic');
  }

  /**
   * Intentar generar preguntas con DeepSeek
   */
  async tryDeepSeek(source, numQuestions) {
    const prompt = createDeepSeekPrompt(source, numQuestions);
    
    console.log('📡 Llamando a DeepSeek API...');
    const response = await fetch(`${this.deepseekBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.deepseekKey}`
      },
      body: JSON.stringify({
        model: this.deepseekModel,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.deepseekMaxTokens,
        temperature: this.deepseekTemperature,
        stream: false
      })
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
        
        if (response.status === 401) {
          errorMessage = 'API Key de DeepSeek inválida o expirada';
        } else if (response.status === 429) {
          errorMessage = 'Límite de rate de DeepSeek excedido';
        }
      } catch (parseError) {
        console.error('Error parseando respuesta de error de DeepSeek:', parseError);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error('Respuesta de DeepSeek en formato inesperado');
    }
    
    return this.parseAIResponse(data.choices[0].message.content, 'deepseek');
  }

  /**
   * Parsear y validar la respuesta de cualquier proveedor de IA
   */
  parseAIResponse(responseText, provider) {
    console.log(`🔍 Parseando respuesta de ${provider}...`);
    
    let parsedResponse;
    try {
      // Limpiar la respuesta si tiene texto adicional o markdown
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : responseText;
      parsedResponse = JSON.parse(jsonString);
    } catch (parseError) {
      console.error(`Error parseando respuesta de ${provider}:`, parseError);
      console.log('Respuesta original:', responseText.substring(0, 500) + '...');
      
      throw new Error(`Error procesando respuesta de ${provider}: formato JSON inválido`);
    }

    // Validar estructura de respuesta
    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      throw new Error(`Formato de respuesta inválido de ${provider}: no contiene array de preguntas`);
    }

    // Validar cada pregunta
    const validQuestions = parsedResponse.questions.filter(q => {
      return q.content && q.option_a && q.option_b && q.option_c && 
             q.correct_option && ['A', 'B', 'C'].includes(q.correct_option) &&
             q.explanation;
    });

    if (validQuestions.length === 0) {
      throw new Error(`No se generaron preguntas válidas con ${provider}`);
    }

    console.log(`✅ ${validQuestions.length} preguntas válidas parseadas de ${provider}`);
    
    return {
      questions: validQuestions,
      count: validQuestions.length,
      originalCount: parsedResponse.questions.length
    };
  }

  /**
   * Método para probar la conectividad con un proveedor específico
   */
  async testProvider(provider) {
    const testSource = {
      type: 'text',
      content: 'Matemáticas básicas: suma y resta'
    };
    
    try {
      if (provider === 'anthropic' && this.anthropicKey) {
        await this.tryAnthropic(testSource, 1);
        return { success: true, provider: 'anthropic' };
      } else if (provider === 'deepseek' && this.deepseekKey) {
        await this.tryDeepSeek(testSource, 1);
        return { success: true, provider: 'deepseek' };
      } else {
        return { success: false, error: `Proveedor ${provider} no configurado` };
      }
    } catch (error) {
      return { success: false, provider, error: error.message };
    }
  }
}

export default AIService;