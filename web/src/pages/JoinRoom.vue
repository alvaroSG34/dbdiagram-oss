<template>
  <q-page padding class="flex flex-center">
    <div class="column items-center" style="max-width: 500px; width: 100%;">
      <!-- Header -->
      <div class="text-center q-mb-lg">
        <q-icon name="meeting_room" size="60px" color="secondary" />
        <h4 class="text-weight-medium q-mb-sm q-mt-md">Unirse a una Sala</h4>
        <p class="text-grey-6">Ingresa el código de la sala para colaborar</p>
      </div>

      <!-- Form Card -->
      <q-card flat bordered class="full-width q-pa-lg">
        <q-form @submit="joinRoom" @reset="onReset" class="q-gutter-md">
          <!-- Room Code Input -->
          <q-input
            v-model="roomCode"
            label="Código de Sala *"
            hint="Ingresa el código de 8 caracteres"
            outlined
            maxlength="8"
            :rules="[
              val => (val && val.length > 0) || 'El código es requerido',
              val => (val && val.length === 8) || 'El código debe tener 8 caracteres',
              val => /^[A-Z0-9]+$/.test(val) || 'Solo letras mayúsculas y números'
            ]"
            @input="val => roomCode = val.toUpperCase()"
            counter
            class="text-center"
            input-style="text-align: center; font-size: 1.2em; letter-spacing: 0.1em; font-weight: 500;"
          >
            <template v-slot:prepend>
              <q-icon name="vpn_key" />
            </template>
            <template v-slot:append>
              <q-btn
                v-if="roomCode"
                flat
                round
                dense
                icon="clear"
                @click="roomCode = ''"
              />
            </template>
          </q-input>

          <!-- Room Preview -->
          <q-card v-if="roomInfo && !joining" flat bordered class="bg-grey-1">
            <q-card-section>
              <div class="text-subtitle2 text-primary q-mb-sm">
                <q-icon name="info" class="q-mr-sm" />
                Información de la Sala
              </div>
              
              <q-item class="q-pa-none">
                <q-item-section avatar>
                  <q-avatar color="secondary" text-color="white" icon="folder" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium">{{ roomInfo.name }}</q-item-label>
                  <q-item-label caption>{{ roomInfo.description || 'Sin descripción' }}</q-item-label>
                </q-item-section>
              </q-item>

              <div class="row q-mt-sm q-gutter-xs">
                <q-chip
                  size="sm"
                  :color="roomInfo.privacy_type === 'public' ? 'positive' : 'orange'"
                  text-color="white"
                  :icon="roomInfo.privacy_type === 'public' ? 'public' : 'lock'"
                  :label="roomInfo.privacy_type === 'public' ? 'Público' : 'Privado'"
                />
                <q-chip
                  size="sm"
                  color="grey-6"
                  text-color="white"
                  icon="person"
                  :label="`Creado por ${roomInfo.owner_name}`"
                />
              </div>
            </q-card-section>
          </q-card>

          <!-- Error Message -->
          <q-banner v-if="error && !joining" class="bg-negative text-white rounded-borders">
            <template v-slot:avatar>
              <q-icon name="error" />
            </template>
            {{ error }}
          </q-banner>

          <!-- Form Actions -->
          <div class="row q-gutter-sm q-mt-lg">
            <div class="col">
              <q-btn
                label="Cancelar"
                flat
                color="grey"
                class="full-width"
                @click="goBack"
              />
            </div>
            <div class="col">
              <q-btn
                :label="roomInfo ? 'Unirse a la Sala' : 'Buscar Sala'"
                type="submit"
                color="secondary"
                class="full-width"
                :loading="joining || searching"
                :disable="!isValidCode"
              />
            </div>
          </div>
        </q-form>
      </q-card>

      <!-- Help Card -->
      <q-card flat class="q-mt-md full-width" style="background: rgba(156, 39, 176, 0.1);">
        <q-card-section>
          <div class="text-body2">
            <q-icon name="help" color="secondary" class="q-mr-sm" />
            <strong>¿Cómo obtener un código?</strong>
          </div>
          <ul class="text-caption text-grey-7 q-mt-sm q-mb-none">
            <li>El creador de la sala debe compartir el código contigo</li>
            <li>Los códigos tienen exactamente 8 caracteres</li>
            <li>Solo contienen letras mayúsculas y números</li>
            <li>Ejemplo: ABC123XY</li>
          </ul>
        </q-card-section>
      </q-card>

      <!-- Recent Rooms -->
      <q-card v-if="recentRooms.length > 0" flat bordered class="q-mt-md full-width">
        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">
            <q-icon name="history" class="q-mr-sm" />
            Salas Recientes
          </div>
          
          <q-list dense>
            <q-item
              v-for="room in recentRooms"
              :key="room.room_code"
              clickable
              @click="quickJoin(room.room_code)"
              class="rounded-borders q-mb-xs"
            >
              <q-item-section avatar>
                <q-avatar size="sm" color="grey-4" text-color="grey-8" icon="folder" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-caption">{{ room.name }}</q-item-label>
                <q-item-label caption>{{ room.room_code }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" size="sm" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </div>

    <!-- Success Dialog -->
    <q-dialog v-model="showSuccessDialog" persistent>
      <q-card style="min-width: 300px;">
        <q-card-section class="text-center">
          <q-icon name="check_circle" size="60px" color="positive" />
          <div class="text-h6 q-mt-md">¡Unido Exitosamente!</div>
          <div class="text-body2 text-grey-6 q-mt-sm">
            Te has unido a la sala correctamente
          </div>
        </q-card-section>

        <q-card-section v-if="joinedRoom">
          <q-item>
            <q-item-section avatar>
              <q-icon name="folder" color="secondary" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">{{ joinedRoom.name }}</q-item-label>
              <q-item-label caption>{{ joinedRoom.description || 'Sin descripción' }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-card-section>

        <q-card-actions align="center" class="q-pa-lg">
          <q-btn
            label="Ir a la Sala"
            color="secondary"
            @click="goToRoom"
            class="q-mr-sm"
          />
          <q-btn
            label="Ir al Dashboard"
            flat
            color="grey"
            @click="goToDashboard"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useRoomsStore } from 'src/store/rooms'

export default {
  name: 'JoinRoomPage',

  setup() {
    const router = useRouter()
    const $q = useQuasar()
    const roomsStore = useRoomsStore()

    const roomCode = ref('')
    const roomInfo = ref(null)
    const error = ref('')
    const searching = ref(false)
    const joining = ref(false)
    const showSuccessDialog = ref(false)
    const joinedRoom = ref(null)

    // Recent rooms from localStorage
    const recentRooms = ref(JSON.parse(localStorage.getItem('recentRooms') || '[]'))

    const isValidCode = computed(() => {
      return roomCode.value && 
             roomCode.value.length === 8 && 
             /^[A-Z0-9]+$/.test(roomCode.value)
    })

    // Watch for valid room code and fetch info
    watch(roomCode, async (newCode) => {
      if (newCode.length === 8 && /^[A-Z0-9]+$/.test(newCode)) {
        await searchRoom(newCode)
      } else {
        roomInfo.value = null
        error.value = ''
      }
    })

    const searchRoom = async (code) => {
      if (searching.value || joining.value) return
      
      searching.value = true
      error.value = ''
      roomInfo.value = null

      try {
        const result = await roomsStore.getRoomInfo(code)
        
        if (result.success) {
          roomInfo.value = result.room
        } else {
          error.value = result.error
        }
      } catch (err) {
        console.error('Search room error:', err)
        error.value = 'Error al buscar la sala'
      } finally {
        searching.value = false
      }
    }

    const joinRoom = async () => {
      if (!isValidCode.value) {
        if (!roomInfo.value) {
          await searchRoom(roomCode.value)
        }
        return
      }

      if (!roomInfo.value) {
        $q.notify({
          type: 'negative',
          message: 'Primero busca una sala válida',
          position: 'top'
        })
        return
      }

      joining.value = true
      error.value = ''

      try {
        const result = await roomsStore.joinRoomByCode(roomCode.value)
        
        if (result.success) {
          joinedRoom.value = result.room
          
          // Save to recent rooms
          const recent = JSON.parse(localStorage.getItem('recentRooms') || '[]')
          const existing = recent.findIndex(r => r.room_code === result.room.room_code)
          
          if (existing >= 0) {
            recent.splice(existing, 1)
          }
          
          recent.unshift({
            room_code: result.room.room_code,
            name: result.room.name
          })
          
          // Keep only last 5
          recent.splice(5)
          localStorage.setItem('recentRooms', JSON.stringify(recent))
          recentRooms.value = recent

          showSuccessDialog.value = true
          
          $q.notify({
            type: 'positive',
            message: 'Te has unido a la sala exitosamente',
            position: 'top'
          })
        } else {
          error.value = result.error
          $q.notify({
            type: 'negative',
            message: 'Error al unirse a la sala: ' + result.error,
            position: 'top'
          })
        }
      } catch (err) {
        console.error('Join room error:', err)
        error.value = 'Error inesperado al unirse a la sala'
        $q.notify({
          type: 'negative',
          message: 'Error inesperado al unirse a la sala',
          position: 'top'
        })
      } finally {
        joining.value = false
      }
    }

    const quickJoin = (code) => {
      roomCode.value = code
    }

    const onReset = () => {
      roomCode.value = ''
      roomInfo.value = null
      error.value = ''
    }

    const goBack = () => {
      router.go(-1)
    }

    const goToRoom = () => {
      if (joinedRoom.value) {
        router.push(`/room/${joinedRoom.value.room_code}`)
      }
    }

    const goToDashboard = () => {
      router.push('/dashboard')
    }

    return {
      roomCode,
      roomInfo,
      error,
      searching,
      joining,
      showSuccessDialog,
      joinedRoom,
      recentRooms,
      isValidCode,
      joinRoom,
      quickJoin,
      onReset,
      goBack,
      goToRoom,
      goToDashboard
    }
  }
}
</script>

<style lang="scss" scoped>
.q-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

ul {
  padding-left: 16px;
  
  li {
    margin-bottom: 4px;
  }
}

.q-input {
  :deep(.q-field__control) {
    .q-field__native {
      text-transform: uppercase;
    }
  }
}
</style>