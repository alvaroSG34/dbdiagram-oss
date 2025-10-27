<template>
  <div class="chat-panel" :class="{ 'chat-panel--collapsed': !isVisible }">
    <!-- Header del Chat -->
    <div class="chat-header">
      <div class="chat-title">
        <q-icon name="smart_toy" class="q-mr-sm text-primary" />
        <span>AI Assistant</span>
        <q-chip 
          dense 
          :color="isConnected ? 'positive' : 'negative'" 
          text-color="white" 
          class="q-ml-sm"
        >
          {{ providerInfo.current }}
        </q-chip>
        
        <!-- Context indicator -->
        <q-chip 
          v-if="currentSchemaInfo.hasSchema" 
          dense 
          outline
          color="info" 
          class="q-ml-sm"
          size="sm"
        >
          <q-icon name="visibility" size="12px" class="q-mr-xs" />
          {{ currentSchemaInfo.tables.length }} table{{ currentSchemaInfo.tables.length !== 1 ? 's' : '' }}
          <q-tooltip class="text-caption">
            {{ currentSchemaInfo.summary }}
          </q-tooltip>
        </q-chip>
      </div>
      
      <div class="chat-actions">
        <q-btn
          flat
          dense
          round
          icon="image"
          @click="triggerImageUpload"
          class="q-mr-xs"
        >
          <q-tooltip>Upload Diagram Image</q-tooltip>
        </q-btn>
        
        <!-- Settings button removed - API keys now configured in .env file -->
        
        <q-btn
          flat
          dense
          round
          icon="clear_all"
          @click="clearChat"
          class="q-mr-xs"
        >
          <q-tooltip>Clear Chat</q-tooltip>
        </q-btn>
        
        <q-btn
          flat
          dense
          round
          :icon="isVisible ? 'keyboard_arrow_down' : 'keyboard_arrow_up'"
          @click="toggleVisibility"
        >
          <q-tooltip>{{ isVisible ? 'Minimize' : 'Maximize' }}</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Messages Area -->
    <div v-show="isVisible" class="chat-messages" ref="messagesContainer">
      <div
        v-for="message in messages"
        :key="message.id"
        :class="['chat-message', `chat-message--${message.type}`]"
      >
        <!-- User Message -->
        <div v-if="message.type === 'user'" class="chat-user-message">
          <div class="chat-avatar">
            <q-avatar size="24px" color="primary" text-color="white">
              <q-icon name="person" />
            </q-avatar>
          </div>
          <div class="chat-content">
            <div class="chat-text">{{ message.content }}</div>
            <div class="chat-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>

        <!-- Assistant Message -->
        <div v-else-if="message.type === 'assistant'" class="chat-assistant-message">
          <div class="chat-avatar">
            <q-avatar size="24px" color="secondary" text-color="white">
              <q-icon name="smart_toy" />
            </q-avatar>
          </div>
          
          <div class="chat-content">
            <div v-if="message.content" class="chat-text" v-html="formatMessage(message.content)"></div>
            
            <!-- DBML Code Block -->
            <div v-if="message.dbml" class="chat-dbml-block">
              <div class="chat-dbml-header">
                <div class="chat-dbml-title">
                  <q-icon name="code" class="q-mr-xs" />
                  <span>Generated DBML</span>
                  <q-chip dense outline class="q-ml-sm">
                    {{ message.provider || 'AI' }}
                  </q-chip>
                  
                  <!-- Indicador de modificación -->
                  <q-chip 
                    v-if="message.isModification"
                    dense 
                    color="blue" 
                    text-color="white" 
                    icon="auto_fix_high"
                    class="q-ml-sm"
                    size="sm"
                  >
                    Modified Schema
                    <q-tooltip>This is the complete schema with your requested modifications</q-tooltip>
                  </q-chip>
                  
                  <!-- Indicador de contexto -->
                  <q-chip 
                    v-else-if="message.hasContext"
                    dense 
                    color="orange" 
                    text-color="white" 
                    icon="visibility"
                    class="q-ml-sm"
                    size="sm"
                  >
                    New Tables
                    <q-tooltip>AI generated new tables based on your existing schema</q-tooltip>
                  </q-chip>
                </div>
                
                <div class="chat-dbml-actions">
                  <q-btn
                    flat
                    dense
                    size="sm"
                    icon="content_copy"
                    @click="copyToClipboard(message.dbml)"
                    class="q-mr-xs"
                  >
                    <q-tooltip>Copy</q-tooltip>
                  </q-btn>
                  
                  <q-btn
                    flat
                    dense
                    size="sm"
                    icon="add_circle"
                    color="primary"
                    @click="insertDbml(message.dbml, 'append')"
                    class="q-mr-xs"
                  >
                    <q-tooltip>Append to Editor</q-tooltip>
                  </q-btn>
                  
                  <q-btn
                    flat
                    dense
                    size="sm"
                    icon="refresh"
                    color="warning"
                    @click="insertDbml(message.dbml, 'replace')"
                  >
                    <q-tooltip>Replace Editor Content</q-tooltip>
                  </q-btn>
                </div>
              </div>
              
              <div class="chat-code-container">
                <pre class="chat-code-block"><code>{{ message.dbml }}</code></pre>
              </div>
            </div>
            
            <div class="chat-time">
              {{ formatTime(message.timestamp) }}
              <span v-if="message.duration" class="q-ml-sm text-caption">
                ({{ message.duration }}ms)
              </span>
            </div>
          </div>
        </div>

        <!-- System Message -->
        <div v-else-if="message.type === 'system'" class="chat-system-message">
          <div class="chat-avatar">
            <q-avatar size="24px" color="grey-6" text-color="white">
              <q-icon name="info" />
            </q-avatar>
          </div>
          <div class="chat-content">
            <div class="chat-text">{{ message.content }}</div>
            <div class="chat-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="chat-message chat-message--loading">
        <div class="chat-assistant-message">
          <div class="chat-avatar">
            <q-avatar size="24px" color="secondary" text-color="white">
              <q-spinner-dots />
            </q-avatar>
          </div>
          <div class="chat-content">
            <div class="chat-text">
              <q-spinner-dots size="16px" class="q-mr-sm" />
              Generating diagram...
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area (solo visible cuando expanded) -->
    <div v-show="isVisible" class="chat-input-area">
      <!-- Image Upload Area -->
      <div 
        v-if="showImageUpload" 
        class="chat-image-upload"
        :class="{ 'drag-over': isDragOver }"
        @drop="handleImageDrop"
        @dragover.prevent="isDragOver = true"
        @dragleave="isDragOver = false"
        @click="triggerImageUpload"
      >
        <div class="upload-content">
          <q-icon name="cloud_upload" size="48px" color="primary" />
          <div class="upload-text">
            <div class="text-h6">Upload Diagram Image</div>
            <div class="text-caption">Drag & drop or click to select an image</div>
            <div class="text-caption text-grey-6">Supports: JPG, PNG, GIF, WebP (Max 10MB)</div>
          </div>
        </div>
      </div>

      <!-- Image Preview -->
      <div v-if="uploadedImage" class="chat-image-preview">
        <div class="image-preview-header">
          <q-icon name="image" class="q-mr-xs" />
          <span>Uploaded Image</span>
          <q-spacer />
          <q-btn
            flat
            dense
            round
            icon="close"
            size="sm"
            @click="clearUploadedImage"
          />
        </div>
        <div class="image-preview-container">
          <img :src="uploadedImage" alt="Uploaded diagram" class="preview-image" />
        </div>
        <div class="image-preview-actions">
          <q-btn
            color="primary"
            icon="smart_toy"
            label="Convert to DBML"
            @click="convertImageToDbml"
            :loading="isAnalyzingImage"
            :disable="isAnalyzingImage"
          />
          <q-btn
            flat
            label="Try Again"
            @click="triggerImageUpload"
          />
        </div>
      </div>

      <!-- Quick suggestions -->
      <div v-if="showSuggestions && suggestions.length && !currentMessage.trim() && !showImageUpload && !uploadedImage" class="chat-suggestions">
        <div class="chat-suggestions-title">Quick start:</div>
        <div class="chat-suggestions-chips">
          <q-chip
            v-for="suggestion in suggestions"
            :key="suggestion"
            clickable
            outline
            @click="selectSuggestion(suggestion)"
            class="chat-suggestion-chip"
            size="sm"
          >
            {{ suggestion }}
          </q-chip>
        </div>
      </div>

      <!-- Context Banner -->
      <div v-if="currentSchemaInfo.hasSchema && !showImageUpload && !uploadedImage" class="chat-context-banner">
        <q-banner rounded dense class="bg-blue-1 text-blue-9">
          <template v-slot:avatar>
            <q-icon name="visibility" color="blue" />
          </template>
          <div class="text-caption">
            <strong>AI can see your current diagram:</strong> {{ currentSchemaInfo.summary }}
            <br>
            <span class="text-grey-7">Try: "Add a comments table" or "Add relationship between users and posts"</span>
          </div>
        </q-banner>
      </div>

      <!-- Hidden file input -->
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        @change="handleImageSelect"
        style="display: none"
      />

      <div v-if="!showImageUpload && !uploadedImage" class="chat-input-container">
        <q-input
          v-model="currentMessage"
          :placeholder="currentSchemaInfo.hasSchema 
            ? 'Modify your schema or add new tables... (e.g., \'Add a comments table with user_id\')' 
            : 'Describe your database schema... (e.g., \'Create tables for users, roles, and permissions\')'"
          outlined
          dense
          autogrow
          :maxlength="1000"
          @keydown.enter.prevent="handleEnter"
          class="chat-input"
        >
          <template v-slot:prepend>
            <q-icon :name="currentSchemaInfo.hasSchema ? 'auto_fix_high' : 'edit'" />
          </template>
          
          <template v-slot:append>
            <q-btn
              flat
              dense
              round
              icon="send"
              color="primary"
              :disable="!currentMessage.trim() || isLoading"
              @click="sendMessage"
            />
          </template>
        </q-input>
      </div>
    </div>

    <!-- Settings Dialog removed - API keys now configured in .env file -->
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useEditorStore } from 'src/store/editor'
import { useQuasar } from 'quasar'

// Props y Emits
const emit = defineEmits(['close', 'dbml-inserted'])

// Stores y servicios
const editorStore = useEditorStore()
const $q = useQuasar()

// Estado reactivo
const isVisible = ref(true)
const isLoading = ref(false)
const isConnected = ref(true)
const messages = ref([])
const currentMessage = ref('')
const messagesContainer = ref(null)
const showSuggestions = ref(true)
const selectedProvider = ref(process.env.DEFAULT_AI_PROVIDER || 'gemini')
const autoScroll = ref(true)
const showTimestamps = ref(true)

// Image upload state
const showImageUpload = ref(false)
const isDragOver = ref(false)
const uploadedImage = ref(null)
const isAnalyzingImage = ref(false)
const fileInput = ref(null)

// Información del proveedor AI (ahora desde variables de entorno)
const providerInfo = ref({
  current: process.env.DEFAULT_AI_PROVIDER || 'gemini',
  hasApiKey: !!(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY)
})

// Sugerencias rápidas (computadas dinámicamente)
const suggestions = computed(() => {
  const currentDbml = editorStore.source.text || ''
  const hasExistingSchema = currentDbml.trim().length > 0
  
  if (hasExistingSchema) {
    // Extract existing table names for context-aware suggestions
    const tableMatches = currentDbml.match(/Table\s+(\w+)\s*{/g) || []
    const existingTables = tableMatches.map(match => match.replace(/Table\s+(\w+)\s*{/, '$1')).join(', ')
    
    return [
      'Add a tickets table with relation to users',
      'Create audit logs for existing tables',
      'Add a categories table and link it to products',
      'Create a notifications system',
      'Add a comments table for posts or products',
      'Create invoice and payment tables'
    ]
  } else {
    return [
      'Create tables for users, roles, and permissions',
      'Design an e-commerce database with products, orders, and customers',
      'Create a blog schema with posts, comments, and authors',
      'Design a school management system database',
      'Create tables for a task management application',
      'Design a social media platform database'
    ]
  }
})

// Proveedores disponibles (filtrados según API keys configuradas en .env)
const availableProviders = computed(() => {
  const providers = []
  
  if (process.env.GEMINI_API_KEY) {
    providers.push({ label: 'Google Gemini (Free)', value: 'gemini' })
  }
  
  if (process.env.OPENAI_API_KEY) {
    providers.push({ label: 'OpenAI GPT-4o', value: 'openai' })
  }
  
  // Ollama siempre disponible (local)
  providers.push({ label: 'Ollama Local', value: 'ollama' })
  
  return providers
})

// Computadas
const hasMessages = computed(() => messages.value.length > 0)

// Análisis del esquema actual
const currentSchemaInfo = computed(() => {
  const currentDbml = editorStore.source.text || ''
  if (!currentDbml.trim()) {
    return { hasSchema: false, tables: [], summary: '' }
  }
  
  // Extract table names
  const tableMatches = currentDbml.match(/Table\s+(\w+)\s*{/g) || []
  const tables = tableMatches.map(match => match.replace(/Table\s+(\w+)\s*{/, '$1'))
  
  // Extract references
  const refMatches = currentDbml.match(/Ref:\s*[\w.]+\s*>\s*[\w.]+/g) || []
  
  const summary = tables.length > 0 
    ? `Current schema has ${tables.length} table${tables.length > 1 ? 's' : ''}: ${tables.join(', ')}${refMatches.length > 0 ? ` with ${refMatches.length} relationship${refMatches.length > 1 ? 's' : ''}` : ''}`
    : 'No schema found'
    
  return {
    hasSchema: true,
    tables,
    references: refMatches,
    summary
  }
})

// Métodos principales
const sendMessage = async () => {
  if (!currentMessage.value.trim() || isLoading.value) return

  const userMessage = {
    id: Date.now(),
    type: 'user',
    content: currentMessage.value.trim(),
    timestamp: new Date()
  }
  
  messages.value.push(userMessage)
  showSuggestions.value = false
  
  const prompt = currentMessage.value.trim()
  currentMessage.value = ''
  
  await scrollToBottom()
  await generateDbml(prompt)
}

const generateDbml = async (prompt) => {
  isLoading.value = true
  
  try {
    // Get current DBML to detect if we're modifying existing schema
    const currentDbml = editorStore.source.text || ''
    const hasExistingSchema = currentDbml.trim().length > 0
    const modificationKeywords = ['edita', 'edit', 'modifica', 'modify', 'añade', 'add', 'agrega', 'cambia', 'change', 'actualiza', 'update', 'relacion', 'relationship', 'entre', 'between']
    const isModification = modificationKeywords.some(keyword => prompt.toLowerCase().includes(keyword))
    
    // Generate DBML using selected provider
    const result = await generateDbmlWithProvider(prompt, selectedProvider.value)
    
    const assistantMessage = {
      id: Date.now(),
      type: 'assistant',
      content: result.explanation || `I've generated a database schema based on your request.`,
      dbml: result.dbmlCode,
      provider: result.provider,
      duration: result.duration,
      hasContext: hasExistingSchema,
      isModification: hasExistingSchema && isModification,
      timestamp: new Date()
    }
    
    messages.value.push(assistantMessage)
    
    // Auto-insert si es la primera generación O si es una modificación
    if (messages.value.filter(m => m.type === 'assistant').length === 1 || isModification) {
      const shouldAutoInsert = await $q.dialog({
        title: isModification ? 'Replace Diagram?' : 'Insert Generated DBML?',
        message: isModification 
          ? 'This will replace your current diagram with the modified version. Continue?' 
          : 'Would you like to insert this generated DBML into the editor?',
        ok: isModification ? 'Yes, Replace' : 'Yes, Insert',
        cancel: 'No, Keep in Chat'
      })
      
      if (shouldAutoInsert) {
        insertDbml(result.dbmlCode, isModification ? 'replace' : 'append')
      }
    }
    
  } catch (error) {
    console.error('Error generating DBML:', error)
    
    const errorMessage = {
      id: Date.now(),
      type: 'system',
      content: `Sorry, there was an error generating the diagram: ${error.message}. Please try again or check your API configuration.`,
      timestamp: new Date()
    }
    
    messages.value.push(errorMessage)
  }
  
  isLoading.value = false
  await scrollToBottom()
}

// Generar DBML con el proveedor seleccionado
const generateDbmlWithProvider = async (prompt, provider = selectedProvider.value) => {
  console.log('generateDbmlWithProvider called with:', { prompt, provider, selectedProviderValue: selectedProvider.value })
  
  // Get current DBML from editor
  const currentDbml = editorStore.source.text || ''
  const hasExistingSchema = currentDbml.trim().length > 0
  
  // Detectar si el usuario quiere MODIFICAR el esquema actual o crear algo NUEVO
  const modificationKeywords = ['edita', 'edit', 'modifica', 'modify', 'añade', 'add', 'agrega', 'cambia', 'change', 'actualiza', 'update', 'relacion', 'relationship', 'entre', 'between']
  const isModification = modificationKeywords.some(keyword => prompt.toLowerCase().includes(keyword))
  
  console.log('🔍 Análisis del prompt:')
  console.log('  - Tiene esquema existente:', hasExistingSchema)
  console.log('  - Es modificación:', isModification)
  console.log('  - Prompt:', prompt)
  
  let systemPrompt = `Eres un arquitecto de bases de datos experto especializado en generar código DBML válido y bien estructurado.

CONTEXTO IMPORTANTE:
${hasExistingSchema && isModification ? 
  `El usuario quiere MODIFICAR su esquema DBML existente.

⚠️ IMPORTANTE: Debes devolver el esquema COMPLETO, incluyendo todas las tablas existentes más las modificaciones solicitadas.

ESQUEMA ACTUAL:
\`\`\`dbml
${currentDbml}
\`\`\`

INSTRUCCIONES PARA MODIFICACIÓN:
- Devuelve el esquema COMPLETO (no solo los cambios)
- Mantén TODAS las tablas existentes sin cambios (a menos que se solicite específicamente)
- Aplica SOLO las modificaciones solicitadas por el usuario
- Si se pide añadir una relación, agrega el campo foreign key y la referencia Ref:
- Si se pide añadir una tabla, inclúyela junto con todas las existentes
- Mantén la consistencia con los nombres y tipos de datos existentes
- Las referencias deben ir FUERA de las tablas, formato: Ref: tabla1.campo > tabla2.campo` 
  : hasExistingSchema ?
  `El usuario ya tiene un esquema DBML existente pero quiere crear algo NUEVO (no modificar lo existente).

ESQUEMA ACTUAL:
\`\`\`dbml
${currentDbml}
\`\`\`

INSTRUCCIONES PARA NUEVO CONTENIDO:
- Solo genera las NUEVAS tablas solicitadas (no repitas las existentes)
- Si necesitas referenciar tablas existentes, usa los nombres que ya existen
- Mantén la consistencia con los nombres y tipos de datos existentes`
  : 
  'El usuario está empezando un esquema nuevo desde cero. Crea un esquema completo basado en la solicitud.'
}

REGLAS OBLIGATORIAS:
1. Genera SOLO código DBML válido, sin explicaciones adicionales
2. Usa nombres en inglés para tablas y campos (snake_case)
3. Incluye siempre primary keys con [pk, increment]
4. Añade timestamps: created_at, updated_at con [default: \`now()\`]
5. ⚠️ CRÍTICO: Las referencias (Ref:) deben ir FUERA de las tablas, NUNCA dentro
6. ⚠️ PROHIBIDO: NO uses [ref: > tabla.campo] dentro de columnas
7. Usa formato correcto: Ref: tabla1.campo > tabla2.campo (fuera de la tabla)
8. Para relaciones many-to-many, crea tablas intermedias con indexes para PKs compuestas
9. Para primary keys compuestas, usa: indexes { (campo1, campo2) [pk] }
10. Usa tipos: integer, varchar(n), text, timestamp, boolean, decimal(p,s)
11. ${hasExistingSchema ? 'IMPORTANTE: NO repitas tablas existentes, solo crea las nuevas solicitadas' : 'Crea un esquema completo basado en la solicitud'}

FORMATO CORRECTO:
Table users {
  id integer [pk, increment]
  username varchar(50) [unique, not null]
  created_at timestamp [default: \`now()\`]
  updated_at timestamp [default: \`now()\`]
}

Table posts {
  id integer [pk, increment]
  user_id integer [not null]
  title varchar(200) [not null]
  created_at timestamp [default: \`now()\`]
  updated_at timestamp [default: \`now()\`]
}

Table user_roles {
  user_id integer [not null]
  role_id integer [not null]
  
  indexes {
    (user_id, role_id) [pk]
  }
}

// ✅ Referencias van FUERA de las tablas (OBLIGATORIO)
Ref: posts.user_id > users.id
Ref: user_roles.user_id > users.id
Ref: user_roles.role_id > roles.id

FORMATO INCORRECTO (NO HACER):
Table posts {
  id integer [pk]
  user_id integer [ref: > users.id]  // ❌ PROHIBIDO: Ref dentro de la tabla
}

Table user_roles {
  [pk: (user_id, role_id)]  // ❌ INCORRECTO: Sintaxis inválida
}

FORMATO INCORRECTO (NO HACER):
Table posts {
  id integer [pk, increment]
  user_id integer [not null]
  Ref: posts.user_id > users.id  // ❌ INCORRECTO
}`

  const startTime = Date.now()
  
  try {
    // Ensure provider is a string
    const providerString = typeof provider === 'object' ? provider.value || provider : provider
    console.log('Using provider:', providerString)
    
    if (providerString === 'openai') {
      return await generateWithOpenAI(prompt, systemPrompt, startTime)
    } else if (providerString === 'gemini') {
      return await generateWithGemini(prompt, systemPrompt, startTime)
    } else {
      throw new Error(`Provider ${providerString} not implemented yet`)
    }
  } catch (error) {
    console.error(`Error with ${provider}:`, error)
    throw error
  }
}

// Generar con OpenAI
const generateWithOpenAI = async (prompt, systemPrompt, startTime) => {
  // 🔑 Obtener API key desde variables de entorno (inyectadas por Quasar)
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured in .env file. Please add OPENAI_API_KEY to your web/.env file.')
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.3
    })
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
  }
  
  const result = await response.json()
  const dbmlCode = result.choices[0].message.content.trim()
  
  return {
    success: true,
    dbmlCode: extractDbmlCode(dbmlCode),
    explanation: `Generated using OpenAI GPT-4o-mini (${result.usage?.total_tokens || 'N/A'} tokens)`,
    provider: 'openai',
    duration: Date.now() - startTime
  }
}

// Generar con Gemini
const generateWithGemini = async (prompt, systemPrompt, startTime) => {
  // 🔑 Obtener API key desde variables de entorno (inyectadas por Quasar)
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured in .env file. Please add GEMINI_API_KEY to your web/.env file.')
  }
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${systemPrompt}\n\nUser Request: ${prompt}`
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1000,
      }
    })
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`Gemini API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
  }
  
  const result = await response.json()
  const dbmlCode = result.candidates?.[0]?.content?.parts?.[0]?.text || ''
  
  return {
    success: true,
    dbmlCode: extractDbmlCode(dbmlCode),
    explanation: 'Generated using Google Gemini 2.0 Flash (Free)',
    provider: 'gemini',
    duration: Date.now() - startTime
  }
}

// Extraer código DBML limpio
const extractDbmlCode = (text) => {
  // Remove markdown code blocks
  let code = text.replace(/```dbml\n?/g, '').replace(/```\n?/g, '').trim()
  
  // Remove any explanation text before or after DBML
  const lines = code.split('\n')
  let processedLines = []
  let refsToMove = []
  let insideTable = false
  let currentTableLines = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Skip empty lines and comments at the start
    if (!line || line.startsWith('//') || line.startsWith('#')) {
      if (processedLines.length > 0 || insideTable) {
        processedLines.push(lines[i])
      }
      continue
    }
    
    // Check if we're starting a table
    if (line.match(/^Table\s+\w+\s*{/)) {
      insideTable = true
      currentTableLines = [lines[i]]
      continue
    }
    
    // Check if we're ending a table
    if (insideTable && line === '}') {
      currentTableLines.push(lines[i])
      processedLines.push(...currentTableLines)
      currentTableLines = []
      insideTable = false
      continue
    }
    
    // If inside a table, check for misplaced Refs
    if (insideTable) {
      if (line.match(/^\s*Ref:\s*.+/)) {
        // Move the Ref outside the table
        refsToMove.push(line.replace(/^\s*/, ''))
      } else {
        currentTableLines.push(lines[i])
      }
      continue
    }
    
    // If we're not inside a table and it's a valid DBML line
    if (line.match(/^(Table|Ref|Enum|Note|Project)\s/) || processedLines.length > 0) {
      processedLines.push(lines[i])
    }
  }
  
  // Add moved references at the end
  if (refsToMove.length > 0) {
    processedLines.push('') // Empty line before refs
    refsToMove.forEach(ref => {
      processedLines.push(ref)
    })
  }
  
  return processedLines.join('\n').trim()
}

// Cargar servicio AI dinámicamente (fallback)
const loadAIService = async () => {
  try {
    // Usar las funciones directas en lugar del servicio
    return {
      generateDbml: generateDbmlWithProvider
    }
    
  } catch (error) {
    console.warn('Could not load AI service:', error)
    return null
  }
}

// Mock DBML para fallback
const generateMockDbml = async (prompt) => {
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  const lowerPrompt = prompt.toLowerCase()
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
  } else if (lowerPrompt.includes('ecommerce') || lowerPrompt.includes('shop')) {
    mockDbml = `Table products {
  id integer [pk]
  name varchar(200) [not null]
  description text
  price decimal(10,2) [not null]
  stock integer [default: 0]
  category_id integer
  created_at timestamp [default: \`now()\`]
  updated_at timestamp [default: \`now()\`]
}

Table customers {
  id integer [pk]
  email varchar(100) [unique, not null]
  first_name varchar(50)
  last_name varchar(50)
  phone varchar(20)
  created_at timestamp [default: \`now()\`]
}

Table orders {
  id integer [pk]
  customer_id integer [not null]
  total decimal(10,2) [not null]
  status varchar(20) [default: 'pending']
  created_at timestamp [default: \`now()\`]
}

Table order_items {
  id integer [pk]
  order_id integer [not null]
  product_id integer [not null]
  quantity integer [not null]
  price decimal(10,2) [not null]
}

Ref: orders.customer_id > customers.id
Ref: order_items.order_id > orders.id
Ref: order_items.product_id > products.id`
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
    explanation: 'Generated using fallback mock data (configure AI service for better results)',
    provider: 'mock',
    duration: 1500
  }
}

// Función para limpiar código DBML generado por IA
const cleanDbmlCode = (dbmlCode) => {
  console.log('🧹 Limpiando código DBML generado por IA...')
  console.log('📝 Código original:', dbmlCode)
  
  // Limpiar el código línea por línea
  const cleanedLines = dbmlCode.split('\n').map(line => {
    const trimmedLine = line.trim()
    
    // Si es una línea de referencia (Ref:)
    if (trimmedLine.toLowerCase().startsWith('ref:')) {
      // Eliminar nombres de relación: [rel: nombre] al inicio
      let cleanedLine = trimmedLine.replace(/\[rel:\s*[^\]]+\]\s*/gi, '')
      
      // Eliminar cardinalidades y etiquetas después del operador
      // Formatos a limpiar:
      // - [card: 1:*] o [cardinality: 1:*]
      // - [name: user_posts] o [rel_name: user_posts]
      // - {card: 1:*} o {name: user_posts}
      // - (card: 1:*) o (name: user_posts)
      cleanedLine = cleanedLine.replace(/\s*[\[\{\(]\s*(card|cardinality)\s*:\s*[^\]\}\)]+[\]\}\)]/gi, '')
      cleanedLine = cleanedLine.replace(/\s*[\[\{\(]\s*(name|rel_name|relationship_name)\s*:\s*[^\]\}\)]+[\]\}\)]/gi, '')
      
      // Eliminar metadata adicional al final de la línea
      cleanedLine = cleanedLine.replace(/\s*\/\/.*$/, '') // Comentarios
      cleanedLine = cleanedLine.replace(/\s*;.*$/, '')    // Punto y coma
      
      // Limpiar espacios múltiples
      cleanedLine = cleanedLine.replace(/\s+/g, ' ').trim()
      
      console.log(`🔧 Línea limpiada: "${trimmedLine}" -> "${cleanedLine}"`)
      return cleanedLine
    }
    
    return line
  }).join('\n')
  
  console.log('✅ Código limpio:', cleanedLines)
  return cleanedLines
}

const insertDbml = (dbmlCode, mode = 'append') => {
  try {
    // Limpiar el código DBML antes de insertarlo
    const cleanedDbmlCode = cleanDbmlCode(dbmlCode)
    
    const currentDbml = editorStore.source.text || ''
    let newDbml
    
    if (mode === 'replace' || !currentDbml.trim()) {
      newDbml = cleanedDbmlCode
    } else {
      newDbml = currentDbml.trim() + '\n\n' + cleanedDbmlCode + '\n'
    }
    
    editorStore.updateSourceText(newDbml)
    editorStore.updateDatabase() // Update the database after inserting DBML
    
    $q.notify({
      type: 'positive',
      message: `DBML ${mode === 'replace' ? 'replaced' : 'inserted'} successfully!`,
      position: 'top-right',
      timeout: 2000
    })
    
    emit('dbml-inserted', { dbmlCode: cleanedDbmlCode, mode })
    
    // Add system message
    const systemMessage = {
      id: Date.now(),
      type: 'system',
      content: `DBML code has been ${mode === 'replace' ? 'replaced in' : 'inserted into'} the editor.`,
      timestamp: new Date()
    }
    
    messages.value.push(systemMessage)
    
  } catch (error) {
    console.error('Error inserting DBML:', error)
    
    $q.notify({
      type: 'negative',
      message: 'Error inserting DBML code',
      position: 'top-right'
    })
  }
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    $q.notify({
      type: 'positive',
      message: 'Copied to clipboard!',
      position: 'top-right',
      timeout: 1500
    })
  } catch (error) {
    console.error('Error copying to clipboard:', error)
    $q.notify({
      type: 'negative',
      message: 'Error copying to clipboard',
      position: 'top-right'
    })
  }
}

// Utilidades
const selectSuggestion = (suggestion) => {
  currentMessage.value = suggestion
  showSuggestions.value = false
}

const handleEnter = (event) => {
  if (event.shiftKey) {
    // Allow line breaks with Shift+Enter
    return
  }
  sendMessage()
}

const formatMessage = (content) => {
  return content.replace(/\n/g, '<br>')
}

const formatTime = (timestamp) => {
  if (!showTimestamps.value) return ''
  return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const scrollToBottom = async () => {
  if (!autoScroll.value) return
  
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const toggleVisibility = () => {
  isVisible.value = !isVisible.value
}

const clearChat = () => {
  messages.value = []
  showSuggestions.value = true
  
  // Check if there's existing DBML code
  const currentDbml = editorStore.source.text || ''
  const hasExistingSchema = currentDbml.trim().length > 0
  
  // Add context-aware welcome message
  const welcomeMessage = {
    id: Date.now(),
    type: 'assistant',
    content: hasExistingSchema 
      ? 'Hello! I can see you already have a database schema in the editor. I\'ll analyze your existing tables and only create the new ones you request. Just tell me what you want to add or modify!'
      : 'Hello! I can help you generate database schemas using DBML. Describe what tables and relationships you need, and I\'ll create the code for you.',
    timestamp: new Date()
  }
  
  messages.value.push(welcomeMessage)
}

const switchProvider = async (provider) => {
  try {
    console.log('switchProvider called with:', provider, typeof provider)
    
    // Ensure provider is a string
    const providerString = typeof provider === 'object' ? provider.value || provider : provider
    
    selectedProvider.value = providerString
    providerInfo.value.current = providerString
    
    // Update provider info based on environment variables
    const providerConfigs = {
      gemini: { current: 'gemini', hasApiKey: !!process.env.GEMINI_API_KEY },
      openai: { current: 'openai', hasApiKey: !!process.env.OPENAI_API_KEY },
      ollama: { current: 'ollama', hasApiKey: true } // Local, no key needed
    }
    
    providerInfo.value = providerConfigs[providerString] || providerInfo.value
    
    $q.notify({
      type: 'positive',
      message: `Switched to ${providerString === 'gemini' ? 'Google Gemini' : providerString === 'openai' ? 'OpenAI GPT-4o' : 'Ollama'}`,
      position: 'top-right'
    })
    
  } catch (error) {
    console.error('Error switching provider:', error)
    $q.notify({
      type: 'negative',
      message: 'Error switching AI provider',
      position: 'top-right'
    })
  }
}

// Image upload functions
const triggerImageUpload = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const handleImageSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    processImageFile(file)
  }
}

const handleImageDrop = (event) => {
  event.preventDefault()
  isDragOver.value = false
  
  const files = event.dataTransfer.files
  if (files.length > 0) {
    processImageFile(files[0])
  }
}

const processImageFile = (file) => {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    $q.notify({
      type: 'negative',
      message: 'Please select a valid image file (JPG, PNG, GIF, WebP)',
      position: 'top-right'
    })
    return
  }
  
  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    $q.notify({
      type: 'negative',
      message: 'Image size must be less than 10MB',
      position: 'top-right'
    })
    return
  }
  
  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadedImage.value = e.target.result
    showImageUpload.value = false
    showSuggestions.value = false
  }
  reader.readAsDataURL(file)
}

const clearUploadedImage = () => {
  uploadedImage.value = null
  showImageUpload.value = false
  showSuggestions.value = true
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const convertImageToDbml = async () => {
  if (!uploadedImage.value) return
  
  isAnalyzingImage.value = true
  
  try {
    // Convert base64 to blob for API calls
    const response = await fetch(uploadedImage.value)
    const blob = await response.blob()
    
    // Analyze image with selected provider
    const result = await analyzeImageWithProvider(blob, selectedProvider.value)
    
    const assistantMessage = {
      id: Date.now(),
      type: 'assistant',
      content: result.explanation || `I've analyzed your diagram image and generated the corresponding DBML code.`,
      dbml: result.dbmlCode,
      provider: result.provider,
      duration: result.duration,
      timestamp: new Date()
    }
    
    messages.value.push(assistantMessage)
    
    // Auto-insert if it's the first generation
    if (messages.value.filter(m => m.type === 'assistant').length === 1) {
      const shouldAutoInsert = await $q.dialog({
        title: 'Insert Generated DBML?',
        message: 'Would you like to insert this generated DBML into the editor?',
        ok: 'Yes, Insert',
        cancel: 'No, Keep in Chat'
      })
      
      if (shouldAutoInsert) {
        insertDbml(result.dbmlCode, 'append')
      }
    }
    
    // Clear the uploaded image after successful conversion
    clearUploadedImage()
    
  } catch (error) {
    console.error('Error analyzing image:', error)
    
    const errorMessage = {
      id: Date.now(),
      type: 'system',
      content: `Sorry, there was an error analyzing the image: ${error.message}. Please try again or check your API configuration.`,
      timestamp: new Date()
    }
    
    messages.value.push(errorMessage)
  }
  
  isAnalyzingImage.value = false
  await scrollToBottom()
}

// Analyze image with selected provider
const analyzeImageWithProvider = async (imageBlob, provider = selectedProvider.value) => {
  const providerString = typeof provider === 'object' ? provider.value || provider : provider
  console.log('Analyzing image with provider:', providerString)
  
  const startTime = Date.now()
  
  try {
    if (providerString === 'openai') {
      return await analyzeWithOpenAIVision(imageBlob, startTime)
    } else if (providerString === 'gemini') {
      return await analyzeWithGeminiVision(imageBlob, startTime)
    } else {
      throw new Error(`Image analysis not supported for provider: ${providerString}`)
    }
  } catch (error) {
    console.error(`Error with ${providerString} vision:`, error)
    throw error
  }
}

// Analyze with OpenAI Vision
const analyzeWithOpenAIVision = async (imageBlob, startTime) => {
  // 🔑 Obtener API key desde variables de entorno
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured in .env file. Please add OPENAI_API_KEY to your web/.env file.')
  }
  
  // Convert blob to base64
  const base64 = await blobToBase64(imageBlob)
  
  const systemPrompt = `You are an expert database architect. Analyze this database diagram image and convert it to valid DBML code.

IMPORTANT RULES:
1. Generate ONLY valid DBML code, no explanations
2. Use English names for tables and fields (snake_case)
3. Always include primary keys with [pk, increment]
4. Add timestamps: created_at, updated_at with [default: \`now()\`]
5. References (Ref) must go OUTSIDE tables, not inside
6. Use format: Ref: table1.field > table2.field
7. For many-to-many relationships, create intermediate tables
8. If you see existing tables, don't duplicate them - only create new ones requested

Look for:
- Table names and their fields
- Data types (integer, varchar, text, etc.)
- Primary keys and foreign keys
- Relationships between tables
- Constraints and indexes

Generate clean, well-structured DBML code.`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: [
            { type: 'text', text: 'Analyze this database diagram and convert it to DBML:' },
            { 
              type: 'image_url', 
              image_url: { 
                url: `data:image/jpeg;base64,${base64}`,
                detail: 'high'
              } 
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
    })
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`OpenAI Vision API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
  }
  
  const result = await response.json()
  const dbmlCode = result.choices[0].message.content.trim()
  
  return {
    success: true,
    dbmlCode: extractDbmlCode(dbmlCode),
    explanation: `Analyzed using OpenAI GPT-4o Vision (${result.usage?.total_tokens || 'N/A'} tokens)`,
    provider: 'openai',
    duration: Date.now() - startTime
  }
}

// Analyze with Gemini Vision
const analyzeWithGeminiVision = async (imageBlob, startTime) => {
  // 🔑 Obtener API key desde variables de entorno
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured in .env file. Please add GEMINI_API_KEY to your web/.env file.')
  }
  
  // Convert blob to base64
  const base64 = await blobToBase64(imageBlob)
  
  const systemPrompt = `You are an expert database architect. Analyze this database diagram image and convert it to valid DBML code.

IMPORTANT RULES:
1. Generate ONLY valid DBML code, no explanations
2. Use English names for tables and fields (snake_case)
3. Always include primary keys with [pk, increment]
4. Add timestamps: created_at, updated_at with [default: \`now()\`]
5. References (Ref) must go OUTSIDE tables, not inside
6. Use format: Ref: table1.field > table2.field
7. For many-to-many relationships, create intermediate tables

Look for:
- Table names and their fields
- Data types (integer, varchar, text, etc.)
- Primary keys and foreign keys
- Relationships between tables
- Constraints and indexes

Generate clean, well-structured DBML code.`

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: systemPrompt },
          {
            inline_data: {
              mime_type: imageBlob.type,
              data: base64
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2000,
      }
    })
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`Gemini Vision API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
  }
  
  const result = await response.json()
  const dbmlCode = result.candidates?.[0]?.content?.parts?.[0]?.text || ''
  
  return {
    success: true,
    dbmlCode: extractDbmlCode(dbmlCode),
    explanation: 'Analyzed using Google Gemini 2.0 Flash Vision (Free)',
    provider: 'gemini',
    duration: Date.now() - startTime
  }
}

// Utility function to convert blob to base64
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Inicialización
onMounted(async () => {
  // Check for existing API key
  const existingKey = localStorage.getItem(`ai_${selectedProvider.value}_key`)
  providerInfo.value.hasApiKey = !!existingKey
  
  // Update provider info
  providerInfo.value = {
    current: selectedProvider.value,
    hasApiKey: !!existingKey
  }
  
  // Add welcome message
  clearChat()
})

// Watch para auto-scroll
watch(messages, () => {
  if (autoScroll.value) {
    nextTick(() => scrollToBottom())
  }
}, { deep: true })
</script>