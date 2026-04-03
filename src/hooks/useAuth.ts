import { useEffect, useState } from 'react'
import api from '@/api/api'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  const checkAuth = async (): Promise<boolean> => {
    try {
      await api.get('auth/check')
      setIsAuthenticated(true)
      return true
    } catch {
      setIsAuthenticated(false)
      return false
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return { isAuthenticated, checkAuth }
}
