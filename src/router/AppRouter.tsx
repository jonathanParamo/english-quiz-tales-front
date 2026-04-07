import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import HomePage from '@/pages/HomePage'
import StoryPage from '@/pages/StoryPage'
import ProfilePage from '@/pages/ProfilePage'
import AiTutorBubble from '@/components/AiTutorBubble'
import { useUserStore } from '@/store/userStore'
import AdminPage from '@/pages/AdminPage'
import PhrasePairsPage from '@/pages/PharasepairsPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)
  const location = useLocation()
  const { checkAuth } = useAuth()

  useEffect(() => {
    checkAuth().then((ok: boolean) => {
      setAuthed(ok)
      setChecking(false)
    })
  }, [location.pathname])

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ink">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return authed ? <>{children}</> : <Navigate to="/login" replace />
}

export default function AppRouter() {
  const { user } = useUserStore()

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/story/:id"
          element={
            <PrivateRoute>
              <StoryPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/phrase-pairs" element={<PhrasePairsPage />} />
      </Routes>
      {user && <AiTutorBubble />}
    </>
  )
}
