import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'

function App() {
  const auth = useAuth()
  const location = useLocation()

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard/*"
        element={
          auth.isAuthenticated ? (
            <DashboardPage />
          ) : (
            <Navigate to="/login" replace state={{ from: location.pathname }} />
          )
        }
      />
      <Route
        path="*"
        element={<Navigate to={auth.isAuthenticated ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  )
}

export default App
