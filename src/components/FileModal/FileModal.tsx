import { FaTimes, FaDownload, FaFile, FaFileImage, FaFilePdf, FaFileWord, FaFileExcel } from 'react-icons/fa'
import './FileModal.css'

// Fayl tipi
interface FileData {
  name: string
  size: number
  type: string
  base64: string
}

// Props tipi
interface FileModalProps {
  isOpen: boolean
  onClose: () => void
  fayllar: FileData[]
  tapsirigAdi: string
}

function FileModal({ isOpen, onClose, fayllar, tapsirigAdi }: FileModalProps) {

  // Fayl ölçüsünü oxunaqlı formatda göstər
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // Fayl tipinə görə ikon seç
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FaFileImage className="file-type-icon image" />
    if (type === 'application/pdf') return <FaFilePdf className="file-type-icon pdf" />
    if (type.includes('word') || type.includes('document')) return <FaFileWord className="file-type-icon word" />
    if (type.includes('sheet') || type.includes('excel')) return <FaFileExcel className="file-type-icon excel" />
    return <FaFile className="file-type-icon default" />
  }

  // Faylı yüklə (download)
  const downloadFile = (file: FileData) => {
    const link = document.createElement('a')
    link.href = file.base64
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!isOpen) return null

  return (
    <div className="file-modal-overlay" onClick={onClose}>
      <div className="file-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* BAŞLIQ */}
        <div className="file-modal-header">
          <div className="file-modal-title">
            <h3>Sənədlər</h3>
            <span className="file-modal-subtitle">{tapsirigAdi}</span>
          </div>
          <button className="file-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* FAYL SİYAHISI */}
        <div className="file-modal-body">
          {fayllar.length === 0 ? (
            <p className="no-files">Bu tapşırığa fayl əlavə olunmayıb</p>
          ) : (
            <div className="file-download-list">
              {fayllar.map((file, index) => (
                <div key={index} className="file-download-item">
                  <div className="file-download-left">
                    {getFileIcon(file.type)}
                    <div className="file-download-info">
                      <span className="file-download-name">{file.name}</span>
                      <span className="file-download-size">{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                  <button className="file-download-btn" onClick={() => downloadFile(file)}>
                    <FaDownload /> Yüklə
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FileModal