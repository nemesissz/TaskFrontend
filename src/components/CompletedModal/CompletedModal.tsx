import { useState } from 'react'
import { FaTimes, FaCheckCircle, FaSearch } from 'react-icons/fa'
import type { NewTask } from '../TaskModal/TaskModal'
import './CompletedModal.css'

interface User {
  id: string
  login: string
  parol: string
  rol: string
  adSoyad: string
}

interface CompletedModalProps {
  isOpen: boolean
  onClose: () => void
  completedTasks: NewTask[]
  currentUser: User
  onTaskClick: (task: NewTask) => void
}

function CompletedModal({ isOpen, onClose, completedTasks, currentUser, onTaskClick }: CompletedModalProps) {
  const [adAxtaris, setAdAxtaris] = useState('')
  const [qeydAxtaris, setQeydAxtaris] = useState('')

  if (!isOpen) return null

  const getEtiket = (task: NewTask): string => {
    const meneQoyulan = task.secilmisShexsler.some(s => s.login === currentUser.login)
    const menimQoydugum = task.verenLogin === currentUser.login
    if (meneQoyulan && menimQoydugum) return 'Özünə qoymusan'
    if (meneQoyulan) return 'Sənə qoyulub'
    return 'Sən qoymusan'
  }

  const getEtiketClass = (task: NewTask): string => {
    const meneQoyulan = task.secilmisShexsler.some(s => s.login === currentUser.login)
    const menimQoydugum = task.verenLogin === currentUser.login
    if (meneQoyulan && menimQoydugum) return 'etiket-ozune'
    if (meneQoyulan) return 'etiket-sene'
    return 'etiket-sen'
  }

  // Filtrləmə - ad və qeydə görə
  const filteredTasks = completedTasks.filter(task => {
    const adUygun = task.tapsirigAdi.toLowerCase().includes(adAxtaris.toLowerCase())
    const qeydUygun = task.qeyd.toLowerCase().includes(qeydAxtaris.toLowerCase())
    return adUygun && qeydUygun
  })

  return (
    <div className="completed-overlay" onClick={onClose}>
      <div className="completed-box" onClick={e => e.stopPropagation()}>

        {/* BAŞLIQ */}
        <div className="completed-header">
          <div className="completed-header-left">
            <FaCheckCircle className="completed-header-icon" />
            <h3>Tamamlanmış tapşırıqlar</h3>
            <span className="completed-sayi">{completedTasks.length}</span>
          </div>
          <button className="completed-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* AXTARIŞ */}
        <div className="completed-axtaris">
          <div className="axtaris-group">
            <div className="axtaris-input-box">
              <FaSearch className="axtaris-icon" />
              <input
                type="text"
                value={adAxtaris}
                onChange={e => setAdAxtaris(e.target.value)}
                placeholder="Tapşırıq adına görə axtar..."
              />
              {adAxtaris && (
                <button className="axtaris-temizle" onClick={() => setAdAxtaris('')}>
                  <FaTimes />
                </button>
              )}
            </div>
          </div>

          <div className="axtaris-group">
            <div className="axtaris-input-box">
              <FaSearch className="axtaris-icon" />
              <input
                type="text"
                value={qeydAxtaris}
                onChange={e => setQeydAxtaris(e.target.value)}
                placeholder="Qeydə görə axtar..."
              />
              {qeydAxtaris && (
                <button className="axtaris-temizle" onClick={() => setQeydAxtaris('')}>
                  <FaTimes />
                </button>
              )}
            </div>
          </div>

          {/* NƏTİCƏ SAYI */}
          {(adAxtaris || qeydAxtaris) && (
            <p className="axtaris-netice">
              {filteredTasks.length} nəticə tapıldı
            </p>
          )}
        </div>

        {/* İÇƏRİK */}
        <div className="completed-body">
          {completedTasks.length === 0 ? (
            <div className="completed-bos">
              <FaCheckCircle className="completed-bos-icon" />
              <p>Hələ tamamlanmış tapşırıq yoxdur</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="completed-bos">
              <FaSearch className="completed-bos-icon" style={{ color: '#8BB8B5' }} />
              <p>Axtarış nəticəsi tapılmadı</p>
            </div>
          ) : (
            <div className="completed-list">
              {filteredTasks.map(task => (
                <div
                  key={task.id}
                  className="completed-item"
                  onClick={() => onTaskClick(task)}
                >
                  <div className="completed-item-header">
                    <FaCheckCircle className="completed-check-icon" />
                    <span className="completed-item-ad">{task.tapsirigAdi}</span>
                    <span className={`etiket ${getEtiketClass(task)}`}>
                      {getEtiket(task)}
                    </span>
                  </div>

                  <div className="completed-item-details">
                    <div className="completed-detail-row">
                      <span className="completed-label">Verən:</span>
                      <span className="completed-value">{task.veren}</span>
                    </div>
                    <div className="completed-detail-row">
                      <span className="completed-label">Son tarix:</span>
                      <span className="completed-value">{task.deadline}</span>
                    </div>
                    {task.tamamlanmaTarixi && (
                      <div className="completed-detail-row">
                        <span className="completed-label">Tamamlandı:</span>
                        <span className="completed-value green">{task.tamamlanmaTarixi}</span>
                      </div>
                    )}
                    {task.qeyd && (
                      <div className="completed-detail-row">
                        <span className="completed-label">Qeyd:</span>
                        <span className="completed-value">{task.qeyd}</span>
                      </div>
                    )}
                    <div className="completed-detail-row">
                      <span className="completed-label">İcraçılar:</span>
                      <div className="completed-shexsler">
                        {task.secilmisShexsler.map(s => (
                          <div
                            key={s.login}
                            className={`completed-kvadrat status-${s.status || 'gozlenir'}`}
                          >
                            {s.adSoyad}
                          </div>
                        ))}
                      </div>
                    </div>
                    {task.mesajlar && task.mesajlar.length > 0 && (
                      <div className="completed-detail-row">
                        <span className="completed-label">Qeydlər:</span>
                        <span className="completed-value">{task.mesajlar.length} qeyd var</span>
                      </div>
                    )}
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

export default CompletedModal