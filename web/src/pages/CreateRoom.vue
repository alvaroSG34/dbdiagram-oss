<template>
  <q-page padding class="flex flex-center">
    <div class="column items-center" style="max-width: 500px; width: 100%;">
      <!-- Header -->
      <div class="text-center q-mb-lg">
        <q-icon name="add_circle" size="60px" color="primary" />
        <h4 class="text-weight-medium q-mb-sm q-mt-md">Crear Nueva Sala</h4>
        <p class="text-grey-6">Configura tu espacio de trabajo colaborativo</p>
      </div>

      <!-- Form Card -->
      <q-card flat bordered class="full-width q-pa-lg">
        <q-form @submit="createRoom" @reset="onReset" class="q-gutter-md">
          <!-- Room Name -->
          <q-input
            v-model="form.name"
            label="Nombre de la Sala *"
            hint="Un nombre descriptivo para identificar tu sala"
            outlined
            :rules="[
              val => (val && val.length > 0) || 'El nombre es requerido',
              val => (val && val.length >= 3) || 'Mínimo 3 caracteres',
              val => (val && val.length <= 50) || 'Máximo 50 caracteres'
            ]"
            maxlength="50"
            counter
          >
            <template v-slot:prepend>
              <q-icon name="title" />
            </template>
          </q-input>

          <!-- Room Description -->
          <q-input
            v-model="form.description"
            label="Descripción (opcional)"
            hint="Describe el propósito de esta sala"
            type="textarea"
            outlined
            rows="3"
            :rules="[
              val => !val || val.length <= 200 || 'Máximo 200 caracteres'
            ]"
            maxlength="200"
            counter
          >
            <template v-slot:prepend>
              <q-icon name="description" />
            </template>
          </q-input>

          <!-- Privacy Settings -->
          <q-card flat bordered>
            <q-card-section>
              <div class="text-subtitle2 q-mb-sm">
                <q-icon name="security" class="q-mr-sm" />
                Configuración de Privacidad
              </div>
              
              <q-option-group
                v-model="form.privacy"
                :options="privacyOptions"
                color="primary"
              />
            </q-card-section>
          </q-card>

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
                label="Crear Sala"
                type="submit"
                color="primary"
                class="full-width"
                :loading="creating"
                :disable="!isFormValid"
              />
            </div>
          </div>
        </q-form>
      </q-card>

      <!-- Info Card -->
      <q-card flat class="q-mt-md full-width" style="background: rgba(25, 118, 210, 0.1);">
        <q-card-section>
          <div class="text-body2">
            <q-icon name="info" color="primary" class="q-mr-sm" />
            <strong>Información:</strong>
          </div>
          <ul class="text-caption text-grey-7 q-mt-sm q-mb-none">
            <li>Se generará automáticamente un código único para tu sala</li>
            <li>Como creador, tendrás permisos de administrador</li>
            <li>Podrás invitar a otros usuarios compartiendo el código</li>
            <li>Todos los cambios se sincronizarán en tiempo real</li>
          </ul>
        </q-card-section>
      </q-card>
    </div>

    <!-- Success Dialog -->
    <q-dialog v-model="showSuccessDialog" persistent>
      <q-card style="min-width: 300px;">
        <q-card-section class="text-center">
          <q-icon name="check_circle" size="60px" color="positive" />
          <div class="text-h6 q-mt-md">¡Sala Creada!</div>
          <div class="text-body2 text-grey-6 q-mt-sm">
            Tu sala se ha creado exitosamente
          </div>
        </q-card-section>

        <q-card-section v-if="createdRoom">
          <q-item>
            <q-item-section avatar>
              <q-icon name="title" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">{{ createdRoom.name }}</q-item-label>
              <q-item-label caption>Nombre de la sala</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>
              <q-icon name="vpn_key" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">{{ createdRoom.room_code }}</q-item-label>
              <q-item-label caption>Código de sala</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                flat
                round
                dense
                icon="content_copy"
                @click="copyRoomCode"
              />
            </q-item-section>
          </q-item>
        </q-card-section>

        <q-card-actions align="center" class="q-pa-lg">
          <q-btn
            label="Ir a la Sala"
            color="primary"
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useRoomsStore } from 'src/store/rooms'

export default {
  name: 'CreateRoomPage',

  setup() {
    const router = useRouter()
    const $q = useQuasar()
    const roomsStore = useRoomsStore()

    const form = ref({
      name: '',
      description: '',
      privacy: 'public'
    })

    const creating = ref(false)
    const showSuccessDialog = ref(false)
    const createdRoom = ref(null)

    const privacyOptions = [
      {
        label: 'Público',
        value: 'public',
        description: 'Cualquiera con el código puede unirse'
      },
      {
        label: 'Privado',
        value: 'private',
        description: 'Solo usuarios invitados pueden unirse'
      }
    ]

    const isFormValid = computed(() => {
      return form.value.name && 
             form.value.name.length >= 3 && 
             form.value.name.length <= 50 &&
             (!form.value.description || form.value.description.length <= 200)
    })

    const createRoom = async () => {
      if (!isFormValid.value) return

      creating.value = true

      try {
        const result = await roomsStore.createRoom({
          name: form.value.name.trim(),
          description: form.value.description?.trim() || null,
          privacy_type: form.value.privacy
        })

        if (result.success) {
          createdRoom.value = result.room
          showSuccessDialog.value = true
          
          $q.notify({
            type: 'positive',
            message: 'Sala creada exitosamente',
            position: 'top'
          })
        } else {
          $q.notify({
            type: 'negative',
            message: 'Error al crear sala: ' + result.error,
            position: 'top'
          })
        }
      } catch (error) {
        console.error('Create room error:', error)
        $q.notify({
          type: 'negative',
          message: 'Error inesperado al crear la sala',
          position: 'top'
        })
      } finally {
        creating.value = false
      }
    }

    const onReset = () => {
      form.value = {
        name: '',
        description: '',
        privacy: 'public'
      }
    }

    const goBack = () => {
      router.go(-1)
    }

    const copyRoomCode = async () => {
      if (!createdRoom.value) return

      try {
        await navigator.clipboard.writeText(createdRoom.value.room_code)
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

    const goToRoom = () => {
      if (createdRoom.value) {
        router.push(`/room/${createdRoom.value.room_code}`)
      }
    }

    const goToDashboard = () => {
      router.push('/dashboard')
    }

    return {
      form,
      creating,
      showSuccessDialog,
      createdRoom,
      privacyOptions,
      isFormValid,
      createRoom,
      onReset,
      goBack,
      copyRoomCode,
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

.q-option-group {
  :deep(.q-radio) {
    align-items: flex-start;
    
    .q-radio__label {
      line-height: 1.2;
    }
  }
}

ul {
  padding-left: 16px;
  
  li {
    margin-bottom: 4px;
  }
}
</style>