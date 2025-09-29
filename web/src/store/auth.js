import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('auth_token'),
    isAuthenticated: false,
    loading: false
  }),

  getters: {
    currentUser: (state) => state.user,
    authToken: (state) => state.token,
    isLoggedIn: (state) => state.isAuthenticated && !!state.token
  },

  actions: {
    async login(credentials) {
      this.loading = true
      try {
        const response = await api.post('/auth/login', credentials)
        
        if (response.data.success) {
          this.token = response.data.token
          this.user = response.data.user
          this.isAuthenticated = true
          
          // Guardar token en localStorage
          localStorage.setItem('auth_token', this.token)
          
          // Configurar header por defecto para futuras requests
          api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
          
          return { success: true, user: this.user }
        }
        
        return { success: false, error: 'Invalid response format' }
      } catch (error) {
        console.error('Login error:', error)
        return { 
          success: false, 
          error: error.response?.data?.error || 'Network error'
        }
      } finally {
        this.loading = false
      }
    },

    async register(userData) {
      this.loading = true
      try {
        const response = await api.post('/auth/register', userData)
        
        if (response.data.success) {
          // Auto-login después del registro
          return await this.login({
            email: userData.email,
            password: userData.password
          })
        }
        
        return { success: false, error: 'Registration failed' }
      } catch (error) {
        console.error('Register error:', error)
        return { 
          success: false, 
          error: error.response?.data?.error || 'Network error'
        }
      } finally {
        this.loading = false
      }
    },

    async fetchProfile() {
      if (!this.token) return

      try {
        const response = await api.get('/auth/profile')
        if (response.data.success) {
          this.user = response.data.user
          this.isAuthenticated = true
        }
      } catch (error) {
        console.error('Profile fetch error:', error)
        this.logout()
      }
    },

    async verifyToken() {
      if (!this.token) return false

      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        const response = await api.post('/auth/verify')
        
        if (response.data.success) {
          await this.fetchProfile()
          return true
        }
        
        this.logout()
        return false
      } catch (error) {
        console.error('Token verification error:', error)
        this.logout()
        return false
      }
    },

    logout() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
      
      // Limpiar localStorage
      localStorage.removeItem('auth_token')
      
      // Remover header de autorización
      delete api.defaults.headers.common['Authorization']
    },

    // Inicialización cuando se carga la app
    async initialize() {
      if (this.token) {
        const isValid = await this.verifyToken()
        return isValid
      }
      return false
    }
  }
})