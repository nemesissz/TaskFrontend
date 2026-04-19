import { useState, useEffect } from "react";
import {
  FaPlus,
  FaInfoCircle,
  FaRegCircle,
  FaCheckCircle,
  FaEdit,
} from "react-icons/fa";
import Sidebar from "../Sidebar/Sidebar";
import TaskModal from "../TaskModal/TaskModal";
import type { NewTask } from "../TaskModal/TaskModal";
import { mapBackendTask } from "../TaskModal/TaskModal";
import TaskDetailModal from "../TaskDetailModal/TaskDetailModal";
import EditTaskModal from "../EditTaskModal/EditTaskModal";
import CompletedModal from "../CompletedModal/CompletedModal";
import { addLog } from "../AdminPanel/ActivityLog";
import "./Dashboard.css";
import ElanBildirisi from "./ElanBildirisi";
import "./ElanBildirisi.css";
import { api } from "../../api/client";

interface User {
  id: string;
  login: string;
  parol: string;
  rol: string;
  adSoyad: string;
}

interface DashboardProps {
  currentUser: User;
  onLogout: () => void;
  onGoToAdminPanel: () => void;
}

function Dashboard({ currentUser, onLogout, onGoToAdminPanel }: DashboardProps) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [tasks, setTasks] = useState<NewTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<NewTask | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCompletedOpen, setIsCompletedOpen] = useState(false);
  const [checkingTaskId, setCheckingTaskId] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const [mine, assigned] = await Promise.all([
        api.get<unknown[]>('/api/tasks/my'),
        api.get<unknown[]>('/api/tasks/assigned'),
      ]);

      const allById = new Map<string, NewTask>();
      const allRaw = [...(mine as any[]), ...(assigned as any[])];
      for (const t of allRaw) {
        const mapped = mapBackendTask(t);
        allById.set(mapped.id, mapped);
      }

      setTasks(Array.from(allById.values()));
    } catch {
      setTasks([]);
    }
  };

  const handleSaveTask = (task: NewTask) => {
    setTasks(prev => [task, ...prev]);
    addLog("tapsirig_yarat", currentUser.adSoyad, currentUser.login, `"${task.tapsirigAdi}" tapşırığını yaratdı`);
  };

  const handleUpdateTask = (updatedTask: NewTask) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);
  };

  const openDetail = (task: NewTask) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  const openEdit = (e: React.MouseEvent, task: NewTask) => {
    e.stopPropagation();
    setSelectedTask(task);
    setIsEditOpen(true);
  };

  const handleEditSave = (updatedTask: NewTask) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    addLog("tapsirig_redakte", currentUser.adSoyad, currentUser.login, `"${updatedTask.tapsirigAdi}" tapşırığını redaktə etdi`);
  };

  const handleCheckboxClick = (e: React.MouseEvent, task: NewTask) => {
    e.stopPropagation();
    if (task.verenLogin !== currentUser.login) return;
    if (task.tamamlanib) return;

    setCheckingTaskId(task.id);

    setTimeout(async () => {
      try {
        await api.patch(`/api/tasks/${task.id}/complete`);
        setTasks(prev => prev.map(t => {
          if (t.id === task.id) {
            return { ...t, tamamlanib: true, tamamlanmaTarixi: new Date().toLocaleDateString("az-AZ") };
          }
          return t;
        }));
        addLog("tapsirig_tamamla", currentUser.adSoyad, currentUser.login, `"${task.tapsirigAdi}" tapşırığını tamamladı`);
      } catch { /* empty */ }
      setCheckingTaskId(null);
    }, 1500);
  };

  const myActiveTasks = tasks
    .filter(task => {
      const meneQoyulan = task.secilmisShexsler.some(s => s.login === currentUser.login);
      const menimQoydugum = task.verenLogin === currentUser.login;
      return (meneQoyulan || menimQoydugum) && !task.tamamlanib;
    })
    .sort((a, b) => new Date(b.tarix).getTime() - new Date(a.tarix).getTime());

  const myCompletedTasks = tasks.filter(task => {
    const meneQoyulan = task.secilmisShexsler.some(s => s.login === currentUser.login);
    const menimQoydugum = task.verenLogin === currentUser.login;
    return (meneQoyulan || menimQoydugum) && task.tamamlanib;
  });

  const getEtiket = (task: NewTask): string => {
    const meneQoyulan = task.secilmisShexsler.some(s => s.login === currentUser.login);
    const menimQoydugum = task.verenLogin === currentUser.login;
    if (meneQoyulan && menimQoydugum) return "Özünə qoymusan";
    if (meneQoyulan) return "Sənə qoyulub";
    return "Sən qoymusan";
  };

  const getEtiketClass = (task: NewTask): string => {
    const meneQoyulan = task.secilmisShexsler.some(s => s.login === currentUser.login);
    const menimQoydugum = task.verenLogin === currentUser.login;
    if (meneQoyulan && menimQoydugum) return "etiket-ozune";
    if (meneQoyulan) return "etiket-sene";
    return "etiket-sen";
  };

  return (
    <div className="dashboard">
      <Sidebar currentUser={currentUser} onLogout={onLogout} onGoToAdminPanel={onGoToAdminPanel} />

      <main className="main-content">
        <section className="bolme">
          <div className="baslig-sira">
            <h2>Ümumi tapşırıqlar</h2>
            <button className="plus-btn" title="Yeni tapşırıq əlavə et" onClick={() => setIsTaskModalOpen(true)}>
              <FaPlus />
            </button>
          </div>

          <div className="content">
            {myActiveTasks.length === 0 ? (
              <p className="empty-message">Hələ tapşırıq yoxdur</p>
            ) : (
              myActiveTasks.map((task) => (
                <div
                  className={`task-item ${checkingTaskId === task.id ? "checking" : ""}`}
                  key={task.id}
                  style={{ cursor: "pointer" }}
                >
                  <div className="task-header">
                    <div
                      className="checkbox-wrapper"
                      onClick={(e) => handleCheckboxClick(e, task)}
                      title={task.verenLogin === currentUser.login ? "Tamamlandı kimi işarələ" : "Yalnız tapşırığı verən tamamlaya bilər"}
                    >
                      {checkingTaskId === task.id ? (
                        <FaCheckCircle className="checkbox-icon checking-anim" />
                      ) : (
                        <FaRegCircle className={`checkbox-icon ${task.verenLogin === currentUser.login ? "clickable-check" : ""}`} />
                      )}
                    </div>

                    <span className="task-title">{task.tapsirigAdi}</span>

                    <span className={`etiket ${getEtiketClass(task)}`}>
                      {getEtiket(task)}
                    </span>

                    <div className="task-right-icons">
                      {task.verenLogin === currentUser.login && (
                        <FaEdit className="edit-task-icon" title="Redaktə et" onClick={(e) => openEdit(e, task)} />
                      )}
                      <FaInfoCircle className="info-icon" title="Ətraflı məlumat" onClick={() => openDetail(task)} />
                    </div>
                  </div>

                  <div className="task-body">
                    <div className="task-details">
                      <span className="label">Verən:</span>
                      <span className="value">{task.veren}</span>
                    </div>
                    <div className="task-details">
                      <span className="label">Son tarix:</span>
                      <span className="value">{task.deadline}</span>
                    </div>
                    <div className="task-details">
                      <span className="label">İcraçılar:</span>
                      <div className="shexs-kvadratlar">
                        {task.secilmisShexsler.map((s) => {
                          const st = s.status || "gozlenir";
                          return (
                            <div key={s.login} className={`shexs-kvadrat status-${st}`}>
                              {s.adSoyad}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {task.tarix && (
                      <div className="task-details">
                        <span className="label">Yarandı:</span>
                        <span className="value">{task.tarix}</span>
                      </div>
                    )}
                    {task.mesajlar && task.mesajlar.length > 0 && (
                      <div className="task-details">
                        <span className="label">Qeydlər:</span>
                        <span className="value">{task.mesajlar.length} qeyd var</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="footer">
            <button className="tamamlanmis-btn" onClick={() => setIsCompletedOpen(true)}>
              tamamlanmış tapşırıqlar
              {myCompletedTasks.length > 0 && (
                <span className="completed-count">{myCompletedTasks.length}</span>
              )}
            </button>
          </div>
        </section>

        <section className="bolme">
          <div className="baslig-sira">
            <h2>Şəxsi qeydlərim</h2>
            <button className="plus-btn" title="Yeni qeyd əlavə et"><FaPlus /></button>
          </div>
          <div className="content">
            <p className="empty-message">Hələ qeyd yoxdur</p>
          </div>
          <div className="footer">
            <button className="tamamlanmis-btn">tamamlanmış tapşırıqlar</button>
          </div>
        </section>
      </main>

      <TaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} currentUser={currentUser} onSave={handleSaveTask} />

      <TaskDetailModal
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedTask(null); }}
        task={selectedTask}
        currentUser={currentUser}
        onUpdateTask={handleUpdateTask}
      />

      <EditTaskModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setSelectedTask(null); }}
        task={selectedTask}
        currentUser={currentUser}
        onSave={handleEditSave}
      />

      <CompletedModal
        isOpen={isCompletedOpen}
        onClose={() => setIsCompletedOpen(false)}
        completedTasks={myCompletedTasks}
        currentUser={currentUser}
        onTaskClick={(task) => { setIsCompletedOpen(false); setSelectedTask(task); setIsDetailOpen(true); }}
      />

      <ElanBildirisi currentUser={currentUser} />
    </div>
  );
}

export default Dashboard;
