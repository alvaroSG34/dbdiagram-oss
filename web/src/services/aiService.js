/**
 * AI Service para generación de diagramas DBML
 * Diseñado para empezar con Gemini (gratis) y migrar a OpenAI después
 */

// Configuración de proveedores
const AI_PROVIDERS = {
  gemini: {
    name: 'Google Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    model: 'gemini-2.5-flash',
    free: true,
    rateLimit: '1K/min'
  },
  openai: {
    name: 'OpenAI GPT-4o',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    free: false,
    rateLimit: '500/min'
  },
  ollama: {
    name: 'Ollama Local',
    endpoint: 'http://localhost:11434/api/generate',
    model: 'codellama:7b',
    free: true,
    rateLimit: 'unlimited'
  }
}

// Proveedor actual (comenzamos con Gemini)
let currentProvider = 'gemini'

// Sistema de prompts optimizados para DBML
const DBML_SYSTEM_PROMPTS = {
  base: `Eres un arquitecto de bases de datos experto especializado en generar código DBML válido y bien estructurado.

REGLAS OBLIGATORIAS:
1. Genera SOLO código DBML válido, sin explicaciones adicionales
2. Usa nombres en inglés para tablas y campos (snake_case)
3. Incluye siempre primary keys con [pk] o [primary key]
4. Añade timestamps: created_at, updated_at con [default: \`now()\`]
5. Usa referencias explícitas: Ref: tabla1.campo > tabla2.campo
6. Incluye índices para campos frecuentemente consultados
7. Usa tipos de datos apropiados: integer, varchar(n), text, timestamp, boolean
8. Para relaciones many-to-many, crea tablas intermedias

TIPOS DE DATOS VÁLIDOS:
- integer, bigint, smallint
- varchar(n), char(n), text
- decimal(p,s), float, double
- boolean
- date, time, timestamp
- json, jsonb

EJEMPLO DE SALIDA ESPERADA:
Table users {
  id integer [pk]
  username varchar(50) [unique, not null]
  email varchar(100) [unique, not null]  
  password_hash varchar(255) [not null]
  created_at timestamp [default: \`now()\`]
  updated_at timestamp [default: \`now()\`]
}

Table posts {
  id integer [pk]
  title varchar(200) [not null]
  content text
  user_id integer [not null]
  created_at timestamp [default: \`now()\`]
  updated_at timestamp [default: \`now()\`]
}

Ref: posts.user_id > users.id

RESPONDE ÚNICAMENTE CON CÓDIGO DBML VÁLIDO.`,

  context: `CONTEXTO ADICIONAL:
- El usuario está diseñando un diagrama de base de datos
- Necesita código DBML que se insertará automáticamente en un editor
- Debe ser sintácticamente correcto y seguir buenas prácticas de diseño DB`
}

/**
 * Clase principal del servicio AI
 */
class AIService {
  constructor() {
    this.provider = currentProvider
    this.apiKey = null
    this.initialize()
  }

  /**
   * Inicializar el servicio con variables de entorno
   */
  initialize() {
    // Cargar API keys desde variables de entorno o localStorage para desarrollo
    this.apiKey = this.getApiKey(this.provider)
    
    if (!this.apiKey && this.provider !== 'ollama') {
      console.warn(`⚠️ No API key found for ${this.provider}. Using mock responses.`)
    }
  }

  /**
   * Obtener API key para el proveedor actual
   */
  getApiKey(provider) {
    const envKey = `${provider.toUpperCase()}_API_KEY`
    
    // Primero intentar desde process.env (producción)
    if (typeof process !== 'undefined' && process.env && process.env[envKey]) {
      return process.env[envKey]
    }
    
    // Luego desde localStorage (desarrollo)
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(`ai_${provider}_key`)
    }
    
    return null
  }

  /**
   * Cambiar proveedor de IA
   */
  switchProvider(newProvider) {
    if (!AI_PROVIDERS[newProvider]) {
      throw new Error(`Unknown AI provider: ${newProvider}`)
    }
    
    this.provider = newProvider
    currentProvider = newProvider
    this.apiKey = this.getApiKey(newProvider)
    
    console.log(`🔄 Switched to AI provider: ${AI_PROVIDERS[newProvider].name}`)
  }

  /**
   * Generar código DBML desde un prompt
   */
  async generateDbml(userPrompt, options = {}) {
    const startTime = Date.now()
    
    try {
      console.log(`🤖 Generating DBML with ${AI_PROVIDERS[this.provider].name}...`)
      console.log(`📝 Prompt: "${userPrompt.substring(0, 100)}..."`)
      
      let result
      
      switch (this.provider) {
        case 'gemini':
          result = await this.generateWithGemini(userPrompt, options)
          break
        case 'openai':
          result = await this.generateWithOpenAI(userPrompt, options)
          break
        case 'ollama':
          result = await this.generateWithOllama(userPrompt, options)
          break
        default:
          throw new Error(`Unsupported provider: ${this.provider}`)
      }
      
      const duration = Date.now() - startTime
      console.log(`✅ DBML generated successfully in ${duration}ms`)
      
      return {
        success: true,
        dbmlCode: result.dbmlCode,
        explanation: result.explanation || '',
        provider: this.provider,
        duration,
        usage: result.usage || null
      }
      
    } catch (error) {
      console.error(`❌ Error generating DBML with ${this.provider}:`, error)
      
      // Intentar fallback automático
      if (options.autoFallback !== false) {
        return await this.generateWithFallback(userPrompt, options)
      }
      
      throw error
    }
  }

  /**
   * Generar con Google Gemini (proveedor principal gratuito)
   */
  async generateWithGemini(userPrompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured')
    }
    
    const fullPrompt = `${DBML_SYSTEM_PROMPTS.base}

SOLICITUD DEL USUARIO:
${userPrompt}

${DBML_SYSTEM_PROMPTS.context}`

    const payload = {
      contents: [{
        parts: [{
          text: fullPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.1, // Baja temperatura para código más determinístico
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    }

    const url = `${AI_PROVIDERS.gemini.endpoint}?key=${this.apiKey}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API')
    }

    const generatedText = data.candidates[0].content.parts[0].text
    const dbmlCode = this.extractDbmlCode(generatedText)
    
    return {
      dbmlCode,
      explanation: `Generated using ${AI_PROVIDERS.gemini.name}`,
      usage: data.usageMetadata || null
    }
  }

  /**
   * Generar con OpenAI (para migración futura)
   */
  async generateWithOpenAI(userPrompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const payload = {
      model: AI_PROVIDERS.openai.model,
      messages: [
        {
          role: 'system',
          content: DBML_SYSTEM_PROMPTS.base
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2048
    }

    const response = await fetch(AI_PROVIDERS.openai.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    const generatedText = data.choices[0].message.content
    const dbmlCode = this.extractDbmlCode(generatedText)
    
    return {
      dbmlCode,
      explanation: `Generated using ${AI_PROVIDERS.openai.name}`,
      usage: data.usage || null
    }
  }

  /**
   * Generar con Ollama local (backup)
   */
  async generateWithOllama(userPrompt, options = {}) {
    const payload = {
      model: AI_PROVIDERS.ollama.model,
      prompt: `${DBML_SYSTEM_PROMPTS.base}\n\nUSER REQUEST: ${userPrompt}`,
      stream: false,
      options: {
        temperature: 0.1,
        top_p: 0.9
      }
    }

    const response = await fetch(AI_PROVIDERS.ollama.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }

    const data = await response.json()
    const dbmlCode = this.extractDbmlCode(data.response)
    
    return {
      dbmlCode,
      explanation: `Generated using ${AI_PROVIDERS.ollama.name} (local)`
    }
  }

  /**
   * Sistema de fallback automático
   */
  async generateWithFallback(userPrompt, options = {}) {
    console.log(`🔄 Attempting fallback for failed ${this.provider} request...`)
    
    // Orden de fallback basado en disponibilidad
    const fallbackOrder = ['gemini', 'ollama', 'mock']
    
    for (const fallbackProvider of fallbackOrder) {
      if (fallbackProvider === this.provider) continue // No intentar el mismo que falló
      
      try {
        if (fallbackProvider === 'mock') {
          return this.generateMockDbml(userPrompt)
        }
        
        const originalProvider = this.provider
        this.switchProvider(fallbackProvider)
        
        const result = await this.generateDbml(userPrompt, { autoFallback: false })
        
        // Restaurar proveedor original para próximas requests
        this.switchProvider(originalProvider)
        
        console.log(`✅ Fallback successful with ${fallbackProvider}`)
        return result
        
      } catch (fallbackError) {
        console.warn(`❌ Fallback ${fallbackProvider} also failed:`, fallbackError.message)
      }
    }
    
    // Si todos fallan, usar respuesta mock
    console.log(`🎭 All providers failed, using mock response`)
    return this.generateMockDbml(userPrompt)
  }

  /**
   * Generar respuesta mock para desarrollo/fallback
   */
  generateMockDbml(userPrompt) {
    const lowerPrompt = userPrompt.toLowerCase()
    let mockDbml = ''
    
    if (lowerPrompt.includes('usuario') || lowerPrompt.includes('user')) {
      mockDbml = `Table users {
  id integer [pk]
  username varchar(50) [unique, not null]
  email varchar(100) [unique, not null]
  password_hash varchar(255) [not null]
  first_name varchar(50)
  last_name varchar(50)
  created_at timestamp [default: \`now()\`]
  updated_at timestamp [default: \`now()\`]
}

Table roles {
  id integer [pk]
  name varchar(50) [unique, not null]
  description text
  created_at timestamp [default: \`now()\`]
}

Table permissions {
  id integer [pk]
  name varchar(50) [unique, not null]
  description text
  resource varchar(50)
  action varchar(50)
}

Table user_roles {
  user_id integer [ref: > users.id]
  role_id integer [ref: > roles.id]
  assigned_at timestamp [default: \`now()\`]
  
  indexes {
    (user_id, role_id) [pk]
  }
}

Table role_permissions {
  role_id integer [ref: > roles.id]
  permission_id integer [ref: > permissions.id]
  
  indexes {
    (role_id, permission_id) [pk]
  }
}`
    } else {
      mockDbml = `Table example_table {
  id integer [pk]
  name varchar(100) [not null]
  description text
  created_at timestamp [default: \`now()\`]
  updated_at timestamp [default: \`now()\`]
}`
    }
    
    return {
      success: true,
      dbmlCode: mockDbml,
      explanation: 'Generated using mock data (API not available)',
      provider: 'mock',
      duration: 100
    }
  }

  /**
   * Extraer código DBML limpio de la respuesta
   */
  extractDbmlCode(text) {
    // Remover markdown code blocks si existen
    let cleanText = text.replace(/```(?:dbml|sql)?\s*\n?(.*?)\n?```/gs, '$1')
    
    // Remover explicaciones adicionales (quedarse solo con el código)
    const lines = cleanText.split('\n')
    const dbmlLines = []
    let inDbmlBlock = false
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Detectar inicio de bloque DBML
      if (trimmedLine.startsWith('Table ') || 
          trimmedLine.startsWith('Ref:') || 
          trimmedLine.startsWith('Enum ') ||
          trimmedLine.startsWith('TableGroup ')) {
        inDbmlBlock = true
      }
      
      // Si estamos en un bloque DBML, incluir la línea
      if (inDbmlBlock && (trimmedLine || dbmlLines.length > 0)) {
        dbmlLines.push(line)
      }
      
      // Detectar posible fin de bloque DBML (línea vacía seguida de texto no-DBML)
      if (!trimmedLine && inDbmlBlock) {
        // Mirar hacia adelante para ver si el bloque continúa
        continue
      }
    }
    
    return dbmlLines.join('\n').trim()
  }

  /**
   * Configurar API key para desarrollo
   */
  setApiKey(provider, apiKey) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`ai_${provider}_key`, apiKey)
    }
    
    if (provider === this.provider) {
      this.apiKey = apiKey
    }
    
    console.log(`🔑 API key configured for ${provider}`)
  }

  /**
   * Obtener información del proveedor actual
   */
  getProviderInfo() {
    return {
      current: this.provider,
      config: AI_PROVIDERS[this.provider],
      hasApiKey: !!this.apiKey,
      available: Object.keys(AI_PROVIDERS)
    }
  }
}

// Exportar instancia singleton
const aiService = new AIService()

export default aiService
export { AI_PROVIDERS, DBML_SYSTEM_PROMPTS }