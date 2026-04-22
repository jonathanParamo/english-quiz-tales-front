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
import PracticePage from '@/pages/PracticePage'
import VideosDictationPage from '@/pages/VideosDictationPage'

const AUTH_ROUTES = ['/login', '/signup']

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

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)
  const { checkAuth } = useAuth()

  useEffect(() => {
    checkAuth().then((ok: boolean) => {
      setAuthed(ok)
      setChecking(false)
    })
  }, [])

  if (checking) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: '#080810' }}
      >
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ background: '#7c5cfc', boxShadow: '0 0 12px #7c5cfc' }}
        />
      </div>
    )
  }

  return authed ? <Navigate to="/home" replace /> : <>{children}</>
}

export default function AppRouter() {
  const { user } = useUserStore()
  const location = useLocation()

  const showBubble = user && !AUTH_ROUTES.includes(location.pathname)

  return (
    <>
      <Routes>
        {/* / → si tiene sesión va a home, si no a login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <SignupPage />
            </PublicOnlyRoute>
          }
        />

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
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/phrase-pairs" element={<PhrasePairsPage />} />
        <Route path="/videos" element={<VideosDictationPage />} />
      </Routes>

      {showBubble && <AiTutorBubble />}
    </>
  )
}
