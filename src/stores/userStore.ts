import { defineStore } from 'pinia'
import api from '@/services/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async signup(username: string, email: string, password: string) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (!emailRegex.test(email)) {
        this.error = 'Correo electrónico no válido'
        return
      }

      if (password.length < 6) {
        this.error = 'La contraseña debe tener al menos 6 caracteres'
        return
      }

      this.loading = true
      this.error = null

      try {
        const res = await api.post('users/signup', { username, email, password })
        this.user = res.data.user
        this.token = res.data.token
        localStorage.setItem('user', JSON.stringify(res.data.user))
        localStorage.setItem('token', res.data.token)
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Error al registrarse'
        console.error('❌ Error en signup:', this.error)
      } finally {
        this.loading = false
      }
    },

    async login(email: string, password: string) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (!emailRegex.test(email)) {
        this.error = 'Correo electrónico no válido'
        return false
      }

      this.loading = true
      this.error = null

      try {
        const res = await api.post('auth/login', { email, password })
        this.user = res.data.user
        this.token = res.data.token
        localStorage.setItem('user', JSON.stringify(res.data.user))
        localStorage.setItem('token', res.data.token)
        return true
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Error al iniciar sesión'
        console.error('❌ Error en login:', this.error)
        return false
      } finally {
        this.loading = false
      }
    },

    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    },
  },

  persist: true,
})
