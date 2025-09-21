// Versión simplificada para pruebas
console.log('🤖 AI Service Test cargado')

// Simulación de servicio AI para pruebas
window.testAI = {
  async generateDbml(prompt) {
    console.log('📝 Prompt recibido:', prompt)
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock DBML basado en el prompt
    let mockDbml = ''
    const lowerPrompt = prompt.toLowerCase()
    
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
      explanation: 'Generated using test mock (AI service will be integrated later)',
      provider: 'mock',
      duration: 1000
    }
  },
  
  // Función para probar con API real de Gemini
  async testGeminiAPI(prompt) {
    const apiKey = localStorage.getItem('ai_gemini_key')
    if (!apiKey) {
      throw new Error('API key not found. Set it with: localStorage.setItem("ai_gemini_key", "your_key")')
    }
    
    console.log('🤖 Probando API real de Gemini...')
    
    const systemPrompt = `Eres un arquitecto de bases de datos experto. Genera código DBML válido y bien estructurado.

REGLAS OBLIGATORIAS:
1. Genera SOLO código DBML válido, sin explicaciones adicionales
2. Usa nombres en inglés para tablas y campos (snake_case)
3. Incluye siempre primary keys con [pk]
4. Añade timestamps: created_at, updated_at con [default: \`now()\`]
5. Usa referencias explícitas: Ref: tabla1.campo > tabla2.campo

SOLICITUD DEL USUARIO:
${prompt}

RESPONDE ÚNICAMENTE CON CÓDIGO DBML VÁLIDO.`

    const payload = {
      contents: [{
        parts: [{
          text: systemPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`
    
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
    const dbmlCode = generatedText.replace(/```(?:dbml|sql)?\s*\n?(.*?)\n?```/gs, '$1').trim()
    
    return {
      success: true,
      dbmlCode,
      explanation: 'Generated using Gemini API',
      provider: 'gemini',
      usage: data.usageMetadata || null
    }
  }
}

console.log('✅ Test AI service disponible en window.testAI')