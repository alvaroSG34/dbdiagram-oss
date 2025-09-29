import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const useRoomsStore = defineStore('rooms', {
  state: () => ({
    rooms: [],
    currentRoom: null,
    loading: false,
    connectedUsers: [],
    socket: null
  }),

  getters: {
    userRooms: (state) => state.rooms,
    activeRoom: (state) => state.currentRoom,
    roomMembers: (state) => state.connectedUsers
  },

  actions: {
    async fetchUserRooms() {
      this.loading = true
      try {
        const response = await api.get('/rooms')
        
        if (response.data.success) {
          this.rooms = response.data.rooms
          return { success: true, rooms: this.rooms }
        }
        
        return { success: false, error: 'Failed to fetch rooms' }
      } catch (error) {
        console.error('Fetch rooms error:', error)
        return { 
          success: false, 
          error: error.response?.data?.error || 'Network error'
        }
      } finally {
        this.loading = false
      }
    },

    async createRoom(roomData) {
      this.loading = true
      try {
        const response = await api.post('/rooms', roomData)
        
        if (response.data.success) {
          const newRoom = response.data.room
          this.rooms.unshift(newRoom)
          return { success: true, room: newRoom }
        }
        
        return { success: false, error: 'Failed to create room' }
      } catch (error) {
        console.error('Create room error:', error)
        return { 
          success: false, 
          error: error.response?.data?.error || 'Network error'
        }
      } finally {
        this.loading = false
      }
    },

    async joinRoomByCode(roomCode) {
      this.loading = true
      try {
        const response = await api.post('/rooms/join', { room_code: roomCode })
        
        if (response.data.success) {
          const room = response.data.room
          // Agregar a la lista si no existe
          const existingRoom = this.rooms.find(r => r.id === room.id)
          if (!existingRoom) {
            this.rooms.unshift(room)
          }
          return { success: true, room }
        }
        
        return { success: false, error: 'Failed to join room' }
      } catch (error) {
        console.error('Join room error:', error)
        return { 
          success: false, 
          error: error.response?.data?.error || 'Network error'
        }
      } finally {
        this.loading = false
      }
    },

    async getRoomInfo(roomCode) {
      try {
        const response = await api.get(`/rooms/${roomCode}`)
        
        if (response.data.success) {
          return { success: true, room: response.data.room }
        }
        
        return { success: false, error: 'Room not found' }
      } catch (error) {
        console.error('Get room info error:', error)
        return { 
          success: false, 
          error: error.response?.data?.error || 'Network error'
        }
      }
    },

    async deleteRoom(roomCode) {
      try {
        const response = await api.delete(`/rooms/${roomCode}`)
        
        if (response.data.success) {
          // Remover de la lista local
          this.rooms = this.rooms.filter(room => room.room_code !== roomCode)
          return { success: true }
        }
        
        return { success: false, error: 'Failed to delete room' }
      } catch (error) {
        console.error('Delete room error:', error)
        return { 
          success: false, 
          error: error.response?.data?.error || 'Network error'
        }
      }
    },

    // WebSocket methods
    setCurrentRoom(room) {
      this.currentRoom = room
    },

    updateConnectedUsers(users) {
      this.connectedUsers = users
    },

    addConnectedUser(user) {
      const existingIndex = this.connectedUsers.findIndex(u => u.userId === user.userId)
      if (existingIndex === -1) {
        this.connectedUsers.push(user)
      }
    },

    removeConnectedUser(userId) {
      this.connectedUsers = this.connectedUsers.filter(u => u.userId !== userId)
    },

    setSocket(socket) {
      this.socket = socket
    },

    clearCurrentRoom() {
      this.currentRoom = null
      this.connectedUsers = []
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
      }
    }
  }
})