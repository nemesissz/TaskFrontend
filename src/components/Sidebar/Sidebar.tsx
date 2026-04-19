import { FaSignOutAlt, FaUserCircle } from 'react-icons/fa'
import './Sidebar.css'

// İstifadəçi tipi
interface User {
  id: string
  login: string
  parol: string
  rol: string
  adSoyad: string
}

// Props tipi
interface SidebarProps {
  currentUser: User
  onLogout: () => void
  onGoToAdminPanel: () => void
}

function Sidebar({ currentUser, onLogout, onGoToAdminPanel }: SidebarProps) {
  return (
    <aside className="sidebar">
      {/* YUXARI HİSSƏ - İstifadəçi məlumatları */}
      <div className="sidebar-top">
        <FaUserCircle className="avatar-icon" />
        <div className="user-details">
          <span className="user-name">{currentUser.adSoyad}</span>
          <span className="user-role">{currentUser.rol}</span>
        </div>
      </div>

      {/* AŞAĞI HİSSƏ - Düymələr */}
      <div className="sidebar-bottom">
        {currentUser.rol === 'Admin' && (
          <button className="sidebar-btn admin-btn" onClick={onGoToAdminPanel}>
            İdarəetmə
          </button>
        )}
        <button className="sidebar-btn logout-sidebar-btn" onClick={onLogout}>
          <FaSignOutAlt /> Çıxış
        </button>
      </div>
    </aside>
  )
}

export default Sidebar