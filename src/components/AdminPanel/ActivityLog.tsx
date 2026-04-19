import { useState, useEffect } from 'react'
import { FaTimes, FaHistory, FaSignInAlt, FaPlus, FaCheck, FaEdit, FaTrash } from 'react-icons/fa'
import './AdminPanel.css'
import { api } from '../../api/client'

export interface LogItem {
  id: string
  tip: 'giris' | 'tapsirig_yarat' | 'tapsirig_tamamla' | 'tapsirig_redakte' | 'tapsirig_sil'
  adSoyad: string
  login: string
  metn: string
  tarix: string
}

interface ActivityLogProps {
  onClose: () => void
}

function ActivityLog({ onClose }: ActivityLogProps) {
  const [logs, setLogs] = useState<LogItem[]>([])

  useEffect(() => {
    api.get<Array<{ id: string; type: string; userFullName: string; userLogin: string; description: string; createdAt: string }>>('/api/activitylog')
      .then(data => {
        setLogs(data.map(l => ({
          id: l.id,
          tip: l.type as LogItem['tip'],
          adSoyad: l.userFullName,
          login: l.userLogin,
          metn: l.description,
          tarix: new Date(l.createdAt).toLocaleString('az-AZ')
        })))
      })
      .catch(() => setLogs([]))
  }, [])

  const getIcon = (tip: LogItem['tip']) => {
    switch (tip) {
      case 'giris': return <FaSignInAlt className="log-icon log-giris" />
      case 'tapsirig_yarat': return <FaPlus className="log-icon log-yarat" />
      case 'tapsirig_tamamla': return <FaCheck className="log-icon log-tamamla" />
      case 'tapsirig_redakte': return <FaEdit className="log-icon log-redakte" />
      case 'tapsirig_sil': return <FaTrash className="log-icon log-sil" />
    }
  }

  return (
    <div className="activitylog-bolme">
      <div className="activitylog-header">
        <h3>
          <FaHistory style={{ marginRight: 8 }} />
          Aktivlik Jurnalı
        </h3>
        <button className="performans-close" onClick={onClose}>
          <FaTimes />
        </button>
      </div>

      <div className="activitylog-list">
        {logs.length === 0 ? (
          <p className="activitylog-bos">Hələ heç bir aktivlik qeyd edilməyib</p>
        ) : (
          logs.map(log => (
            <div key={log.id} className="activitylog-item">
              <div className="activitylog-icon-wrapper">
                {getIcon(log.tip)}
              </div>
              <div className="activitylog-info">
                <span className="activitylog-ad">{log.adSoyad}</span>
                <span className="activitylog-metn">{log.metn}</span>
              </div>
              <span className="activitylog-tarix">{log.tarix}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export const addLog = (
  tip: LogItem['tip'],
  _adSoyad: string,
  _login: string,
  metn: string
) => {
  api.post('/api/activitylog', { type: tip, description: metn }).catch(() => {})
}

export default ActivityLog
