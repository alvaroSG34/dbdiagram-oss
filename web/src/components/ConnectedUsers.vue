<template>
  <div class="connected-users">
    <q-badge
      class="users-badge"
      :color="badgeColor"
      :label="totalUsers"
      floating
      :title="tooltipText"
      @click="showUsersList = !showUsersList"
    >
      <q-icon name="group" size="xs" class="q-mr-xs" />
    </q-badge>
    
    <q-dialog v-model="showUsersList" position="right">
      <q-card style="width: 300px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Usuarios conectados ({{ totalUsers }})</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        
        <q-separator />
        
        <q-card-section class="scroll" style="max-height: 70vh">
          <q-list>
            <q-item v-for="user in usersService.state.users" :key="user.id">
              <q-item-section avatar>
                <q-avatar :color="user.color" text-color="white">
                  {{ getUserInitials(user.name) }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ user.name }}</q-item-label>
                <q-item-label caption>
                  {{ user.id === usersService.state.currentUser.id ? '(Tú)' : '' }}
                  Conectado: {{ getFormattedTime(user.joinedAt) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import usersService from '../utils/usersService'

const showUsersList = ref(false)

// Calcular el número total de usuarios conectados
const totalUsers = computed(() => usersService.state.users.length)

// Determinar el color del badge según el número de usuarios
const badgeColor = computed(() => {
  if (totalUsers.value === 1) return 'grey'
  if (totalUsers.value <= 3) return 'positive'
  if (totalUsers.value <= 5) return 'warning'
  return 'negative'
})

// Texto para el tooltip
const tooltipText = computed(() => 
  `${totalUsers.value} usuario${totalUsers.value !== 1 ? 's' : ''} conectado${totalUsers.value !== 1 ? 's' : ''}`
)

// Generar iniciales del nombre de usuario (hasta 2 caracteres)
const getUserInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

// Formatear el tiempo de conexión
const getFormattedTime = (date) => {
  if (!date) return 'desconocido'
  
  const now = new Date()
  const joined = new Date(date)
  const diffMs = now - joined
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'ahora mismo'
  if (diffMins < 60) return `hace ${diffMins} min`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `hace ${diffHours} h`
  
  const diffDays = Math.floor(diffHours / 24)
  return `hace ${diffDays} d`
}

onMounted(() => {
  // Inicializar los listeners de socket
  usersService.initListeners()
})

// Versión simplificada que no requiere configuración adicional
</script>

<style lang="scss" scoped>
.connected-users {
  position: relative;
  z-index: 100;
  
  .users-badge {
    display: flex;
    align-items: center;
    padding: 5px 10px;
    border-radius: 16px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s ease;
    
    &:hover {
      transform: scale(1.05);
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
  }
}
</style>
