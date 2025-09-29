import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('auth_token'),
    isAuthenticated: false,
    loading: false
  }),

  getters: {
    currentUser: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated && !!state.token,
    userRole: (state) => state.user?.role || null
  },

  actions: {
    // Inicializar auth desde localStorage
    initAuth() {
      const token = localStorage.getItem('auth_token')
      const userData = localStorage.getItem('user_data')
      
      if (token && userData) {
        try {
          this.token = token
          this.user = JSON.parse(userData)
          this.isAuthenticated = true
        } catch (error) {
          console.error('Error parsing user data:', error)
          this.logout()
        }
      }
    },

    // Login
    async login(credentials) {
      this.loading = true
      try {
        const response = await api.post('/auth/login', credentials)
        
        if (response.data.success) {
          const { user, token } = response.data
          
          // Guardar en store
          this.user = user
          this.token = token
          this.isAuthenticated = true
          
          // Guardar en localStorage
          localStorage.setItem('auth_token', token)
          localStorage.setItem('user_data', JSON.stringify(user))
          
          return { success: true, user }
        }
        
        return { success: false, error: 'Invalid credentials' }
      } catch (error) {
        const message = error.response?.data?.error || 'Login failed'
        return { success: false, error: message }
      } finally {
        this.loading = false
      }
    },

    // Registro
    async register(userData) {
      this.loading = true
      try {
        const response = await api.post('/auth/register', userData)
        
        if (response.data.success) {
          const { user, token } = response.data
          
          // Auto-login después del registro
          this.user = user
          this.token = token
          this.isAuthenticated = true
          
          localStorage.setItem('auth_token', token)
          localStorage.setItem('user_data', JSON.stringify(user))
          
          return { success: true, user }
        }
        
        return { success: false, error: 'Registration failed' }
      } catch (error) {
        const message = error.response?.data?.error || 'Registration failed'
        return { success: false, error: message }
      } finally {
        this.loading = false
      }
    },

    // Logout
    logout() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
      
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
    },

    // Verificar token
    async verifyToken() {
      if (!this.token) return false
      
      try {
        const response = await api.post('/auth/verify')
        return response.data.success || false
      } catch (error) {
        console.error('Token verification failed:', error)
        this.logout()
        return false
      }
    },

    // Obtener perfil actualizado
    async fetchProfile() {
      try {
        const response = await api.get('/auth/profile')
        
        if (response.data.success) {
          this.user = response.data.user
          localStorage.setItem('user_data', JSON.stringify(response.data.user))
          return response.data.user
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      }
    }
  }
})