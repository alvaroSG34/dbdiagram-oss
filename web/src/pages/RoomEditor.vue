<template>
  <q-layout view="lHh lpr lFf">
    <!-- Header -->
    <q-header elevated class="bg-white text-grey-8 border-bottom">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="arrow_back"
          @click="goBack"
          class="q-mr-sm"
        />

        <q-toolbar-title class="text-weight-medium">
          <div class="row items-center q-gutter-sm">
            <q-icon name="folder" color="primary" />
            <span>{{ roomInfo?.name || 'Cargando...' }}</span>
            <q-chip
              v-if="roomInfo"
              size="sm"
              color="grey-4"
              text-color="grey-8"
              :label="roomInfo.room_code"
            />
          </div>
        </q-toolbar-title>

        <div class="row items-center q-gutter-sm">
          <!-- Connected Users -->
          <q-btn-dropdown
            v-if="connectedUsers.length > 0"
            flat
            dense
            :label="`${connectedUsers.length} conectado${connectedUsers.length !== 1 ? 's' : ''}`"
            icon="people"
          >
            <q-list style="min-width: 200px;">
              <q-item
                v-for="user in connectedUsers"
                :key="user.userId"
              >
                <q-item-section avatar>
                  <q-avatar
                    :color="user.userId === currentUser.id ? 'primary' : 'secondary'"
                    text-color="white"
                    size="sm"
                  >
                    {{ getInitials(user.name) }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>
                    {{ user.name }}
                    <q-chip 
                      v-if="user.userId === currentUser.id"
                      size="xs"
                      color="primary"
                      text-color="white"
                      label="Tú"
                      class="q-ml-xs"
                    />
                  </q-item-label>
                  <q-item-label caption>
                    {{ user.userId === roomInfo?.owner_id ? 'Propietario' : 'Miembro' }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon
                    :name="user.online ? 'circle' : 'radio_button_unchecked'"
                    :color="user.online ? 'positive' : 'grey'"
                    size="sm"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <!-- Sync Status -->
          <q-btn
            flat
            dense
            round
            :icon="syncStatus.icon"
            :color="syncStatus.color"
            :loading="syncing"
          >
            <q-tooltip>{{ syncStatus.text }}</q-tooltip>
          </q-btn>

          <!-- Save Button -->
          <q-btn
            v-if="hasChanges"
            color="primary"
            icon="save"
            label="Guardar"
            @click="saveContent"
            :loading="saving"
          />

          <!-- AI Chat Toggle -->
          <q-btn
            flat
            dense
            round
            icon="smart_toy"
            color="secondary"
            @click="toggleChatPanel"
          >
            <q-tooltip>{{ showChatPanel ? 'Ocultar' : 'Mostrar' }} AI Assistant</q-tooltip>
          </q-btn>

          <!-- Menu -->
          <q-btn
            flat
            dense
            round
            icon="more_vert"
            @click="showInfoDialog = true"
          >
            <q-tooltip>Información de la sala</q-tooltip>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <!-- Main Content -->
    <q-page-container>
      <q-page class="full-height-page">
        <q-splitter v-model="primarySplit" :limits="[10,75]" class="full-height-splitter">
          <template #before>
            <div class="column full-height">
              <div class="col">
                <dbml-editor
                  v-model:source="sourceText"
                  class="full-height"
                />
              </div>
            </div>
          </template>
          <template #after>
            <q-splitter 
              v-if="showChatPanel"
              v-model="secondarySplit" 
              :limits="[25,95]" 
              vertical
              class="full-height-splitter"
            >
              <template #before>
                <div class="column full-height">
                  <div class="col">
                    <dbml-graph
                      :schema="schema"
                      :key="graphRefreshKey"
                      class="full-height"
                    />
                  </div>
                </div>
              </template>
              <template #after>
                <div class="column full-height">
                  <div class="col">
                    <chat-panel
                      class="full-height"
                      @dbml-inserted="onDbmlInserted"
                    />
                  </div>
                </div>
              </template>
            </q-splitter>
            
            <!-- Solo diagrama cuando el chat está oculto -->
            <div v-else class="column full-height">
              <div class="col">
                <dbml-graph
                  :schema="schema"
                  :key="graphRefreshKey"
                  class="full-height"
                />
              </div>
            </div>
          </template>
        </q-splitter>
      </q-page>
    </q-page-container>

    <!-- Room Info Dialog -->
    <q-dialog v-model="showInfoDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Información de la Sala</div>
        </q-card-section>

        <q-card-section v-if="roomInfo">
          <q-list>
            <q-item>
              <q-item-section avatar>
                <q-icon name="title" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ roomInfo.name }}</q-item-label>
                <q-item-label caption>Nombre</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar>
                <q-icon name="vpn_key" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ roomInfo.room_code }}</q-item-label>
                <q-item-label caption>Código de sala</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn flat round dense icon="content_copy" @click="copyRoomCode" />
              </q-item-section>
            </q-item>

            <q-item v-if="roomInfo.description">
              <q-item-section avatar>
                <q-icon name="description" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ roomInfo.description }}</q-item-label>
                <q-item-label caption>Descripción</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar>
                <q-icon name="person" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ roomInfo.owner_name }}</q-item-label>
                <q-item-label caption>Propietario</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar>
                <q-icon name="schedule" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ formatDate(roomInfo.created_at) }}</q-item-label>
                <q-item-label caption>Fecha de creación</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cerrar" color="grey" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/store/auth'
import { useRoomsStore } from 'src/store/rooms'
import { useEditorStore } from 'src/store/editor'
import DbmlEditor from 'src/components/DbmlEditor'
import DbmlGraph from 'src/components/DbmlGraph'
import ChatPanel from 'src/components/ChatPanel'
import io from 'socket.io-client'

export default {
  name: 'RoomEditorPage',
  components: {
    DbmlEditor,
    DbmlGraph,
    ChatPanel
  },

  setup() {
    const route = useRoute()
    const router = useRouter()
    const $q = useQuasar()
    const authStore = useAuthStore()
    const roomsStore = useRoomsStore()
    const editorStore = useEditorStore()

    const roomCode = route.params.roomCode
    const socket = ref(null)
    const loading = ref(true)
    const syncing = ref(false)
    const saving = ref(false)
    const roomInfo = ref(null)
    const dbmlContent = ref('')
    const lastSavedContent = ref('')
    const connectedUsers = ref([])
    const showInfoDialog = ref(false)
    const connectionStatus = ref('disconnected')
    const primarySplit = ref(50)  // División principal: Editor vs (Diagrama + Chat)
    const secondarySplit = ref(70) // División secundaria: Diagrama vs Chat
    const graphRefreshKey = ref(0)
    const showChatPanel = ref(true) // Controla si se muestra el ChatPanel

    // Computed
    const hasChanges = computed(() => {
      return dbmlContent.value !== lastSavedContent.value
    })

    // Usuario mock para desarrollo si no hay usuario autenticado
    const currentUser = computed(() => {
      if (authStore.user) {
        return authStore.user
      } else {
        // Usuario mock para desarrollo
        return {
          id: 'dev-user-' + Math.random().toString(36).substr(2, 9),
          name: 'Usuario Desarrollo',
          email: 'dev@example.com'
        }
      }
    })

    const schema = computed(() => {
      return editorStore.getDatabase?.schemas?.find(x => true)
    })

    const sourceText = computed({
      get: () => {
        const text = editorStore.getSourceText
        console.log('sourceText getter called, returning:', text)
        return text
      },
      set: (src) => {
        console.log('sourceText setter called with:', src)
        editorStore.updateSourceText(src)
      }
    })

    const syncStatus = computed(() => {
      switch (connectionStatus.value) {
        case 'connected':
          return {
            icon: 'cloud_done',
            color: 'positive',
            text: 'Conectado y sincronizado'
          }
        case 'connecting':
          return {
            icon: 'cloud_sync',
            color: 'orange',
            text: 'Conectando...'
          }
        case 'disconnected':
          return {
            icon: 'cloud_off',
            color: 'negative',
            text: 'Desconectado'
          }
        default:
          return {
            icon: 'cloud_queue',
            color: 'grey',
            text: 'Estado desconocido'
          }
      }
    })

    // Socket connection
    const connectToRoom = async () => {
      try {
        connectionStatus.value = 'connecting'
        
        const authToken = localStorage.getItem('auth_token')
        console.log('🔐 Conectando con token:', authToken ? 'Token presente' : 'Sin token')
        
        socket.value = io('http://localhost:3001', {
          auth: {
            token: authToken
          },
          forceNew: true
        })

        socket.value.on('connect', () => {
          console.log('✅ Socket conectado exitosamente')
          connectionStatus.value = 'connected'
          joinRoom()
        })

        socket.value.on('disconnect', () => {
          console.log('❌ Socket desconectado')
          connectionStatus.value = 'disconnected'
        })
        
        socket.value.on('connect_error', (error) => {
          console.error('🚫 Error de conexión socket:', error.message)
          connectionStatus.value = 'disconnected'
        })

        socket.value.on('room-joined', (data) => {
          roomInfo.value = data.room
          const content = data.room.currentContent || ''
          
          console.log('Room joined with content:', content)
          
          // Actualizar estados locales
          dbmlContent.value = content
          lastSavedContent.value = content
          connectedUsers.value = data.connectedUsers || []
          
          // Actualizar el editor store sin watchers
          isUpdatingFromSocket.value = true
          
          // Usar nextTick para asegurar que el DOM esté listo
          nextTick(() => {
            editorStore.updateSourceText(content)
            editorStore.updateDatabase()
            
            // Forzar re-render del gráfico
            setTimeout(() => {
              graphRefreshKey.value++
              isUpdatingFromSocket.value = false
              loading.value = false
              
              console.log('Editor updated with content, sourceText:', editorStore.getSourceText)
            }, 200)
          })
        })

        socket.value.on('user-joined-room', (data) => {
          connectedUsers.value = data.connectedUsers || []
        })

        socket.value.on('user-left-room', (data) => {
          connectedUsers.value = data.connectedUsers || []
        })

        // Handle diagram updates
        socket.value.on('diagram-update', (data) => {
          if (data.userId !== currentUser.value.id) {
            handleDiagramUpdate(data)
          }
        })

        // Handle table position updates
        socket.value.on('table-position-update', (data) => {
          if (data.userId !== currentUser.value.id) {
            handleTablePositionUpdate(data)
          }
        })

        // Handle table group position updates
        socket.value.on('tablegroup-position-update', (data) => {
          if (data.userId !== currentUser.value.id) {
            handleTableGroupPositionUpdate(data)
          }
        })

        // Handle relationship updates
        socket.value.on('relationship-type-update', (data) => {
          if (data.userId !== currentUser.value.id) {
            handleRelationshipUpdate(data)
          }
        })

        // Handle diagram state updates (zoom, pan, position)
        socket.value.on('diagram-state-update', (data) => {
          if (data.userId !== currentUser.value.id) {
            handleDiagramStateUpdate(data)
          }
        })

        socket.value.on('error', (error) => {
          $q.notify({
            type: 'negative',
            message: error.message || 'Error de conexión',
            position: 'top-right'
          })
        })

      } catch (error) {
        connectionStatus.value = 'disconnected'
        $q.notify({
          type: 'negative',
          message: 'Error al conectar con la sala',
          position: 'top-right'
        })
        loading.value = false
      }
    }

    const joinRoom = () => {
      if (socket.value && socket.value.connected) {
        console.log('🚪 Intentando unirse a la sala:', roomCode, 'con usuario:', currentUser.value.name)
        socket.value.emit('join-room', {
          room_code: roomCode,
          user_id: currentUser.value.id,
          username: currentUser.value.name
        })
      } else {
        console.log('⚠️ Socket no conectado, no se puede unir a la sala')
      }
    }

    const handleDiagramUpdate = (data) => {
      if (data.dbml_content) {
        isUpdatingFromSocket.value = true
        dbmlContent.value = data.dbml_content
        editorStore.updateSourceText(data.dbml_content)
        editorStore.updateDatabase()
        graphRefreshKey.value++
        nextTick(() => {
          isUpdatingFromSocket.value = false
        })
      }
    }

    const handleTablePositionUpdate = (data) => {
      if (window.handleTablePositionUpdate) {
        window.handleTablePositionUpdate(data)
      }
    }

    const handleTableGroupPositionUpdate = (data) => {
      if (window.handleTableGroupPositionUpdate) {
        window.handleTableGroupPositionUpdate(data)
      }
    }

    const handleRelationshipUpdate = (data) => {
      if (window.handleRelationshipUpdate) {
        window.handleRelationshipUpdate(data)
      }
    }

    const handleDiagramStateUpdate = (data) => {
      if (window.handleDiagramStateUpdate) {
        window.handleDiagramStateUpdate(data)
      }
    }

    const onContentChange = () => {
      if (socket.value && socket.value.connected) {
        const content = editorStore.getSourceText
        dbmlContent.value = content
        socket.value.emit('diagram-update', {
          room_code: roomCode,
          updateType: 'dbml-code-update',
          dbml_content: content
        })
      }
    }

    const saveContent = async () => {
      try {
        saving.value = true
        
        if (socket.value && socket.value.connected) {
          socket.value.emit('diagram-update', {
            room_code: roomCode,
            updateType: 'dbml-save',
            dbml_content: dbmlContent.value
          })
        }

        lastSavedContent.value = dbmlContent.value
        $q.notify({
          type: 'positive',
          message: 'Contenido guardado',
          position: 'top-right'
        })
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Error al guardar',
          position: 'top-right'
        })
      } finally {
        saving.value = false
      }
    }

    const goBack = () => {
      router.push('/dashboard')
    }

    const copyRoomCode = () => {
      navigator.clipboard.writeText(roomCode)
      $q.notify({
        type: 'positive',
        message: 'Código copiado',
        position: 'top-right'
      })
    }

    const getInitials = (name) => {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString()
    }

    // Flag para evitar bucles infinitos
    const isUpdatingFromSocket = ref(false)

    // Watcher para detectar cambios en el editor y sincronizar con otros usuarios
    watch(() => editorStore.getSourceText, (newContent, oldContent) => {
      if (!isUpdatingFromSocket.value && newContent && newContent !== dbmlContent.value) {
        console.log('🔄 [ROOM-EDITOR] Código DBML cambió, actualizando diagrama...')
        console.log('📝 Contenido anterior:', oldContent?.substring(0, 100) + '...')
        console.log('📝 Contenido nuevo:', newContent?.substring(0, 100) + '...')
        
        dbmlContent.value = newContent
        onContentChange()
        
        // Actualizar la base de datos en el editor store
        editorStore.updateDatabase()
        
        // Forzar actualización del diagrama
        nextTick(() => {
          graphRefreshKey.value++
          console.log('✅ [ROOM-EDITOR] Diagrama forzado a re-render con key:', graphRefreshKey.value)
        })
      }
    })

    // Función global para enviar actualizaciones de diagrama desde otros componentes  
    const sendRoomDiagramUpdate = (updateType, payload) => {
      console.log(`🚀 Enviando ${updateType} desde RoomEditor:`, payload)
      if (socket.value && socket.value.connected && roomCode) {
        
        // Adaptar el payload según el tipo de evento
        let eventData = {
          room_code: roomCode,
          updateType
        }
        
        if (updateType === 'relationship-type-update') {
          // El servidor espera 'relationshipChanges' para este evento
          eventData.relationshipChanges = payload
        } else {
          // Para otros eventos usar 'payload'
          eventData.payload = payload
        }
        
        console.log(`📡 Emitiendo evento ${updateType} con datos:`, eventData)
        socket.value.emit(updateType, eventData)
      } else {
        console.warn('Socket no conectado o sin código de sala')
      }
    }

    // Exponer función globalmente para que otros componentes la usen
    window.sendRoomDiagramUpdate = sendRoomDiagramUpdate

    // Función para manejar la inserción de DBML desde el ChatPanel
    const onDbmlInserted = (data) => {
      console.log('📝 DBML insertado desde ChatPanel:', data)
      
      // Sincronizar con otros usuarios
      if (socket.value && socket.value.connected) {
        socket.value.emit('diagram-update', {
          room_code: roomCode,
          updateType: 'dbml-ai-insert',
          dbml_content: editorStore.getSourceText,
          aiGeneratedData: data
        })
      }
      
      $q.notify({
        type: 'positive',
        message: 'Código DBML insertado y sincronizado',
        position: 'top-right'
      })
    }

    // Función para mostrar/ocultar el ChatPanel
    const toggleChatPanel = () => {
      showChatPanel.value = !showChatPanel.value
      // Ajustar el split secundario cuando se oculta/muestra el chat
      if (showChatPanel.value) {
        secondarySplit.value = 70 // Mostrar chat: 70% diagrama, 30% chat
      } else {
        secondarySplit.value = 100 // Ocultar chat: 100% diagrama
      }
    }

    // Lifecycle
    onMounted(() => {
      console.log('RoomEditor mounted, initial sourceText:', editorStore.getSourceText)
      connectToRoom()
    })

    onBeforeUnmount(() => {
      if (socket.value) {
        socket.value.disconnect()
      }
      // Limpiar función global
      if (window.sendRoomDiagramUpdate) {
        delete window.sendRoomDiagramUpdate
      }
    })

    return {
      loading,
      syncing,
      saving,
      roomInfo,
      dbmlContent,
      connectedUsers,
      showInfoDialog,
      connectionStatus,
      hasChanges,
      schema,
      sourceText,
      syncStatus,
      primarySplit,
      secondarySplit,
      graphRefreshKey,
      showChatPanel,
      currentUser,
      onContentChange,
      saveContent,
      goBack,
      copyRoomCode,
      getInitials,
      formatDate,
      onDbmlInserted,
      toggleChatPanel
    }
  }
}
</script>

<style scoped>
.border-bottom {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.border-right {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.full-height-page {
  height: 100vh;
  min-height: 100vh;
  padding: 0;
  margin: 0;
}

.full-height-splitter {
  height: 100vh;
  min-height: 100vh;
}

.full-height {
  height: 100%;
  min-height: 100%;
  
  :deep(.q-field__control) {
    height: 100%;
  }
  
  :deep(textarea) {
    height: 100% !important;
    resize: none;
  }
  
  :deep(.q-splitter__panel) {
    height: 100vh;
    min-height: 100vh;
  }
  
  :deep(.q-splitter__before),
  :deep(.q-splitter__after) {
    height: 100vh;
    min-height: 100vh;
  }
}
</style>