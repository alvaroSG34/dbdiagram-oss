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
      </div>
      
      <div class="chat-actions">
        <q-btn
          flat
          dense
          round
          icon="settings"
          @click="showSettings = true"
          class="q-mr-xs"
        >
          <q-tooltip>Settings</q-tooltip>
        </q-btn>
        
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
      <!-- Quick suggestions -->
      <div v-if="showSuggestions && suggestions.length && !currentMessage.trim()" class="chat-suggestions">
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

      <div class="chat-input-container">
        <q-input
          v-model="currentMessage"
          placeholder="Describe your database schema... (e.g., 'Create tables for users, roles, and permissions')"
          outlined
          dense
          autogrow
          :maxlength="1000"
          @keydown.enter.prevent="handleEnter"
          class="chat-input"
        >
          <template v-slot:prepend>
            <q-icon name="edit" />
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

    <!-- Settings Dialog -->
    <q-dialog v-model="showSettings">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">AI Assistant Settings</div>
        </q-card-section>

        <q-card-section>
          <div class="q-gutter-md">
            <q-select
              v-model="selectedProvider"
              :options="availableProviders"
              label="AI Provider"
              outlined
              option-value="value"
              option-label="label"
              emit-value
              map-options
              @update:model-value="switchProvider"
            />
            
            <q-input
              v-model="apiKeyInput"
              label="API Key"
              type="password"
              outlined
              hint="Your API key will be stored locally"
            />
            
            <q-toggle
              v-model="autoScroll"
              label="Auto-scroll to new messages"
            />
            
            <q-toggle
              v-model="showTimestamps"
              label="Show timestamps"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showSettings = false" />
          <q-btn flat label="Save" color="primary" @click="saveSettings" />
        </q-card-actions>
      </q-card>
    </q-dialog>
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
const showSettings = ref(false)
const selectedProvider = ref('gemini')
const apiKeyInput = ref('')
const autoScroll = ref(true)
const showTimestamps = ref(true)

// Información del proveedor AI
const providerInfo = ref({
  current: 'gemini',
  hasApiKey: false
})

// Sugerencias rápidas
const suggestions = ref([
  'Create tables for users, roles, and permissions',
  'Design an e-commerce database with products, orders, and customers',
  'Create a blog schema with posts, comments, and authors',
  'Design a school management system database',
  'Create tables for a task management application',
  'Design a social media platform database'
])

// Proveedores disponibles
const availableProviders = [
  { label: 'Google Gemini (Free)', value: 'gemini' },
  { label: 'OpenAI GPT-4o', value: 'openai' },
  { label: 'Ollama Local', value: 'ollama' }
]

// Computadas
const hasMessages = computed(() => messages.value.length > 0)

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
    // Generate DBML using selected provider
    const result = await generateDbmlWithProvider(prompt, selectedProvider.value)
    
    const assistantMessage = {
      id: Date.now(),
      type: 'assistant',
      content: result.explanation || `I've generated a database schema based on your request.`,
      dbml: result.dbmlCode,
      provider: result.provider,
      duration: result.duration,
      timestamp: new Date()
    }
    
    messages.value.push(assistantMessage)
    
    // Auto-insert si es la primera generación
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
  
  const systemPrompt = `Eres un arquitecto de bases de datos experto especializado en generar código DBML válido y bien estructurado.

REGLAS OBLIGATORIAS:
1. Genera SOLO código DBML válido, sin explicaciones adicionales
2. Usa nombres en inglés para tablas y campos (snake_case)
3. Incluye siempre primary keys con [pk, increment]
4. Añade timestamps: created_at, updated_at con [default: \`now()\`]
5. Las referencias (Ref) deben ir FUERA de las tablas, no dentro
6. Usa formato: Ref: tabla1.campo > tabla2.campo
7. Para relaciones many-to-many, crea tablas intermedias

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

// Referencias van FUERA de las tablas
Ref: posts.user_id > users.id

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
  const apiKey = localStorage.getItem('ai_openai_key')
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please add your API key in the settings.')
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
  const apiKey = localStorage.getItem('ai_gemini_key')
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please add your API key in the settings.')
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

const insertDbml = (dbmlCode, mode = 'append') => {
  try {
    const currentDbml = editorStore.source.text || ''
    let newDbml
    
    if (mode === 'replace' || !currentDbml.trim()) {
      newDbml = dbmlCode
    } else {
      newDbml = currentDbml.trim() + '\n\n' + dbmlCode + '\n'
    }
    
    editorStore.updateSourceText(newDbml)
    editorStore.updateDatabase() // Update the database after inserting DBML
    
    $q.notify({
      type: 'positive',
      message: `DBML ${mode === 'replace' ? 'replaced' : 'inserted'} successfully!`,
      position: 'top-right',
      timeout: 2000
    })
    
    emit('dbml-inserted', { dbmlCode, mode })
    
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
  
  // Add welcome message
  const welcomeMessage = {
    id: Date.now(),
    type: 'assistant',
    content: 'Hello! I can help you generate database schemas using DBML. Describe what tables and relationships you need, and I\'ll create the code for you.',
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
    
    // Check for existing API key for the new provider
    const existingKey = localStorage.getItem(`ai_${providerString}_key`)
    providerInfo.value.hasApiKey = !!existingKey
    
    // Update provider info
    const providerConfigs = {
      gemini: { current: 'gemini', hasApiKey: !!localStorage.getItem('ai_gemini_key') },
      openai: { current: 'openai', hasApiKey: !!localStorage.getItem('ai_openai_key') },
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

const saveSettings = () => {
  if (apiKeyInput.value) {
    localStorage.setItem(`ai_${selectedProvider.value}_key`, apiKeyInput.value)
    providerInfo.value.hasApiKey = true
  }
  
  showSettings.value = false
  
  $q.notify({
    type: 'positive',
    message: 'Settings saved!',
    position: 'top-right'
  })
}

// Inicialización
onMounted(async () => {
  // Try to load API keys from config file
  try {
    const configModule = await import('/api-config.local.js')
    if (configModule.API_CONFIG) {
      // Set API keys from config if not already in localStorage
      if (configModule.API_CONFIG.gemini && !localStorage.getItem('ai_gemini_key')) {
        localStorage.setItem('ai_gemini_key', configModule.API_CONFIG.gemini)
      }
      if (configModule.API_CONFIG.openai && !localStorage.getItem('ai_openai_key')) {
        localStorage.setItem('ai_openai_key', configModule.API_CONFIG.openai)
      }
    }
  } catch (error) {
    console.warn('API config file not found. Please configure API keys manually in settings.')
  }
  
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