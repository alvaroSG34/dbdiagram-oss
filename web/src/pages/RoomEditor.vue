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
                    :color="user.userId === authStore.user?.id ? 'primary' : 'secondary'"
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
                      v-if="user.userId === authStore.user?.id"
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
      <div class="full-height">
        <q-splitter v-model="split" :limits="[10,75]" class="full-height">
          <template #before>
            <div class="column full-height">
              <div class="col">
                <q-input
                  v-model="dbmlContent"
                  type="textarea"
                  placeholder="Escribe tu código DBML aquí..."
                  class="full-height"
                  @input="onContentChange"
                />
              </div>
            </div>
          </template>
          <template #after>
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
        </q-splitter>
      </div>
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
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/store/auth'
import { useRoomsStore } from 'src/store/rooms'
import { useEditorStore } from 'src/store/editor'
import DbmlGraph from 'src/components/DbmlGraph'
import io from 'socket.io-client'

export default {
  name: 'RoomEditorPage',
  components: {
    DbmlGraph
  },

  setup() {
    const route = useRoute()
    const router = useRouter()
    const $q = useQuasar()
    const authStore = useAuthStore()
    const roomsStore = useRoomsStore()
    const editorStore = useEditorStore()

    const roomCode = route.params.code
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
    const split = ref(50)
    const graphRefreshKey = ref(0)

    // Computed
    const hasChanges = computed(() => {
      return dbmlContent.value !== lastSavedContent.value
    })

    const schema = computed(() => {
      return editorStore.getDatabase?.schemas?.find(x => true)
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
        
        socket.value = io('http://localhost:3001', {
          auth: {
            token: localStorage.getItem('auth_token')
          },
          forceNew: true
        })

        socket.value.on('connect', () => {
          connectionStatus.value = 'connected'
          joinRoom()
        })

        socket.value.on('disconnect', () => {
          connectionStatus.value = 'disconnected'
        })

        socket.value.on('room-joined', (data) => {
          roomInfo.value = data.room
          dbmlContent.value = data.room.currentContent || ''
          lastSavedContent.value = dbmlContent.value
          connectedUsers.value = data.connectedUsers || []
          loading.value = false
        })

        socket.value.on('user-joined', (data) => {
          connectedUsers.value = data.connectedUsers || []
        })

        socket.value.on('user-left', (data) => {
          connectedUsers.value = data.connectedUsers || []
        })

        // Handle diagram updates
        socket.value.on('diagram-update', (data) => {
          if (data.userId !== authStore.user?.id) {
            handleDiagramUpdate(data)
          }
        })

        // Handle table position updates
        socket.value.on('table-position-update', (data) => {
          if (data.userId !== authStore.user?.id) {
            handleTablePositionUpdate(data)
          }
        })

        // Handle table group position updates
        socket.value.on('tablegroup-position-update', (data) => {
          if (data.userId !== authStore.user?.id) {
            handleTableGroupPositionUpdate(data)
          }
        })

        // Handle relationship updates
        socket.value.on('relationship-type-update', (data) => {
          if (data.userId !== authStore.user?.id) {
            handleRelationshipUpdate(data)
          }
        })

        // Handle diagram state updates (zoom, pan, position)
        socket.value.on('diagram-state-update', (data) => {
          if (data.userId !== authStore.user?.id) {
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
        socket.value.emit('join-room', {
          room_code: roomCode,
          user_id: authStore.user?.id,
          username: authStore.user?.name
        })
      }
    }

    const handleDiagramUpdate = (data) => {
      if (data.dbml_content) {
        dbmlContent.value = data.dbml_content
        editorStore.updateSourceText(data.dbml_content)
        editorStore.updateDatabase()
        graphRefreshKey.value++
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
        socket.value.emit('diagram-update', {
          room_code: roomCode,
          updateType: 'dbml-code-update',
          dbml_content: dbmlContent.value
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

    // Lifecycle
    onMounted(() => {
      connectToRoom()
    })

    onBeforeUnmount(() => {
      if (socket.value) {
        socket.value.disconnect()
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
      syncStatus,
      split,
      graphRefreshKey,
      onContentChange,
      saveContent,
      goBack,
      copyRoomCode,
      getInitials,
      formatDate
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

.full-height {
  height: 100%;
  
  :deep(.q-field__control) {
    height: 100%;
  }
  
  :deep(textarea) {
    height: 100% !important;
    resize: none;
  }
}
</style>