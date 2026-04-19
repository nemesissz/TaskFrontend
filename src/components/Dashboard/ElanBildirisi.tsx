import { useState, useEffect } from 'react'
import { FaTimes, FaBullhorn, FaCheck } from 'react-icons/fa'
import { api } from '../../api/client'

interface Elan {
  id: string
  baslig: string
  metn: string
  yaranmaTarixi: string
  oxuyanlar: string[]
  alicilar: string[] | 'hamisi'
}

interface User {
  id: string
  login: string
  parol: string
  rol: string
  adSoyad: string
}

interface ElanBildirisiProps {
  currentUser: User
}

function ElanBildirisi({ currentUser }: ElanBildirisiProps) {
  const [elanlar, setElanlar] = useState<Elan[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    loadElanlar()
  }, [])

  const loadElanlar = async () => {
    try {
      const data = await api.get<Array<{ id: string; title: string; text: string; createdAt: string; isForAll: boolean; recipients: string[]; readByLogins: string[] }>>('/api/announcements')
      const myElanlar = data
        .map(e => ({
          id: e.id,
          baslig: e.title,
          metn: e.text,
          yaranmaTarixi: new Date(e.createdAt).toLocaleString('az-AZ'),
          oxuyanlar: e.readByLogins,
          alicilar: e.isForAll ? 'hamisi' as const : e.recipients
        }))
        .filter(e => !e.oxuyanlar.includes(currentUser.login))

      setElanlar(myElanlar)
      setActiveIndex(0)
    } catch {
      setElanlar([])
    }
  }

  const handleOxudum = async (elanId: string) => {
    try {
      await api.post(`/api/announcements/${elanId}/read`)
      setElanlar(prev => prev.filter(e => e.id !== elanId))
      setActiveIndex(0)
    } catch { /* empty */ }
  }

  const handleHamisiniOxudum = async () => {
    try {
      await Promise.all(elanlar.map(e => api.post(`/api/announcements/${e.id}/read`)))
      setElanlar([])
    } catch { /* empty */ }
  }

  if (elanlar.length === 0) return null

  const activeElan = elanlar[activeIndex]

  return (
    <div className="elan-bildirisi-overlay">
      <div className="elan-bildirisi-box">
        <div className="elan-bildirisi-header">
          <div className="elan-bildirisi-header-left">
            <FaBullhorn className="elan-bildirisi-ikon" />
            <span>Yeni Elan</span>
            {elanlar.length > 1 && (
              <span className="elan-sayi-badge">{elanlar.length} elan</span>
            )}
          </div>
        </div>

        <div className="elan-bildirisi-body">
          <h3 className="elan-bildirisi-baslig">{activeElan.baslig}</h3>
          <p className="elan-bildirisi-metn">{activeElan.metn}</p>
          <span className="elan-bildirisi-tarix">{activeElan.yaranmaTarixi}</span>
        </div>

        {elanlar.length > 1 && (
          <div className="elan-nav">
            {elanlar.map((_, i) => (
              <div key={i} className={`elan-nav-nokta ${i === activeIndex ? 'aktiv' : ''}`} onClick={() => setActiveIndex(i)} />
            ))}
          </div>
        )}

        <div className="elan-bildirisi-footer">
          {elanlar.length > 1 && (
            <button className="elan-hamisi-btn" onClick={handleHamisiniOxudum}>
              <FaCheck /> Hamısını oxudum
            </button>
          )}
          <div className="elan-bildirisi-footer-right">
            {elanlar.length > 1 && activeIndex < elanlar.length - 1 && (
              <button className="elan-novbeti-btn" onClick={() => setActiveIndex(activeIndex + 1)}>
                Növbəti →
              </button>
            )}
            <button className="elan-oxudum-btn" onClick={() => handleOxudum(activeElan.id)}>
              <FaTimes /> Oxudum, bağla
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ElanBildirisi
