import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// İLK AÇILIŞDA DEFAULT SUPER ADMIN YARAT
const initializeUsers = () => {
  const existingUsers = localStorage.getItem('users')
  
  // Əgər "users" LocalStorage-də yoxdursa, Super Admini yarat
  if (!existingUsers) {
    const defaultUsers = [
      {
        login: 'Tural',
        parol: 'Tural123@',
        rol: 'Admin',
        adSoyad: 'Tural Vəlizadə'
      }
    ]
    localStorage.setItem('users', JSON.stringify(defaultUsers))
    console.log('Super Admin yaradıldı')
  }
}

initializeUsers()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)