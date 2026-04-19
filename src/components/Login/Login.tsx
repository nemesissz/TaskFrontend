import { useState } from 'react'
import './Login.css'
import { api } from '../../api/client'

interface User {
  id: string
  login: string
  parol: string
  rol: string
  adSoyad: string
  sonGirisTarixi?: string
}

interface LoginProps {
  onLoginSuccess: (user: User) => void
}

function Login({ onLoginSuccess }: LoginProps) {
  const [login, setLogin] = useState('')
  const [parol, setParol] = useState('')
  const [xeta, setXeta] = useState('')
  const [yuklenir, setYuklenir] = useState(false)

  const handleGiris = async () => {
    if (login === '' || parol === '') {
      setXeta('Zəhmət olmasa bütün sahələri doldurun')
      return
    }

    setYuklenir(true)
    setXeta('')

    try {
      const data = await api.post<{ token: string; user: { id: string; fullName: string; username: string; role: string; lastLoginAt?: string } }>(
        '/api/auth/login',
        { username: login, password: parol }
      )

      localStorage.setItem('authToken', data.token)

      const user: User = {
        id: data.user.id,
        login: data.user.username,
        parol: '',
        rol: data.user.role,
        adSoyad: data.user.fullName,
        sonGirisTarixi: data.user.lastLoginAt
          ? new Date(data.user.lastLoginAt).toLocaleString('az-AZ')
          : undefined
      }

      localStorage.setItem('currentUser', JSON.stringify(user))
      onLoginSuccess(user)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xəta baş verdi'
      setXeta(msg.includes('yanlış') ? 'İstifadəçi adı və ya parol yanlışdır' : 'Serverə qoşulmaq mümkün olmadı')
    } finally {
      setYuklenir(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleGiris()
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <h1 className="login-title">Tapşırıq İdarəetmə Sistemi</h1>

        <div className="login-form">
          <div className="input-group">
            <label>İstifadəçi adı</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Login daxil edin"
            />
          </div>

          <div className="input-group">
            <label>Parol</label>
            <input
              type="password"
              value={parol}
              onChange={(e) => setParol(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Parol daxil edin"
            />
          </div>

          {xeta && <p className="error-message">{xeta}</p>}

          <button className="giris-btn" onClick={handleGiris} disabled={yuklenir}>
            {yuklenir ? 'Daxil olunur...' : 'Giriş'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login
