import { useState, useEffect } from "react";
import {
  FaTrash, FaPlus, FaTimes, FaEdit, FaSearch, FaSave, FaChartBar,
} from "react-icons/fa";
import "./AdminPanel.css";
import StatsCards from "./StatsCards";
import PerformansPanel from "./PerformansPanel";
import ActivityLog from "./ActivityLog";
import ElanPanel from "./ElanPanel";
import { api } from "../../api/client";

interface User {
  id: string;
  login: string;
  parol: string;
  rol: string;
  adSoyad: string;
  sonGirisTarixi?: string;
}

interface AdminPanelProps {
  currentUser: User;
  onLogout: () => void;
  onGoToDashboard: () => void;
}

function AdminPanel({ currentUser, onLogout, onGoToDashboard }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isPerformansOpen, setIsPerformansOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [isElanOpen, setIsElanOpen] = useState(false);
  const [silModalUser, setSilModalUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [newLogin, setNewLogin] = useState("");
  const [newParol, setNewParol] = useState("");
  const [newRol, setNewRol] = useState("İşçi");
  const [newAdSoyad, setNewAdSoyad] = useState("");
  const [formXeta, setFormXeta] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAdSoyad, setEditAdSoyad] = useState("");
  const [editParol, setEditParol] = useState("");
  const [editRol, setEditRol] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.get<Array<{ id: string; username: string; fullName: string; role: string; lastLoginAt?: string }>>('/api/users');
      setUsers(data.map(u => ({
        id: u.id,
        login: u.username,
        parol: '',
        rol: u.role,
        adSoyad: u.fullName,
        sonGirisTarixi: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('az-AZ') : undefined
      })));
    } catch {
      setUsers([]);
    }
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.login.toLowerCase().includes(query) ||
      user.adSoyad.toLowerCase().includes(query) ||
      user.rol.toLowerCase().includes(query)
    );
  });

  const openModal = () => {
    setNewLogin(""); setNewParol(""); setNewRol("İşçi"); setNewAdSoyad(""); setFormXeta("");
    setIsModalOpen(true);
  };

  const handleAddUser = async () => {
    if (!newLogin || !newParol || !newAdSoyad) { setFormXeta("Bütün sahələri doldurun"); return; }
    if (newRol === "Admin") { setFormXeta("Bu rolu seçə bilməzsiniz"); return; }

    try {
      await api.post('/api/auth/register', {
        fullName: newAdSoyad,
        username: newLogin,
        password: newParol,
        role: newRol
      });
      await loadUsers();
      setIsModalOpen(false);
    } catch (err) {
      setFormXeta(err instanceof Error ? err.message : 'Xəta baş verdi');
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) { alert("Özünüzü silə bilməzsiniz"); return; }
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete) setSilModalUser(userToDelete);
  };

  const confirmDelete = async () => {
    if (!silModalUser) return;
    try {
      await api.delete(`/api/users/${silModalUser.id}`);
      await loadUsers();
      setSilModalUser(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Xəta baş verdi');
    }
  };

  const startEdit = (user: User) => {
    if (user.id === currentUser.id) { alert("Özünüzü redaktə edə bilməzsiniz"); return; }
    setEditingId(user.id);
    setEditAdSoyad(user.adSoyad);
    setEditParol('');
    setEditRol(user.rol);
  };

  const cancelEdit = () => {
    setEditingId(null); setEditAdSoyad(""); setEditParol(""); setEditRol("");
  };

  const saveEdit = async () => {
    if (!editAdSoyad) { alert("Ad Soyad boş ola bilməz"); return; }
    if (editRol === "Admin") { alert("Bu rolu seçə bilməzsiniz"); return; }

    try {
      await api.put(`/api/users/${editingId}`, {
        fullName: editAdSoyad,
        role: editRol,
        newPassword: editParol || undefined
      });
      await loadUsers();
      cancelEdit();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Xəta baş verdi');
    }
  };

  return (
    <div className="admin-panel">
      <nav className="admin-navbar">
        <div className="navbar-left"><h2>Admin Panel</h2></div>
        <div className="navbar-right">
          <span className="user-info">{currentUser.adSoyad} ({currentUser.rol})</span>
          <button className="nav-btn" onClick={() => setIsPerformansOpen(!isPerformansOpen)}>
            <FaChartBar style={{ marginRight: 6 }} /> Performans
          </button>
          <button className="nav-btn" onClick={() => setIsActivityLogOpen(!isActivityLogOpen)}>Aktivlik</button>
          <button className="nav-btn" onClick={() => setIsElanOpen(!isElanOpen)}>Elanlar</button>
          <button className="nav-btn" onClick={onGoToDashboard}>Tapşırıq pəncərəsi</button>
          <button className="nav-btn logout-btn" onClick={onLogout}>Çıxış</button>
        </div>
      </nav>

      <div className="admin-content">
        <StatsCards />
        {isPerformansOpen && <PerformansPanel users={users} onClose={() => setIsPerformansOpen(false)} />}
        {isActivityLogOpen && <ActivityLog onClose={() => setIsActivityLogOpen(false)} />}
        {isElanOpen && <ElanPanel users={users} currentUser={currentUser} onClose={() => setIsElanOpen(false)} />}

        <div className="content-header">
          <h3>İstifadəçilər ({users.length})</h3>
          <div className="header-actions">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Axtar (ad, login, rol)..." />
            </div>
            <button className="add-user-btn" onClick={openModal}><FaPlus /> Yeni istifadəçi</button>
          </div>
        </div>

        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>№</th><th>Login</th><th>Ad Soyad</th><th>Yeni Parol</th>
                <th>Tapşırıqlar</th><th>Rol</th><th>Son giriş</th><th>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "30px", opacity: 0.6 }}>
                  {searchQuery ? "Axtarış nəticəsi tapılmadı" : "Heç bir istifadəçi yoxdur"}
                </td></tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user.id}>
                    <td>{index + 1}</td>
                    <td>{user.login}</td>
                    <td>
                      {editingId === user.id ? (
                        <input className="edit-input" type="text" value={editAdSoyad} onChange={e => setEditAdSoyad(e.target.value)} />
                      ) : user.adSoyad}
                    </td>
                    <td>
                      {editingId === user.id ? (
                        <input className="edit-input" type="text" value={editParol} onChange={e => setEditParol(e.target.value)} placeholder="Yeni parol (boş buraxın dəyişməmək üçün)" />
                      ) : <span className="parol-metn">••••••</span>}
                    </td>
                    <td>
                      <TaskLoad userLogin={user.login} />
                    </td>
                    <td>
                      {editingId === user.id ? (
                        <select className="edit-select" value={editRol} onChange={e => setEditRol(e.target.value)}>
                          <option value="Rəhbər">Rəhbər</option>
                          <option value="Müavin">Müavin</option>
                          <option value="İşçi">İşçi</option>
                        </select>
                      ) : (
                        <span className={`rol-badge rol-${user.rol.toLowerCase()}`}>{user.rol}</span>
                      )}
                    </td>
                    <td>
                      {user.sonGirisTarixi
                        ? <span className="son-giris-tarixi">{user.sonGirisTarixi}</span>
                        : <span className="son-giris-yox">—</span>}
                    </td>
                    <td>
                      {user.id === currentUser.id ? (
                        <span className="self-label">Siz</span>
                      ) : editingId === user.id ? (
                        <div className="edit-actions">
                          <button className="save-edit-btn" onClick={saveEdit} title="Yadda saxla"><FaSave /></button>
                          <button className="cancel-edit-btn" onClick={cancelEdit} title="Ləğv et"><FaTimes /></button>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          <button className="edit-btn" onClick={() => startEdit(user)} title="Redaktə et"><FaEdit /></button>
                          <button className="delete-btn" onClick={() => handleDeleteUser(user.id)} title="Sil"><FaTrash /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {silModalUser && (
        <div className="sil-modal-overlay" onClick={() => setSilModalUser(null)}>
          <div className="sil-modal-box" onClick={e => e.stopPropagation()}>
            <p className="sil-modal-metn">
              <strong>{silModalUser.adSoyad}</strong> istifadəçisini silmək istədiyinizə əminsiniz?
            </p>
            <div className="sil-modal-buttons">
              <button className="sil-modal-legv" onClick={() => setSilModalUser(null)}>Ləğv et</button>
              <button className="sil-modal-təsdiq" onClick={confirmDelete}>Sil</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Yeni istifadəçi əlavə et</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Ad Soyad</label>
                <input type="text" value={newAdSoyad} onChange={e => setNewAdSoyad(e.target.value)} placeholder="Məsələn: Əli Məmmədov" />
              </div>
              <div className="form-group">
                <label>Login</label>
                <input type="text" value={newLogin} onChange={e => setNewLogin(e.target.value)} placeholder="Login daxil edin" />
              </div>
              <div className="form-group">
                <label>Parol (min. 6 simvol)</label>
                <input type="text" value={newParol} onChange={e => setNewParol(e.target.value)} placeholder="Parol daxil edin" />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select value={newRol} onChange={e => setNewRol(e.target.value)}>
                  <option value="Rəhbər">Rəhbər</option>
                  <option value="Müavin">Müavin</option>
                  <option value="İşçi">İşçi</option>
                </select>
              </div>
              {formXeta && <p className="form-error">{formXeta}</p>}
              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setIsModalOpen(false)}>Ləğv et</button>
                <button className="save-btn" onClick={handleAddUser}>Əlavə et</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Tapşırıq yükü komponenti - API-dən alır
function TaskLoad({ userLogin }: { userLogin: string }) {
  const [aktiv, setAktiv] = useState(0);
  const [tamamlandi, setTamamlandi] = useState(0);

  useEffect(() => {
    api.get<unknown[]>('/api/tasks/all')
      .then((tasks: any[]) => {
        const userTasks = tasks.filter(t =>
          t.assignees?.some((a: any) => a.login === userLogin)
        );
        setAktiv(userTasks.filter(t => !t.isCompleted).length);
        setTamamlandi(userTasks.filter(t => t.isCompleted).length);
      })
      .catch(() => { setAktiv(0); setTamamlandi(0); });
  }, [userLogin]);

  return (
    <div className="tapsirig-yuku">
      <span className="yuk-aktiv" title="Aktiv tapşırıq">{aktiv} aktiv</span>
      <span className="yuk-tamamlandi" title="Tamamlanmış tapşırıq">{tamamlandi} tamamlandı</span>
    </div>
  );
}

export default AdminPanel;
