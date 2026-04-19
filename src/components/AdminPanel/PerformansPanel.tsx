import { useState, useEffect } from 'react'
import { FaTimes, FaChartBar, FaTrophy } from 'react-icons/fa'
import './AdminPanel.css'
import { api } from '../../api/client'
import { mapBackendTask } from '../TaskModal/TaskModal'

interface User {
  id: string
  login: string
  parol: string
  rol: string
  adSoyad: string
}

interface PerformansPanelProps {
  users: User[]
  onClose: () => void
}

function PerformansPanel({ users, onClose }: PerformansPanelProps) {
  const [performansData, setPerformansData] = useState<Array<{
    login: string; adSoyad: string; rol: string;
    umumi: number; aktiv: number; tamamlandi: number; faiz: number
  }>>([])

  useEffect(() => {
    api.get<unknown[]>('/api/tasks/all')
      .then((data: any[]) => {
        const allTasks = data.map(mapBackendTask)
        const result = users.map(user => {
          const userTasks = allTasks.filter(t =>
            t.secilmisShexsler.some(s => s.login === user.login)
          )
          const aktiv = userTasks.filter(t => !t.tamamlanib).length
          const tamamlandi = userTasks.filter(t => t.tamamlanib).length
          const umumi = userTasks.length
          const faiz = umumi > 0 ? Math.round((tamamlandi / umumi) * 100) : 0
          return { login: user.login, adSoyad: user.adSoyad, rol: user.rol, umumi, aktiv, tamamlandi, faiz }
        }).sort((a, b) => b.faiz - a.faiz)

        setPerformansData(result)
      })
      .catch(() => setPerformansData([]))
  }, [users])

  const getTrophyColor = (index: number) => {
    if (index === 0) return '#FFD700'
    if (index === 1) return '#C0C0C0'
    if (index === 2) return '#CD7F32'
    return null
  }

  return (
    <div className="performans-bolme">
      <div className="performans-header">
        <h3><FaChartBar style={{ marginRight: 8 }} /> İstifadəçi Performansı</h3>
        <button className="performans-close" onClick={onClose}><FaTimes /></button>
      </div>

      <div className="performans-list">
        {performansData.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#8BB8B5', padding: '20px' }}>Hələ tapşırıq yoxdur</p>
        ) : (
          performansData.map((p, index) => (
            <div key={p.login} className="performans-item">
              <div className="performans-item-left">
                <div className="performans-sira">
                  {getTrophyColor(index) ? (
                    <FaTrophy style={{ color: getTrophyColor(index)!, fontSize: 18 }} />
                  ) : (
                    <span style={{ color: '#8BB8B5', fontSize: 13 }}>#{index + 1}</span>
                  )}
                </div>
                <div className="performans-user-info">
                  <span className="performans-ad">{p.adSoyad}</span>
                  <span className="performans-rol">{p.rol}</span>
                </div>
              </div>
              <div className="performans-stats">
                <div className="performans-stat">
                  <span className="pstat-sayi">{p.umumi}</span>
                  <span className="pstat-ad">Ümumi</span>
                </div>
                <div className="performans-stat">
                  <span className="pstat-sayi aktiv">{p.aktiv}</span>
                  <span className="pstat-ad">Aktiv</span>
                </div>
                <div className="performans-stat">
                  <span className="pstat-sayi tamamlandi">{p.tamamlandi}</span>
                  <span className="pstat-ad">Tamamlandı</span>
                </div>
                <div className="performans-faiz-wrapper">
                  <div className="performans-faiz-bar">
                    <div className="performans-faiz-dolu" style={{ width: `${p.faiz}%` }} />
                  </div>
                  <span className="performans-faiz-metn">{p.faiz}%</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default PerformansPanel
