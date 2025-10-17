import api from '../services/api'

export async function checkAuth(): Promise<boolean> {
  try {
    const res = await api.get('/auth/check')
    return res.status === 200
  } catch {
    return false
  }
}
