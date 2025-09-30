import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'

export const useRoomStore = defineStore('room', {
  state: () => ({
    currentRoom: null,
    rooms: [],
    members: [],
    loading: false,
    socket: null,
    connected: false,
    dbmlContent: ''
  }),

  getters: {
    isRoomOwner: (state) => {
      if (!state.currentRoom || !state.currentRoom.owner_id) return false
      const authStore = useAuthStore()
      return state.currentRoom.owner_id === authStore.user?.id
    },
    
    roomMembers: (state) => state.members,
    hasRoom: (state) => !!state.currentRoom,
    roomCode: (state) => state.currentRoom?.room_code
  },

  actions: {
    // Obtener todas las salas del usuario
    async fetchRooms() {
      this.loading = true
      try {
        const response = await api.get('/rooms')
        
        if (response.data.success) {
          this.rooms = response.data.rooms
          return response.data.rooms
        }
        return []
      } catch (error) {
        console.error('Failed to fetch rooms:', error)
        return []
      } finally {
        this.loading = false
      }
    },

    // Crear nueva sala
    async createRoom(roomData) {
      this.loading = true
      try {
        const response = await api.post('/rooms', roomData)
        
        if (response.data.success) {
          const room = response.data.room
          this.rooms.unshift(room) // Agregar al inicio
          return { success: true, room }
        }
        
        return { success: false, error: 'Failed to create room' }
      } catch (error) {
        const message = error.response?.data?.error || 'Failed to create room'
        return { success: false, error: message }
      } finally {
        this.loading = false
      }
    },

    // Unirse a una sala
    async joinRoom(roomCode) {
      this.loading = true
      try {
        const response = await api.post('/rooms/join', { room_code: roomCode })
        
        if (response.data.success) {
          const room = response.data.room
          // Agregar a las salas si no existe
          const existingRoom = this.rooms.find(r => r.id === room.id)
          if (!existingRoom) {
            this.rooms.unshift(room)
          }
          return { success: true, room }
        }
        
        return { success: false, error: 'Failed to join room' }
      } catch (error) {
        const message = error.response?.data?.error || 'Failed to join room'
        return { success: false, error: message }
      } finally {
        this.loading = false
      }
    },

    // Obtener detalles de una sala específica
    async fetchRoom(roomId) {
      try {
        const response = await api.get(`/rooms/${roomId}`)
        
        if (response.data.success) {
          this.currentRoom = response.data.room
          this.members = response.data.members || []
          this.dbmlContent = response.data.room.dbml_content || ''
          return response.data.room
        }
        
        return null
      } catch (error) {
        console.error('Failed to fetch room:', error)
        return null
      }
    },

    // Salir de una sala
    async leaveRoom(roomId) {
      try {
        const response = await api.delete(`/rooms/${roomId}/leave`)
        
        if (response.data.success) {
          // Remover de la lista local
          this.rooms = this.rooms.filter(r => r.id !== roomId)
          
          // Limpiar sala actual si es la misma
          if (this.currentRoom?.id === roomId) {
            this.clearCurrentRoom()
          }
          
          return { success: true }
        }
        
        return { success: false, error: 'Failed to leave room' }
      } catch (error) {
        const message = error.response?.data?.error || 'Failed to leave room'
        return { success: false, error: message }
      }
    },

    // Actualizar contenido DBML
    async updateDbmlContent(roomId, content) {
      try {
        const response = await api.put(`/rooms/${roomId}/content`, {
          dbml_content: content
        })
        
        if (response.data.success) {
          this.dbmlContent = content
          return { success: true }
        }
        
        return { success: false, error: 'Failed to update content' }
      } catch (error) {
        const message = error.response?.data?.error || 'Failed to update content'
        return { success: false, error: message }
      }
    },

    // WebSocket Actions
    connectToRoom(roomId, token) {
      if (this.socket && this.socket.connected) {
        this.socket.disconnect()
      }

      // Importar socket.io-client dinámicamente
      import('socket.io-client').then(({ io }) => {
        // Configuración dinámica de Socket.IO para desarrollo y producción
        const getSocketURL = () => {
          if (process.env.NODE_ENV === 'production') {
            return process.env.SOCKET_URL || window.location.origin
          }
          return 'http://localhost:3003'
        }

        this.socket = io(getSocketURL(), {
          auth: {
            token: token,
            roomId: roomId
          }
        })

        this.socket.on('connect', () => {
          console.log('Connected to room:', roomId)
          this.connected = true
        })

        this.socket.on('disconnect', () => {
          console.log('Disconnected from room')
          this.connected = false
        })

        this.socket.on('content_updated', (data) => {
          if (data.content !== this.dbmlContent) {
            this.dbmlContent = data.content
          }
        })

        this.socket.on('user_joined', (data) => {
          console.log('User joined:', data.username)
          // Actualizar lista de miembros si es necesario
        })

        this.socket.on('user_left', (data) => {
          console.log('User left:', data.username)
        })

        this.socket.on('error', (error) => {
          console.error('Socket error:', error)
        })
      })
    },

    // Enviar actualización de contenido via WebSocket
    sendContentUpdate(content) {
      if (this.socket && this.connected) {
        this.socket.emit('content_update', { content })
      }
    },

    // Desconectar WebSocket
    disconnect() {
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
        this.connected = false
      }
    },

    // Limpiar sala actual
    clearCurrentRoom() {
      this.currentRoom = null
      this.members = []
      this.dbmlContent = ''
      this.disconnect()
    },

    // Limpiar todo
    clearAll() {
      this.rooms = []
      this.clearCurrentRoom()
    }
  }
})

// Importar auth store para evitar problemas de dependencia circular
import { useAuthStore } from './auth.js'