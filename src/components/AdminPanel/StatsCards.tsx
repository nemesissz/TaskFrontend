import { useState, useEffect } from 'react'
import { FaTasks, FaCheckCircle, FaSpinner, FaTimes } from 'react-icons/fa'
import './StatsCards.css'
import { api } from '../../api/client'
import { mapBackendTask } from '../TaskModal/TaskModal'
import type { NewTask } from '../TaskModal/TaskModal'

function StatsCards() {
  const [tasks, setTasks] = useState<NewTask[]>([])
  const [activeModal, setActiveModal] = useState<'all' | 'active' | 'completed' | null>(null)

  useEffect(() => {
    api.get<unknown[]>('/api/tasks/all')
      .then((data: any[]) => setTasks(data.map(mapBackendTask)))
      .catch(() => setTasks([]))
  }, [])

  const allTasks = tasks
  const activeTasks = tasks.filter(t => !t.tamamlanib)
  const completedTasks = tasks.filter(t => t.tamamlanib)

  const getModalTasks = () => {
    if (activeModal === 'all') return allTasks
    if (activeModal === 'active') return activeTasks
    if (activeModal === 'completed') return completedTasks
    return []
  }

  const getModalTitle = () => {
    if (activeModal === 'all') return 'Bütün tapşırıqlar'
    if (activeModal === 'active') return 'Aktiv tapşırıqlar'
    if (activeModal === 'completed') return 'Tamamlanmış tapşırıqlar'
    return ''
  }

  return (
    <>
      <div className="stats-cards">
        <div className="stats-card stats-all" onClick={() => setActiveModal('all')}>
          <div className="stats-icon-box"><FaTasks className="stats-icon" /></div>
          <div className="stats-info">
            <span className="stats-sayi">{allTasks.length}</span>
            <span className="stats-ad">Ümumi tapşırıq</span>
          </div>
        </div>

        <div className="stats-card stats-active" onClick={() => setActiveModal('active')}>
          <div className="stats-icon-box"><FaSpinner className="stats-icon" /></div>
          <div className="stats-info">
            <span className="stats-sayi">{activeTasks.length}</span>
            <span className="stats-ad">Aktiv tapşırıq</span>
          </div>
        </div>

        <div className="stats-card stats-completed" onClick={() => setActiveModal('completed')}>
          <div className="stats-icon-box"><FaCheckCircle className="stats-icon" /></div>
          <div className="stats-info">
            <span className="stats-sayi">{completedTasks.length}</span>
            <span className="stats-ad">Tamamlanmış</span>
          </div>
        </div>
      </div>

      {activeModal && (
        <div className="stats-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="stats-modal-box" onClick={e => e.stopPropagation()}>
            <div className="stats-modal-header">
              <h3>{getModalTitle()} ({getModalTasks().length})</h3>
              <button className="stats-modal-close" onClick={() => setActiveModal(null)}><FaTimes /></button>
            </div>
            <div className="stats-modal-body">
              {getModalTasks().length === 0 ? (
                <p className="stats-bos">Tapşırıq yoxdur</p>
              ) : (
                <div className="stats-task-list">
                  {getModalTasks().map((task, index) => (
                    <div key={task.id} className={`stats-task-item ${task.tamamlanib ? 'tamamlandi' : 'aktiv'}`}>
                      <div className="stats-task-header">
                        <span className="stats-task-no">{index + 1}</span>
                        <span className="stats-task-ad">{task.tapsirigAdi}</span>
                        <span className={`stats-task-status ${task.tamamlanib ? 'status-done' : 'status-active'}`}>
                          {task.tamamlanib ? 'Tamamlandı' : 'Aktiv'}
                        </span>
                      </div>
                      <div className="stats-task-details">
                        <div className="stats-task-row">
                          <span className="stats-task-label">Verən:</span>
                          <span className="stats-task-value">{task.veren}</span>
                        </div>
                        <div className="stats-task-row">
                          <span className="stats-task-label">Son tarix:</span>
                          <span className="stats-task-value">{task.deadline}</span>
                        </div>
                        <div className="stats-task-row">
                          <span className="stats-task-label">İcraçılar:</span>
                          <div className="stats-shexsler">
                            {task.secilmisShexsler.map(s => (
                              <span key={s.login} className={`stats-shexs status-${s.status || 'gozlenir'}`}>
                                {s.adSoyad}
                              </span>
                            ))}
                          </div>
                        </div>
                        {task.tamamlanmaTarixi && (
                          <div className="stats-task-row">
                            <span className="stats-task-label">Tamamlandı:</span>
                            <span className="stats-task-value green">{task.tamamlanmaTarixi}</span>
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
      )}
    </>
  )
}

export default StatsCards
