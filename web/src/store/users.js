import { defineStore } from 'pinia'
import { onUserJoined, onUserLeft, onConnectedUsers } from '../boot/socket'

export const useUsersStore = defineStore('users', {
  state: () => ({
    connectedUsers: [],
    currentUser: null
  }),
  
  getters: {
    totalConnectedUsers: (state) => state.connectedUsers.length,
    otherConnectedUsers: (state) => state.connectedUsers.filter(user => user.id !== state.currentUser?.id)
  },
  
  actions: {
    setCurrentUser(user) {
      this.currentUser = user;
      // Añadir el usuario actual a la lista si no está ya
      if (!this.connectedUsers.some(u => u.id === user.id)) {
        this.connectedUsers.push(user);
      }
    },
    
    addUser(user) {
      if (!this.connectedUsers.some(u => u.id === user.id)) {
        this.connectedUsers.push(user);
      }
    },
    
    removeUser(userId) {
      const index = this.connectedUsers.findIndex(user => user.id === userId);
      if (index !== -1) {
        this.connectedUsers.splice(index, 1);
      }
    },
    
    initializeSocketListeners() {
      onUserJoined((data) => {
        this.addUser({
          id: data.userId,
          name: `Usuario ${this.connectedUsers.length + 1}`,
          color: this.getRandomColor(),
          joinedAt: new Date()
        });
        console.log(`Usuario conectado: ${data.userId}`);
      });
      
      onUserLeft((data) => {
        this.removeUser(data.userId);
        console.log(`Usuario desconectado: ${data.userId}`);
      });
      
      onConnectedUsers((data) => {
        console.log(`Recibida lista de usuarios conectados:`, data);
        // Añadir todos los usuarios de la lista
        data.users.forEach(user => {
          this.addUser({
            id: user.userId,
            name: `Usuario ${this.connectedUsers.length + 1}`,
            color: this.getRandomColor(),
            joinedAt: new Date()
          });
        });
      });
    },
    
    getRandomColor() {
      const colors = [
        '#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33A8',
        '#33FFF6', '#F3FF33', '#FF8333', '#8333FF', '#33FF99'
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    }
  }
})
