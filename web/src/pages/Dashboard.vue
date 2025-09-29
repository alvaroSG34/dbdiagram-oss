<template>
  <q-page padding>
    <div class="row justify-center">
      <div class="col-12 col-md-8 col-lg-6">
        <!-- Header -->
        <div class="text-center q-mb-lg">
          <h4 class="text-weight-medium q-mb-sm">Mis Salas de Trabajo</h4>
          <p class="text-grey-6">Gestiona tus diagramas colaborativos</p>
        </div>

        <!-- Action Buttons -->
        <div class="row q-gutter-md q-mb-lg">
          <div class="col">
            <q-btn
              color="primary"
              icon="add"
              label="Crear Sala"
              class="full-width"
              size="lg"
              @click="goToCreateRoom"
            />
          </div>
          <div class="col">
            <q-btn
              color="secondary"
              icon="meeting_room"
              label="Unirse a Sala"
              class="full-width"
              size="lg"
              @click="goToJoinRoom"
            />
          </div>
        </div>

        <!-- Loading -->
        <div v-if="roomsStore.loading" class="text-center q-py-lg">
          <q-spinner color="primary" size="40px" />
          <p class="text-grey-6 q-mt-md">Cargando salas...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="roomsStore.rooms.length === 0" class="text-center q-py-xl">
          <q-icon name="folder_open" size="80px" color="grey-4" />
          <h6 class="text-grey-6 q-mt-md q-mb-sm">No tienes salas aún</h6>
          <p class="text-grey-5">Crea tu primera sala o únete a una existente</p>
        </div>

        <!-- Rooms List -->
        <div v-else>
          <q-list bordered separator class="rounded-borders">
            <q-item-label header class="text-weight-medium">
              Mis Salas ({{ roomsStore.rooms.length }})
            </q-item-label>

            <q-item
              v-for="room in roomsStore.rooms"
              :key="room.id"
              clickable
              v-ripple
              @click="openRoom(room)"
              class="q-py-md"
            >
              <q-item-section avatar>
                <q-avatar
                  :color="room.is_owner ? 'primary' : 'secondary'"
                  text-color="white"
                  :icon="room.is_owner ? 'star' : 'group'"
                />
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-medium">
                  {{ room.name }}
                </q-item-label>
                <q-item-label caption lines="2">
                  {{ room.description || 'Sin descripción' }}
                </q-item-label>
                <q-item-label caption>
                  <q-chip
                    :color="room.is_owner ? 'primary' : 'secondary'"
                    text-color="white"
                    size="sm"
                    :label="room.is_owner ? 'Propietario' : 'Miembro'"
                    class="q-mr-sm"
                  />
                  <span class="text-grey-6">
                    Código: {{ room.room_code }}
                  </span>
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <div class="row items-center q-gutter-xs">
                  <q-btn
                    flat
                    round
                    dense
                    icon="content_copy"
                    size="sm"
                    color="grey-6"
                    @click.stop="copyRoomCode(room.room_code)"
                  >
                    <q-tooltip>Copiar código</q-tooltip>
                  </q-btn>

                  <q-btn
                    v-if="room.is_owner"
                    flat
                    round
                    dense
                    icon="delete"
                    size="sm"
                    color="negative"
                    @click.stop="confirmDelete(room)"
                  >
                    <q-tooltip>Eliminar sala</q-tooltip>
                  </q-btn>

                  <q-icon name="chevron_right" color="grey-4" />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- User Info Card -->
        <q-card flat bordered class="q-mt-lg">
          <q-card-section horizontal>
            <q-card-section class="col">
              <div class="text-h6">{{ authStore.user?.name }}</div>
              <div class="text-caption text-grey-6">{{ authStore.user?.email }}</div>
            </q-card-section>
            <q-card-section class="col-auto flex flex-center">
              <q-btn
                flat
                round
                icon="logout"
                color="negative"
                @click="logout"
              >
                <q-tooltip>Cerrar sesión</q-tooltip>
              </q-btn>
            </q-card-section>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Confirmar eliminación</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          ¿Estás seguro de que deseas eliminar la sala "{{ roomToDelete?.name }}"?
          Esta acción no se puede deshacer.
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey" v-close-popup />
          <q-btn
            flat
            label="Eliminar"
            color="negative"
            @click="deleteRoom"
            :loading="deleting"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/store/auth'
import { useRoomsStore } from 'src/store/rooms'

export default {
  name: 'DashboardPage',

  setup() {
    const router = useRouter()
    const $q = useQuasar()
    const authStore = useAuthStore()
    const roomsStore = useRoomsStore()

    const showDeleteDialog = ref(false)
    const roomToDelete = ref(null)
    const deleting = ref(false)

    const fetchRooms = async () => {
      const result = await roomsStore.fetchUserRooms()
      
      if (!result.success) {
        $q.notify({
          type: 'negative',
          message: 'Error al cargar salas: ' + result.error,
          position: 'top'
        })
      }
    }

    const goToCreateRoom = () => {
      router.push('/create-room')
    }

    const goToJoinRoom = () => {
      router.push('/join-room')
    }

    const openRoom = (room) => {
      router.push(`/room/${room.room_code}`)
    }

    const copyRoomCode = async (roomCode) => {
      try {
        await navigator.clipboard.writeText(roomCode)
        $q.notify({
          type: 'positive',
          message: 'Código copiado al portapapeles',
          timeout: 2000,
          position: 'top'
        })
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Error al copiar código',
          position: 'top'
        })
      }
    }

    const confirmDelete = (room) => {
      roomToDelete.value = room
      showDeleteDialog.value = true
    }

    const deleteRoom = async () => {
      if (!roomToDelete.value) return
      
      deleting.value = true
      
      const result = await roomsStore.deleteRoom(roomToDelete.value.room_code)
      
      if (result.success) {
        $q.notify({
          type: 'positive',
          message: 'Sala eliminada correctamente',
          position: 'top'
        })
        showDeleteDialog.value = false
        roomToDelete.value = null
      } else {
        $q.notify({
          type: 'negative',
          message: 'Error al eliminar sala: ' + result.error,
          position: 'top'
        })
      }
      
      deleting.value = false
    }

    const logout = async () => {
      $q.dialog({
        title: 'Cerrar sesión',
        message: '¿Estás seguro de que deseas cerrar sesión?',
        cancel: true,
        persistent: true
      }).onOk(async () => {
        await authStore.logout()
        router.push('/auth/login')
      })
    }

    onMounted(() => {
      fetchRooms()
    })

    return {
      authStore,
      roomsStore,
      showDeleteDialog,
      roomToDelete,
      deleting,
      goToCreateRoom,
      goToJoinRoom,
      openRoom,
      copyRoomCode,
      confirmDelete,
      deleteRoom,
      logout
    }
  }
}
</script>

<style lang="scss" scoped>
.q-item {
  min-height: 80px;
}

.q-chip {
  font-size: 0.75rem;
}

.q-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
}
</style>