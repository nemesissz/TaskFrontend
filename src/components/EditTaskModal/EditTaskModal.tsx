import { useState, useEffect } from 'react'
import { FaTimes, FaCloudUploadAlt, FaTrash, FaCalendarAlt, FaSave } from 'react-icons/fa'
import type { NewTask, FileData, ShexsStatus } from '../TaskModal/TaskModal'
import { mapBackendTask } from '../TaskModal/TaskModal'
import './EditTaskModal.css'
import { api } from '../../api/client'

interface User {
  id: string
  login: string
  parol: string
  rol: string
  adSoyad: string
}

interface EditTaskModalProps {
  isOpen: boolean
  onClose: () => void
  task: NewTask | null
  currentUser: User
  onSave: (updatedTask: NewTask) => void
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function EditTaskModal({ isOpen, onClose, task, currentUser, onSave }: EditTaskModalProps) {
  const [editAd, setEditAd] = useState('')
  const [editQeyd, setEditQeyd] = useState('')
  const [editDeadline, setEditDeadline] = useState('')
  const [editFayllar, setEditFayllar] = useState<FileData[]>([])
  const [editShexsler, setEditShexsler] = useState<ShexsStatus[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [yuklenir, setYuklenir] = useState(false)
  const [xeta, setXeta] = useState('')

  useEffect(() => {
    if (isOpen && task) {
      setEditAd(task.tapsirigAdi)
      setEditQeyd(task.qeyd)
      setEditDeadline(task.deadline)
      setEditFayllar([...task.fayllar])
      setEditShexsler([...task.secilmisShexsler])
      setXeta('')

      api.get<Array<{ id: string; username: string; fullName: string; role: string }>>('/api/users')
        .then(data => {
          const others = data
            .filter(u => u.username !== currentUser.login)
            .map(u => ({ id: u.id, login: u.username, parol: '', rol: u.role, adSoyad: u.fullName }))
          setAllUsers(others)
        })
        .catch(() => setAllUsers([]))
    }
  }, [isOpen, task, currentUser.login])

  if (!isOpen || !task) return null

  const toggleShexs = (user: User) => {
    const exists = editShexsler.find(s => s.login === user.login)
    if (exists) {
      if (editShexsler.length === 1) return
      setEditShexsler(prev => prev.filter(s => s.login !== user.login))
    } else {
      setEditShexsler(prev => [...prev, {
        userId: user.id,
        login: user.login,
        adSoyad: user.adSoyad,
        icraEdilib: false,
        status: 'gozlenir' as const
      }])
    }
  }

  const toggleAll = () => {
    if (editShexsler.length === allUsers.length) {
      if (allUsers.length === 1) return
      setEditShexsler([])
    } else {
      setEditShexsler(allUsers.map(u => ({
        userId: u.id,
        login: u.login,
        adSoyad: u.adSoyad,
        icraEdilib: false,
        status: 'gozlenir' as const
      })))
    }
  }

  const handleFileAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setYuklenir(true)
    const newFiles: FileData[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size > 2 * 1024 * 1024) { setXeta(`"${file.name}" 2MB-dan böyükdür`); continue }
      const base64 = await fileToBase64(file)
      newFiles.push({ name: file.name, size: file.size, type: file.type, base64 })
    }
    setEditFayllar(prev => [...prev, ...newFiles])
    setYuklenir(false)
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setEditFayllar(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleSave = async () => {
    if (!editAd.trim()) { setXeta('Tapşırığın adını daxil edin'); return }
    if (!editDeadline) { setXeta('Son tarixi seçin'); return }
    if (editShexsler.length === 0) { setXeta('Ən azı bir icraçı seçin'); return }

    setYuklenir(true)
    try {
      const assigneeIds = editShexsler.map(s => s.userId).filter(Boolean) as string[]
      const result = await api.put<any>(`/api/tasks/${task.id}`, {
        title: editAd.trim(),
        note: editQeyd.trim(),
        assigneeIds,
        deadline: editDeadline,
        files: editFayllar.map(f => ({ fileName: f.name, fileSize: f.size, contentType: f.type, base64Data: f.base64 }))
      })

      onSave(mapBackendTask(result))
      onClose()
    } catch (err) {
      setXeta(err instanceof Error ? err.message : 'Xəta baş verdi')
    } finally {
      setYuklenir(false)
    }
  }

  return (
    <div className="edit-overlay" onClick={onClose}>
      <div className="edit-box" onClick={e => e.stopPropagation()}>
        <div className="edit-header">
          <h3>Tapşırığı redaktə et</h3>
          <button className="edit-close" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="edit-body">
          <div className="edit-form-group">
            <label>Tapşırığı verən</label>
            <div className="edit-veren-box">{currentUser.adSoyad} ({currentUser.rol})</div>
          </div>

          <div className="edit-form-group">
            <label>Tapşırığın adı *</label>
            <input type="text" value={editAd} onChange={e => setEditAd(e.target.value)} placeholder="Tapşırığın adını daxil edin" />
          </div>

          <div className="edit-form-group">
            <label>Qeyd</label>
            <textarea value={editQeyd} onChange={e => setEditQeyd(e.target.value)} placeholder="Əlavə qeydlər yazın..." />
          </div>

          <div className="edit-form-group">
            <label>İcraçılar * ({editShexsler.length} seçilib)</label>
            <div className="edit-shexsler-list">
              {allUsers.length === 0 ? (
                <p className="edit-no-users">Başqa istifadəçi yoxdur</p>
              ) : (
                <>
                  <div className="edit-shexs-item edit-select-all" onClick={toggleAll}>
                    <input type="checkbox" checked={editShexsler.length === allUsers.length && allUsers.length > 0} readOnly />
                    <span className="edit-shexs-name">Hamısını seç</span>
                  </div>
                  {allUsers.map(user => {
                    const selected = editShexsler.some(s => s.login === user.login)
                    return (
                      <div key={user.id} className={`edit-shexs-item ${selected ? 'selected' : ''}`} onClick={() => toggleShexs(user)}>
                        <input type="checkbox" checked={selected} readOnly />
                        <span className="edit-shexs-name">{user.adSoyad}</span>
                        <span className="edit-shexs-rol">{user.rol}</span>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </div>

          <div className="edit-deadline-file-row">
            <div className="edit-form-group edit-deadline-group">
              <label><FaCalendarAlt className="edit-label-icon" /> Son tarix *</label>
              <input type="date" value={editDeadline} onChange={e => setEditDeadline(e.target.value)} />
            </div>
            <div className="edit-form-group edit-file-group">
              <label><FaCloudUploadAlt className="edit-label-icon" /> Sənəd / Şəkil (max 2MB)</label>
              <div className="edit-file-upload-area">
                <label className="edit-file-upload-btn">
                  <FaCloudUploadAlt /> {yuklenir ? 'Yüklənir...' : 'Fayl əlavə et'}
                  <input type="file" multiple onChange={handleFileAdd} style={{ display: 'none' }} disabled={yuklenir} />
                </label>
              </div>
            </div>
          </div>

          {editFayllar.length > 0 && (
            <div className="edit-form-group">
              <label>Əlavə olunmuş fayllar ({editFayllar.length})</label>
              <div className="edit-files-list">
                {editFayllar.map((file, index) => (
                  <div key={index} className="edit-file-item">
                    <div className="edit-file-info">
                      <span className="edit-file-name">{file.name}</span>
                      <span className="edit-file-size">{formatFileSize(file.size)}</span>
                    </div>
                    <button className="edit-file-remove" onClick={() => removeFile(index)}><FaTrash /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {xeta && <p className="edit-xeta">{xeta}</p>}
        </div>

        <div className="edit-footer">
          <button className="edit-cancel-btn" onClick={onClose}>Ləğv et</button>
          <button className="edit-save-btn" onClick={handleSave} disabled={yuklenir}>
            <FaSave /> {yuklenir ? 'Saxlanır...' : 'Yadda saxla'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditTaskModal
