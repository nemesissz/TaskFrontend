import { useState, useEffect } from 'react'
import { FaTimes, FaCloudUploadAlt, FaTrash, FaCalendarAlt } from 'react-icons/fa'
import './TaskModal.css'
import { api, mapStatus } from '../../api/client'

interface User {
  id: string
  login: string
  parol: string
  rol: string
  adSoyad: string
}

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: User
  onSave: (task: NewTask) => void
}

export interface ShexsStatus {
  userId?: string
  login: string
  adSoyad: string
  icraEdilib: boolean
  status?: 'gozlenir' | 'icrada' | 'tamamlandi'
}

export interface FileData {
  name: string
  size: number
  type: string
  base64: string
}

export interface Mesaj {
  id: string
  yazanLogin: string
  yazanAd: string
  metn: string
  tarix: string
}

export interface NewTask {
  id: string
  tapsirigAdi: string
  qeyd: string
  veren: string
  verenLogin: string
  secilmisShexsler: ShexsStatus[]
  deadline: string
  fayllar: FileData[]
  tarix: string
  tamamlanib: boolean
  tamamlanmaTarixi?: string
  mesajlar?: Mesaj[]
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Backend task DTO-sunu NewTask formatına çevirir
export const mapBackendTask = (t: {
  id: string; title: string; note?: string; creatorName: string; creatorLogin: string;
  assignees: Array<{ userId: string; fullName: string; login: string; status: string }>;
  deadline?: string; files: Array<{ id: string; fileName: string; fileSize: number; contentType: string; base64Data: string }>;
  createdAt: string; isCompleted: boolean; completedAt?: string;
  comments?: Array<{ id: string; authorLogin: string; authorName: string; text: string; createdAt: string }>
}): NewTask => ({
  id: t.id,
  tapsirigAdi: t.title,
  qeyd: t.note ?? '',
  veren: t.creatorName,
  verenLogin: t.creatorLogin,
  secilmisShexsler: t.assignees.map(a => ({
    userId: a.userId,
    login: a.login,
    adSoyad: a.fullName,
    icraEdilib: a.status === 'Completed',
    status: mapStatus(a.status)
  })),
  deadline: t.deadline ? t.deadline.split('T')[0] : '',
  fayllar: (t.files || []).map(f => ({
    name: f.fileName,
    size: f.fileSize,
    type: f.contentType,
    base64: f.base64Data
  })),
  tarix: new Date(t.createdAt).toLocaleString('az-AZ'),
  tamamlanib: t.isCompleted,
  tamamlanmaTarixi: t.completedAt ? new Date(t.completedAt).toLocaleDateString('az-AZ') : undefined,
  mesajlar: (t.comments || []).map(c => ({
    id: c.id,
    yazanLogin: c.authorLogin,
    yazanAd: c.authorName,
    metn: c.text,
    tarix: new Date(c.createdAt).toLocaleString('az-AZ')
  }))
})

function TaskModal({ isOpen, onClose, currentUser, onSave }: TaskModalProps) {
  const [tapsirigAdi, setTapsirigAdi] = useState('')
  const [qeyd, setQeyd] = useState('')
  const [secilmisIds, setSecilmisIds] = useState<string[]>([])
  const [deadline, setDeadline] = useState('')
  const [fayllar, setFayllar] = useState<FileData[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [xeta, setXeta] = useState('')
  const [yuklenir, setYuklenir] = useState(false)

  useEffect(() => {
    if (isOpen) {
      api.get<Array<{ id: string; username: string; fullName: string; role: string }>>('/api/users')
        .then(data => {
          const others = data
            .filter(u => u.username !== currentUser.login)
            .map(u => ({ id: u.id, login: u.username, parol: '', rol: u.role, adSoyad: u.fullName }))
          setUsers(others)
        })
        .catch(() => setUsers([]))

      setTapsirigAdi('')
      setQeyd('')
      setSecilmisIds([])
      setDeadline('')
      setFayllar([])
      setXeta('')
    }
  }, [isOpen, currentUser.login])

  const toggleShexs = (id: string) => {
    setSecilmisIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (secilmisIds.length === users.length) {
      setSecilmisIds([])
    } else {
      setSecilmisIds(users.map(u => u.id))
    }
  }

  const handleFileAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setYuklenir(true)
    const newFiles: FileData[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size > 2 * 1024 * 1024) {
        setXeta(`"${file.name}" 2MB-dan böyükdür.`)
        continue
      }
      const base64 = await fileToBase64(file)
      newFiles.push({ name: file.name, size: file.size, type: file.type, base64 })
    }

    setFayllar(prev => [...prev, ...newFiles])
    setYuklenir(false)
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setFayllar(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleSave = async () => {
    if (!tapsirigAdi.trim()) { setXeta('Tapşırığın adını daxil edin'); return }
    if (secilmisIds.length === 0) { setXeta('Ən azı bir şəxs seçin'); return }
    if (!deadline) { setXeta('Son tarixi seçin'); return }

    setYuklenir(true)
    try {
      const result = await api.post<{
        id: string; title: string; note?: string; creatorName: string; creatorLogin: string;
        assignees: Array<{ userId: string; fullName: string; login: string; status: string }>;
        deadline?: string; files: Array<{ id: string; fileName: string; fileSize: number; contentType: string; base64Data: string }>;
        createdAt: string; isCompleted: boolean; completedAt?: string; comments: []
      }>('/api/tasks', {
        title: tapsirigAdi.trim(),
        note: qeyd.trim(),
        assigneeIds: secilmisIds,
        deadline: deadline,
        files: fayllar.map(f => ({ fileName: f.name, fileSize: f.size, contentType: f.type, base64Data: f.base64 }))
      })

      onSave(mapBackendTask(result))
      onClose()
    } catch (err) {
      setXeta(err instanceof Error ? err.message : 'Xəta baş verdi')
    } finally {
      setYuklenir(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="task-modal-overlay" onClick={onClose}>
      <div className="task-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="task-modal-header">
          <h3>Yeni tapşırıq yarat</h3>
          <button className="task-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="task-modal-body">
          <div className="task-form-group">
            <label>Tapşırığı verən</label>
            <div className="veren-box">
              {currentUser.adSoyad} ({currentUser.rol})
            </div>
          </div>

          <div className="task-form-group">
            <label>Tapşırığın adı *</label>
            <input
              type="text"
              value={tapsirigAdi}
              onChange={(e) => setTapsirigAdi(e.target.value)}
              placeholder="Tapşırığın adını daxil edin"
            />
          </div>

          <div className="task-form-group">
            <label>Qeyd</label>
            <textarea
              value={qeyd}
              onChange={(e) => setQeyd(e.target.value)}
              placeholder="Əlavə qeydlər yazın..."
            />
          </div>

          <div className="task-form-group">
            <label>Tapşırıq qoyulan şəxslər * ({secilmisIds.length} seçilib)</label>
            <div className="shexsler-list">
              {users.length === 0 ? (
                <p className="no-users">Başqa istifadəçi yoxdur</p>
              ) : (
                <>
                  <div className="shexs-item select-all" onClick={toggleAll}>
                    <input
                      type="checkbox"
                      checked={secilmisIds.length === users.length && users.length > 0}
                      readOnly
                    />
                    <span className="shexs-name">Hamısını seç</span>
                  </div>
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className={`shexs-item ${secilmisIds.includes(user.id) ? 'selected' : ''}`}
                      onClick={() => toggleShexs(user.id)}
                    >
                      <input type="checkbox" checked={secilmisIds.includes(user.id)} readOnly />
                      <span className="shexs-name">{user.adSoyad}</span>
                      <span className="shexs-rol">{user.rol}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="deadline-file-row">
            <div className="task-form-group deadline-group">
              <label>
                <FaCalendarAlt className="label-icon" /> Son tarix *
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <div className="task-form-group file-group">
              <label>
                <FaCloudUploadAlt className="label-icon" /> Sənəd / Şəkil (max 2MB)
              </label>
              <div className="file-upload-area">
                <label className="file-upload-btn">
                  <FaCloudUploadAlt /> {yuklenir ? 'Yüklənir...' : 'Fayl seç'}
                  <input
                    type="file"
                    multiple
                    onChange={handleFileAdd}
                    style={{ display: 'none' }}
                    disabled={yuklenir}
                  />
                </label>
                <span className="file-hint">Bir neçə fayl seçə bilərsiniz</span>
              </div>
            </div>
          </div>

          {fayllar.length > 0 && (
            <div className="task-form-group">
              <label>Əlavə olunmuş fayllar ({fayllar.length})</label>
              <div className="files-list">
                {fayllar.map((file, index) => (
                  <div key={index} className="file-item">
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{formatFileSize(file.size)}</span>
                    </div>
                    <button className="file-remove" onClick={() => removeFile(index)}>
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {xeta && <p className="task-form-error">{xeta}</p>}
        </div>

        <div className="task-modal-footer">
          <button className="task-cancel-btn" onClick={onClose}>
            Ləğv et
          </button>
          <button className="task-save-btn" onClick={handleSave} disabled={yuklenir}>
            {yuklenir ? 'Yaradılır...' : 'Tapşırıq yarat'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TaskModal
