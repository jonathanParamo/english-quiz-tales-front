import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../api/api'

interface User {
  id: string
  username: string
  role: string
}

interface UserState {
  user: User | null
  loading: boolean
  error: string | null
  signup: (
    username: string,
    email: string,
    password: string,
    role: 'student' | 'creator',
  ) => Promise<boolean>
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  clearError: () => void
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      error: null,

      signup: async (username, email, password, role) => {
        if (!emailRegex.test(email)) {
          set({ error: 'Correo electrónico no válido' })
          return false
        }
        if (password.length < 6) {
          set({ error: 'La contraseña debe tener al menos 6 caracteres' })
          return false
        }

        set({ loading: true, error: null })
        try {
          const res = await api.post<{ user: User }>('users/signup', {
            username,
            email,
            password,
            role,
          })
          set({ user: res.user, loading: false })
          return true
        } catch (err: any) {
          set({
            error: err.message || 'Error al registrarse',
            loading: false,
          })
          return false
        }
      },

      login: async (email, password) => {
        if (!emailRegex.test(email)) {
          set({ error: 'Correo electrónico no válido' })
          return false
        }

        set({ loading: true, error: null })
        try {
          const res = await api.post<{ user: User }>('auth/login', {
            email,
            password,
          })
          set({ user: res.user, loading: false })
          return true
        } catch (err: any) {
          set({
            error: err.message || 'Credenciales inválidas',
            loading: false,
          })
          return false
        }
      },

      logout: async () => {
        try {
          await api.post('auth/logout', {})
        } catch {
          /* ignorar si falla */
        }
        set({ user: null })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'user-storage', // key en localStorage
      partialize: (state) => ({ user: state.user }), // solo persiste el user
    },
  ),
)
