import { reactive } from 'vue'
import { socket, onUserJoined, onUserLeft, onConnectedUsers } from '../boot/socket'

// Colores predefinidos para los avatares de usuarios
const colors = [
  '#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33A8',
  '#33FFF6', '#F3FF33', '#FF8333', '#8333FF', '#33FF99'
]

// Obtener un color aleatorio
function getRandomColor() {
  return colors[Math.floor(Math.random() * colors.length)]
}

// Estado reactivo global para los usuarios conectados
const state = reactive({
  users: [],
  currentUser: {
    id: socket.id || `local-${Math.random().toString(36).substring(2, 9)}`,
    name: 'Usuario Local',
    color: getRandomColor(),
    joinedAt: new Date()
  }
})

// Añadir un usuario a la lista
function addUser(user) {
  if (!state.users.some(u => u.id === user.id)) {
    state.users.push({
      ...user,
      name: user.username || `Usuario ${state.users.length + 1}`,
      color: user.color || getRandomColor(),
      joinedAt: user.joinedAt || new Date()
    })
  }
}

// Eliminar un usuario de la lista
function removeUser(userId) {
  const index = state.users.findIndex(user => user.id === userId)
  if (index !== -1) {
    state.users.splice(index, 1)
  }
}

// Inicializar escuchadores de eventos de socket
function initListeners() {
  // Cuando un usuario se une
  onUserJoined((data) => {
    console.log(`Usuario conectado: ${data.userId}`)
    addUser({
      id: data.userId,
      joinedAt: new Date()
    })
  })

  // Cuando un usuario se desconecta
  onUserLeft((data) => {
    console.log(`Usuario desconectado: ${data.userId}`)
    removeUser(data.userId)
  })

  // Cuando recibimos la lista de usuarios conectados
  onConnectedUsers((data) => {
    console.log('Lista de usuarios conectados:', data.users)
    data.users.forEach(user => {
      addUser({
        id: user.userId,
        joinedAt: new Date()
      })
    })
  })

  // Asegurémonos de que el usuario actual esté en la lista
  addUser(state.currentUser)
}

// Exportar todo lo que necesitamos
export default {
  state,
  addUser,
  removeUser,
  initListeners,
  getRandomColor
}
