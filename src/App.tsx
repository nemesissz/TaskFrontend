import { useState } from 'react'
import Login from './components/Login/Login'
import AdminPanel from './components/AdminPanel/AdminPanel'
import Dashboard from './components/Dashboard/Dashboard'

interface User {
  id: string
  login: string
  parol: string
  rol: string
  adSoyad: string
}

type Page = 'adminPanel' | 'dashboard'

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('currentUser')
    const token = localStorage.getItem('authToken')
    if (stored && token) {
      try { return JSON.parse(stored) } catch { return null }
    }
    return null
  })
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user)
    if (user.rol === 'Admin') {
      setCurrentPage('adminPanel')
    } else {
      setCurrentPage('dashboard')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('currentUser')
    setCurrentUser(null)
    setCurrentPage('dashboard')
  }

  const goToDashboard = () => setCurrentPage('dashboard')
  const goToAdminPanel = () => setCurrentPage('adminPanel')

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  if (currentPage === 'adminPanel') {
    return (
      <AdminPanel
        currentUser={currentUser}
        onLogout={handleLogout}
        onGoToDashboard={goToDashboard}
      />
    )
  }

  return (
    <Dashboard
      currentUser={currentUser}
      onLogout={handleLogout}
      onGoToAdminPanel={goToAdminPanel}
    />
  )
}

export default App
