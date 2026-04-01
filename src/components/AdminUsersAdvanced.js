import { useState } from 'react';

const SAMPLE_USERS = [
  {
    id: 1, name: 'Alisher Mirzayev', email: 'alisher@gmail.com', subscription: 'VIP', status: 'active',
    lastLogin: '2024-01-15 14:32', joinDate: '2023-06-12', isAdmin: false,
    readBooks: [
      { title: "O'tkan kunlar", pages: 320, date: '2024-01-10' },
      { title: 'Mehrobdan chayon', pages: 280, date: '2024-01-08' },
    ],
    reviews: [
      { book: "O'tkan kunlar", rating: 5, text: 'Ajoyib asar!', date: '2024-01-11' },
    ],
    payments: [
      { plan: 'VIP', amount: 99900, method: 'Payme', date: '2024-01-01', status: 'success' },
      { plan: 'Premium', amount: 49900, method: 'Click', date: '2023-12-01', status: 'success' },
    ],
    loginLogs: [
      { ip: '185.22.64.12', device: 'Chrome / Windows', location: 'Toshkent', date: '2024-01-15 14:32' },
      { ip: '185.22.64.12', device: 'Chrome / Windows', location: 'Toshkent', date: '2024-01-14 09:15' },
    ],
  },
  {
    id: 2, name: 'Dilnoza Karimova', email: 'dilnoza@mail.ru', subscription: 'Premium', status: 'active',
    lastLogin: '2024-01-14 10:20', joinDate: '2023-09-05', isAdmin: false,
    readBooks: [{ title: 'Sariq devni minib', pages: 180, date: '2024-01-12' }],
    reviews: [],
    payments: [{ plan: 'Premium', amount: 49900, method: 'Payme', date: '2024-01-01', status: 'success' }],
    loginLogs: [{ ip: '91.207.4.18', device: 'Firefox / Mac', location: 'Samarqand', date: '2024-01-14 10:20' }],
  },
  {
    id: 3, name: 'Bobur Toshmatov', email: 'bobur@neurolib.uz', subscription: 'Free', status: 'inactive',
    lastLogin: '2023-12-01 08:00', joinDate: '2023-11-20', isAdmin: false,
    readBooks: [],
    reviews: [{ book: 'Shum bola', rating: 4, text: 'Yaxshi', date: '2023-12-01' }],
    payments: [],
    loginLogs: [{ ip: '77.245.33.9', device: 'Safari / iPhone', location: 'Toshkent', date: '2023-12-01 08:00' }],
  },
  {
    id: 4, name: 'Malika Rahimova', email: 'malika@gmail.com', subscription: 'Free', status: 'banned',
    lastLogin: '2024-01-10 16:45', joinDate: '2024-01-05', isAdmin: false,
    readBooks: [],
    reviews: [{ book: "O'tkan kunlar", rating: 1, text: 'Spam spam spam reklama', date: '2024-01-10' }],
    payments: [],
    loginLogs: [{ ip: '45.33.32.156', device: 'cURL / Linux', location: 'Amsterdam', date: '2024-01-10 16:45' }],
  },
  {
    id: 5, name: 'Sarvarbek Admin', email: 'admin@neurolib.uz', subscription: 'VIP', status: 'active',
    lastLogin: '2024-01-15 18:00', joinDate: '2023-01-01', isAdmin: true,
    readBooks: [],
    reviews: [],
    payments: [],
    loginLogs: [{ ip: '192.168.1.1', device: 'Chrome / Windows', location: 'Toshkent', date: '2024-01-15 18:00' }],
  },
];

const SUB_COLORS = { Free: 'adm-badge-gray', Premium: 'adm-badge-purple', VIP: 'adm-badge-yellow' };
const STATUS_COLORS = { active: 'adm-badge-green', inactive: 'adm-badge-yellow', banned: 'adm-badge-red' };
const STATUS_LABELS = { active: '● Faol', inactive: '○ Nofaol', banned: '🚫 Bloklangan' };

const emptyForm = { name: '', email: '', subscription: 'Free', status: 'active', isAdmin: false };

export default function AdminUsersAdvanced() {
  const [users, setUsers] = useState(SAMPLE_USERS);
  const [selectedUser, setSelectedUser] = useState(null);
  const [profileTab, setProfileTab] = useState('books');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterSub, setFilterSub] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchSub = filterSub === 'all' || u.subscription === filterSub;
    const matchStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchSearch && matchSub && matchStatus;
  });

  const toggleBan = (id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'banned' ? 'active' : 'banned' } : u));
    if (selectedUser?.id === id) setSelectedUser(prev => ({ ...prev, status: prev.status === 'banned' ? 'active' : 'banned' }));
  };

  const promoteAdmin = (id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isAdmin: !u.isAdmin } : u));
    if (selectedUser?.id === id) setSelectedUser(prev => ({ ...prev, isAdmin: !prev.isAdmin }));
  };

  const resetPassword = (user) => alert(`${user.name} uchun parol tiklash havolasi ${user.email} manziliga yuborildi.`);

  const deleteUser = (id) => {
    if (window.confirm('Foydalanuvchini o\'chirishni tasdiqlaysizmi?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
      if (selectedUser?.id === id) setSelectedUser(null);
    }
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    setUsers(prev => [...prev, { ...form, id: Date.now(), joinDate: new Date().toISOString().slice(0, 10), lastLogin: '—', readBooks: [], reviews: [], payments: [], loginLogs: [] }]);
    setForm(emptyForm); setShowForm(false);
  };

  return (
    <div className="adm-page">
      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h2>👥 Foydalanuvchilar boshqaruvi</h2>
          <p>Foydalanuvchilar, obunalar va faollik nazorati</p>
        </div>
        <button className="adm-btn adm-btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? '✕ Yopish' : '+ Yangi foydalanuvchi'}
        </button>
      </div>

      {/* Stats */}
      <div className="adm-stats">
        <div className="adm-stat"><span className="adm-stat-icon">👥</span><span className="adm-stat-value">{users.length}</span><span className="adm-stat-label">Jami foydalanuvchilar</span></div>
        <div className="adm-stat"><span className="adm-stat-icon">✅</span><span className="adm-stat-value">{users.filter(u => u.status === 'active').length}</span><span className="adm-stat-label">Faol</span></div>
        <div className="adm-stat"><span className="adm-stat-icon">🚫</span><span className="adm-stat-value">{users.filter(u => u.status === 'banned').length}</span><span className="adm-stat-label">Bloklangan</span></div>
        <div className="adm-stat"><span className="adm-stat-icon">⭐</span><span className="adm-stat-value">{users.filter(u => u.subscription !== 'Free').length}</span><span className="adm-stat-label">To'lovli obuna</span></div>
      </div>

      {/* Add user form */}
      {showForm && (
        <div className="adm-card" style={{ marginBottom: '1.5rem' }}>
          <p className="adm-card-title">➕ Yangi foydalanuvchi qo'shish</p>
          <form className="adm-form" onSubmit={handleAddUser}>
            <div className="adm-form-row">
              <div className="adm-field">
                <label>To'liq ism *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ism Familiya" required />
              </div>
              <div className="adm-field">
                <label>Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" required />
              </div>
              <div className="adm-field">
                <label>Obuna turi</label>
                <select value={form.subscription} onChange={e => setForm(f => ({ ...f, subscription: e.target.value }))}>
                  <option>Free</option><option>Premium</option><option>VIP</option>
                </select>
              </div>
              <div className="adm-field">
                <label>Holat</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="active">Faol</option><option value="inactive">Nofaol</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="adm-btn adm-btn-secondary" onClick={() => setShowForm(false)}>Bekor qilish</button>
              <button type="submit" className="adm-btn adm-btn-primary">✅ Yaratish</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input style={{ background: '#1a2035', border: '1px solid #2a3045', borderRadius: '8px', color: '#e8eaf0', padding: '0.6rem 1rem', fontSize: '0.875rem', outline: 'none', flex: 1, minWidth: '200px' }}
          placeholder="🔍 Ism yoki email..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ background: '#1a2035', border: '1px solid #2a3045', borderRadius: '8px', color: '#c4c9e0', padding: '0.6rem 0.9rem', fontSize: '0.875rem', outline: 'none' }}
          value={filterSub} onChange={e => setFilterSub(e.target.value)}>
          <option value="all">Barcha obunalar</option>
          <option value="Free">Free</option><option value="Premium">Premium</option><option value="VIP">VIP</option>
        </select>
        <select style={{ background: '#1a2035', border: '1px solid #2a3045', borderRadius: '8px', color: '#c4c9e0', padding: '0.6rem 0.9rem', fontSize: '0.875rem', outline: 'none' }}
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">Barcha holat</option>
          <option value="active">Faol</option><option value="inactive">Nofaol</option><option value="banned">Bloklangan</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedUser ? '1fr 380px' : '1fr', gap: '1rem' }}>
        {/* Table */}
        <div className="adm-card" style={{ padding: 0 }}>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr>
                <th>Foydalanuvchi</th><th>Obuna</th><th>So'nggi kirish</th><th>Ro'yxat sanasi</th><th>Holat</th><th>Amallar</th>
              </tr></thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} style={{ background: selectedUser?.id === u.id ? '#1a2035' : '' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#2a1845', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#a78bfa', flexShrink: 0 }}>
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#e8eaf0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {u.name}
                            {u.isAdmin && <span style={{ background: '#2a1a1a', color: '#f59e0b', border: '1px solid #f59e0b33', fontSize: '0.65rem', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>ADMIN</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#4b5580' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`adm-badge ${SUB_COLORS[u.subscription]}`}>{u.subscription}</span></td>
                    <td style={{ fontSize: '0.8rem', color: '#8b92b0' }}>{u.lastLogin}</td>
                    <td style={{ fontSize: '0.8rem', color: '#4b5580' }}>{u.joinDate}</td>
                    <td><span className={`adm-badge ${STATUS_COLORS[u.status]}`}>{STATUS_LABELS[u.status]}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        <button className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => { setSelectedUser(u); setProfileTab('books'); }} title="Profil">👁</button>
                        <button className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => toggleBan(u.id)} title={u.status === 'banned' ? 'Blokni olib tashlash' : 'Bloklash'}>
                          {u.status === 'banned' ? '✅' : '🚫'}
                        </button>
                        <button className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => promoteAdmin(u.id)} title={u.isAdmin ? 'Admin huquqini olish' : 'Admin qilish'}>
                          {u.isAdmin ? '👤' : '👑'}
                        </button>
                        <button className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => resetPassword(u)} title="Parolni tiklash">🔑</button>
                        <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => deleteUser(u.id)} title="O'chirish">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="adm-empty"><span className="adm-empty-icon">👥</span><p>Foydalanuvchi topilmadi</p></div>}
          </div>
        </div>

        {/* Profile panel */}
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="adm-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#2a1845', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 700, color: '#a78bfa' }}>
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#e8eaf0' }}>{selectedUser.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#4b5580' }}>{selectedUser.email}</div>
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem' }}>
                      <span className={`adm-badge ${SUB_COLORS[selectedUser.subscription]}`}>{selectedUser.subscription}</span>
                      <span className={`adm-badge ${STATUS_COLORS[selectedUser.status]}`}>{STATUS_LABELS[selectedUser.status]}</span>
                    </div>
                  </div>
                </div>
                <button className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => setSelectedUser(null)}>✕</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem', fontSize: '0.75rem' }}>
                <div style={{ background: '#1a2035', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                  <span style={{ color: '#4b5580' }}>Qo'shilgan: </span><span style={{ color: '#e8eaf0' }}>{selectedUser.joinDate}</span>
                </div>
                <div style={{ background: '#1a2035', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                  <span style={{ color: '#4b5580' }}>So'nggi kirish: </span><span style={{ color: '#e8eaf0' }}>{selectedUser.lastLogin}</span>
                </div>
              </div>
            </div>

            {/* Profile mini-tabs */}
            <div className="adm-card" style={{ padding: 0 }}>
              <div style={{ display: 'flex', borderBottom: '1px solid #1e2433' }}>
                {[['books', '📚 Kitoblar'], ['reviews', '⭐ Sharhlar'], ['payments', '💳 To\'lovlar'], ['logs', '🕐 Loglar']].map(([key, label]) => (
                  <button key={key} onClick={() => setProfileTab(key)} style={{
                    flex: 1, padding: '0.6rem 0.4rem', border: 'none', background: 'none', cursor: 'pointer',
                    color: profileTab === key ? '#a78bfa' : '#4b5580', fontWeight: profileTab === key ? 600 : 400,
                    fontSize: '0.75rem', borderBottom: profileTab === key ? '2px solid #a78bfa' : '2px solid transparent'
                  }}>{label}</button>
                ))}
              </div>
              <div style={{ padding: '1rem', maxHeight: '280px', overflowY: 'auto' }}>
                {profileTab === 'books' && (
                  selectedUser.readBooks.length === 0
                    ? <div className="adm-empty"><span className="adm-empty-icon">📚</span><p>Hech qanday kitob o'qilmagan</p></div>
                    : selectedUser.readBooks.map((b, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #1e2433', fontSize: '0.8rem' }}>
                        <span style={{ color: '#e8eaf0' }}>📕 {b.title}</span>
                        <span style={{ color: '#4b5580' }}>{b.pages} sahifa · {b.date}</span>
                      </div>
                    ))
                )}
                {profileTab === 'reviews' && (
                  selectedUser.reviews.length === 0
                    ? <div className="adm-empty"><span className="adm-empty-icon">⭐</span><p>Sharh qoldirilmagan</p></div>
                    : selectedUser.reviews.map((r, i) => (
                      <div key={i} style={{ padding: '0.6rem 0', borderBottom: '1px solid #1e2433', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ color: '#e8eaf0', fontWeight: 500 }}>{r.book}</span>
                          <span style={{ color: '#f59e0b' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                        </div>
                        <div style={{ color: '#8b92b0' }}>{r.text}</div>
                        <div style={{ color: '#4b5580', marginTop: '0.2rem' }}>{r.date}</div>
                      </div>
                    ))
                )}
                {profileTab === 'payments' && (
                  selectedUser.payments.length === 0
                    ? <div className="adm-empty"><span className="adm-empty-icon">💳</span><p>To'lov tarixi yo'q</p></div>
                    : selectedUser.payments.map((p, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid #1e2433', fontSize: '0.8rem' }}>
                        <div>
                          <span style={{ color: '#e8eaf0', fontWeight: 500 }}>{p.plan}</span>
                          <span style={{ color: '#4b5580' }}> · {p.method} · {p.date}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ color: '#a78bfa', fontWeight: 600 }}>{p.amount.toLocaleString()} UZS</span>
                          <span className={`adm-badge ${p.status === 'success' ? 'adm-badge-green' : 'adm-badge-red'}`} style={{ fontSize: '0.65rem' }}>
                            {p.status === 'success' ? '✅' : '❌'}
                          </span>
                        </div>
                      </div>
                    ))
                )}
                {profileTab === 'logs' && (
                  selectedUser.loginLogs.length === 0
                    ? <div className="adm-empty"><span className="adm-empty-icon">🕐</span><p>Login tarixi yo'q</p></div>
                    : selectedUser.loginLogs.map((l, i) => (
                      <div key={i} style={{ padding: '0.6rem 0', borderBottom: '1px solid #1e2433', fontSize: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                          <code style={{ background: '#1a2035', padding: '0.1rem 0.35rem', borderRadius: '4px', color: '#a78bfa' }}>{l.ip}</code>
                          <span style={{ color: '#4b5580' }}>{l.date}</span>
                        </div>
                        <div style={{ color: '#8b92b0' }}>{l.device} · {l.location}</div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
