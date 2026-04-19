import { useState } from 'react'
import { FaTimes, FaDownload, FaFile, FaFileImage, FaFilePdf, FaFileWord, FaFileExcel, FaPaperclip } from 'react-icons/fa'
import type { NewTask, FileData } from '../TaskModal/TaskModal'
import './TaskDetailModal.css'
import { api, mapStatusToBackend } from '../../api/client'

interface User {
  id: string
  login: string
  parol: string
  rol: string
  adSoyad: string
}

interface TaskDetailModalProps {
  isOpen: boolean
  onClose: () => void
  task: NewTask | null
  currentUser: User
  onUpdateTask: (updatedTask: NewTask) => void
}

function TaskDetailModal({ isOpen, onClose, task, currentUser, onUpdateTask }: TaskDetailModalProps) {
  const [yeniMesaj, setYeniMesaj] = useState('')

  if (!isOpen || !task) return null

  const myStatus = task.secilmisShexsler.find(s => s.login === currentUser.login)

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FaFileImage className="file-type-icon image" />
    if (type === 'application/pdf') return <FaFilePdf className="file-type-icon pdf" />
    if (type.includes('word') || type.includes('document')) return <FaFileWord className="file-type-icon word" />
    if (type.includes('sheet') || type.includes('excel')) return <FaFileExcel className="file-type-icon excel" />
    return <FaFile className="file-type-icon default" />
  }

  const downloadFile = (file: FileData) => {
    const link = document.createElement('a')
    link.href = file.base64
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleMesajGonder = async () => {
    if (!yeniMesaj.trim()) return
    try {
      const comment = await api.post<{ id: string; authorLogin: string; authorName: string; text: string; createdAt: string }>(
        `/api/tasks/${task.id}/comments`,
        { text: yeniMesaj.trim() }
      )
      const newMesaj = {
        id: comment.id,
        yazanLogin: comment.authorLogin,
        yazanAd: comment.authorName,
        metn: comment.text,
        tarix: new Date(comment.createdAt).toLocaleString('az-AZ')
      }
      onUpdateTask({ ...task, mesajlar: [...(task.mesajlar || []), newMesaj] })
      setYeniMesaj('')
    } catch { /* empty */ }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleMesajGonder()
    }
  }

  const handleStatusChange = async (newStatus: 'icrada' | 'tamamlandi') => {
    try {
      await api.patch(`/api/tasks/${task.id}/status`, mapStatusToBackend(newStatus))
      const updatedShexsler = task.secilmisShexsler.map(s =>
        s.login === currentUser.login
          ? { ...s, status: newStatus, icraEdilib: newStatus === 'tamamlandi' }
          : s
      )
      onUpdateTask({ ...task, secilmisShexsler: updatedShexsler })
    } catch { /* empty */ }
  }

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-box" onClick={e => e.stopPropagation()}>
        <div className="detail-header">
          <h3>{task.tapsirigAdi}</h3>
          <button className="detail-close" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="detail-body">
          <div className="detail-info-section">
            <div className="detail-row">
              <span className="detail-label">Verən:</span>
              <span className="detail-value">{task.veren}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Son tarix:</span>
              <span className="detail-value">{task.deadline}</span>
            </div>
            {task.qeyd && (
              <div className="detail-row">
                <span className="detail-label">Qeyd:</span>
                <span className="detail-value">{task.qeyd}</span>
              </div>
            )}
          </div>

          <div className="detail-section">
            <p className="detail-section-title">İcraçılar</p>
            <div className="detail-shexsler">
              {task.secilmisShexsler.map(s => (
                <div key={s.login} className={`detail-kvadrat status-${s.status || 'gozlenir'}`}>
                  {s.adSoyad}
                </div>
              ))}
            </div>
          </div>

          {task.fayllar.length > 0 && (
            <div className="detail-section">
              <p className="detail-section-title">
                <FaPaperclip style={{ marginRight: 6 }} />
                Fayllar ({task.fayllar.length})
              </p>
              <div className="detail-files">
                {task.fayllar.map((file, index) => (
                  <div key={index} className="detail-file-item">
                    <div className="detail-file-left">
                      {getFileIcon(file.type)}
                      <div className="detail-file-info">
                        <span className="detail-file-name">{file.name}</span>
                        <span className="detail-file-size">{formatFileSize(file.size)}</span>
                      </div>
                    </div>
                    <button className="detail-download-btn" onClick={() => downloadFile(file)}>
                      <FaDownload /> Yüklə
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="detail-section">
            <p className="detail-section-title">Qeydlər</p>
            <div className="detail-mesajlar">
              {(!task.mesajlar || task.mesajlar.length === 0) ? (
                <p className="no-mesaj">Hələ qeyd yoxdur</p>
              ) : (
                task.mesajlar.map(m => (
                  <div key={m.id} className={`mesaj-item ${m.yazanLogin === currentUser.login ? 'oz-mesaj' : 'basqa-mesaj'}`}>
                    <div className="mesaj-meta">
                      <span className="mesaj-ad">{m.yazanAd}</span>
                      <span className="mesaj-tarix">{m.tarix}</span>
                    </div>
                    <div className="mesaj-metn">{m.metn}</div>
                  </div>
                ))
              )}
            </div>
            <div className="mesaj-yazma">
              <textarea
                value={yeniMesaj}
                onChange={e => setYeniMesaj(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Qeyd yazın... (Enter ilə göndər)"
              />
              <button className="mesaj-gonder-btn" onClick={handleMesajGonder}>Göndər</button>
            </div>
          </div>
        </div>

        <div className="detail-footer">
          <button className="detail-close-btn" onClick={onClose}>Bağla</button>
          {myStatus && !task.tamamlanib && (
            <div className="detail-status-buttons">
              {(!myStatus.status || myStatus.status === 'gozlenir') && (
                <button className="btn-icraya-gotur" onClick={() => handleStatusChange('icrada')}>
                  İcraya götürdüm
                </button>
              )}
              {myStatus.status === 'icrada' && (
                <button className="btn-icra-etdim" onClick={() => handleStatusChange('tamamlandi')}>
                  İcra etdim
                </button>
              )}
              {myStatus.status === 'tamamlandi' && (
                <span className="tamamlandi-yazisi">✓ Siz icra etdiniz</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskDetailModal
