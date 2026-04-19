import { useState, useEffect } from 'react'
import { FaTimes, FaBullhorn, FaTrash, FaPlus } from 'react-icons/fa'
import './AdminPanel.css'
import { api } from '../../api/client'

interface User {
  id: string
  login: string
  parol: string
  rol: string
  adSoyad: string
}

export interface Elan {
  id: string
  baslig: string
  metn: string
  yaranmaTarixi: string
  oxuyanlar: string[]
  alicilar: string[] | 'hamisi'
}

interface ElanPanelProps {
  users: User[]
  currentUser: User
  onClose: () => void
}

function ElanPanel({ users, currentUser, onClose }: ElanPanelProps) {
  const [baslig, setBaslig] = useState('')
  const [metn, setMetn] = useState('')
  const [secilmisAlicilar, setSecilmisAlicilar] = useState<string[]>([])
  const [hamiseyaGonder, setHamiseyaGonder] = useState(true)
  const [xeta, setXeta] = useState('')
  const [elanlar, setElanlar] = useState<Elan[]>([])

  useEffect(() => {
    loadElanlar()
  }, [])

  const loadElanlar = async () => {
    try {
      const data = await api.get<Array<{ id: string; title: string; text: string; createdAt: string; isForAll: boolean; recipients: string[]; readByLogins: string[] }>>('/api/announcements/all')
      setElanlar(data.map(e => ({
        id: e.id,
        baslig: e.title,
        metn: e.text,
        yaranmaTarixi: new Date(e.createdAt).toLocaleString('az-AZ'),
        oxuyanlar: e.readByLogins,
        alicilar: e.isForAll ? 'hamisi' : e.recipients
      })))
    } catch {
      setElanlar([])
    }
  }

  const toggleAlici = (login: string) => {
    setSecilmisAlicilar(prev =>
      prev.includes(login) ? prev.filter(l => l !== login) : [...prev, login]
    )
  }

  const handleGonder = async () => {
    if (!baslig.trim()) { setXeta('Başlıq daxil edin'); return }
    if (!metn.trim()) { setXeta('Elan mətni daxil edin'); return }
    if (!hamiseyaGonder && secilmisAlicilar.length === 0) { setXeta('Ən azı bir alıcı seçin'); return }

    try {
      await api.post('/api/announcements', {
        title: baslig.trim(),
        text: metn.trim(),
        isForAll: hamiseyaGonder,
        recipientLogins: hamiseyaGonder ? [] : secilmisAlicilar
      })
      setBaslig('')
      setMetn('')
      setSecilmisAlicilar([])
      setXeta('')
      await loadElanlar()
      alert('Elan uğurla göndərildi!')
    } catch (err) {
      setXeta(err instanceof Error ? err.message : 'Xəta baş verdi')
    }
  }

  const handleSil = async (id: string) => {
    if (!window.confirm('Bu elanı silmək istədiyinizə əminsiniz?')) return
    try {
      await api.delete(`/api/announcements/${id}`)
      await loadElanlar()
    } catch { /* empty */ }
  }

  const otherUsers = users.filter(u => u.login !== currentUser.login)

  return (
    <div className="elan-bolme">
      <div className="activitylog-header">
        <h3><FaBullhorn style={{ marginRight: 8 }} /> Elan / Bildiriş</h3>
        <button className="performans-close" onClick={onClose}><FaTimes /></button>
      </div>

      <div className="elan-icerik">
        <div className="elan-form">
          <h4 className="elan-form-baslig">Yeni elan göndər</h4>

          <div className="elan-form-group">
            <label>Başlıq *</label>
            <input type="text" value={baslig} onChange={e => setBaslig(e.target.value)} placeholder="Elanın başlığı..." />
          </div>

          <div className="elan-form-group">
            <label>Mətn *</label>
            <textarea value={metn} onChange={e => setMetn(e.target.value)} placeholder="Elanın mətni..." rows={3} />
          </div>

          <div className="elan-form-group">
            <label>Alıcılar</label>
            <div className="elan-alici-secim">
              <div className={`elan-alici-btn ${hamiseyaGonder ? 'selected' : ''}`} onClick={() => setHamiseyaGonder(true)}>
                Hamısına göndər
              </div>
              <div className={`elan-alici-btn ${!hamiseyaGonder ? 'selected' : ''}`} onClick={() => setHamiseyaGonder(false)}>
                Seçilmişlərə göndər
              </div>
            </div>

            {!hamiseyaGonder && (
              <div className="elan-alici-list">
                {otherUsers.map(user => (
                  <div
                    key={user.id}
                    className={`elan-alici-item ${secilmisAlicilar.includes(user.login) ? 'selected' : ''}`}
                    onClick={() => toggleAlici(user.login)}
                  >
                    <input type="checkbox" checked={secilmisAlicilar.includes(user.login)} readOnly />
                    <span>{user.adSoyad}</span>
                    <span className="elan-alici-rol">{user.rol}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {xeta && <p className="elan-xeta">{xeta}</p>}
          <button className="elan-gonder-btn" onClick={handleGonder}><FaPlus /> Elan göndər</button>
        </div>

        <div className="elan-list-wrapper">
          <h4 className="elan-form-baslig">Göndərilmiş elanlar ({elanlar.length})</h4>
          {elanlar.length === 0 ? (
            <p className="activitylog-bos">Hələ elan göndərilməyib</p>
          ) : (
            <div className="elan-list">
              {elanlar.map(elan => (
                <div key={elan.id} className="elan-item">
                  <div className="elan-item-header">
                    <span className="elan-item-baslig">{elan.baslig}</span>
                    <div className="elan-item-actions">
                      <span className="elan-oxuyan">{elan.oxuyanlar.length} oxudu</span>
                      <button className="elan-sil-btn" onClick={() => handleSil(elan.id)} title="Sil"><FaTrash /></button>
                    </div>
                  </div>
                  <p className="elan-item-metn">{elan.metn}</p>
                  <div className="elan-item-footer">
                    <span className="elan-item-tarix">{elan.yaranmaTarixi}</span>
                    <span className="elan-item-alici">
                      {elan.alicilar === 'hamisi' ? 'Hamısına' : `${(elan.alicilar as string[]).length} nəfərə`} göndərildi
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ElanPanel
