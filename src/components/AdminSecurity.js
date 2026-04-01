import { useState } from 'react';

const ROLES = [
  { id: 1, name: 'Superadmin', users: 1, permissions: ['Hammasi'], color: '#f59e0b', icon: '👑' },
  { id: 2, name: 'Kontent menejeri', users: 2, permissions: ['Kitoblar', 'Kategoriyalar', 'Audiokitoblar'], color: '#a78bfa', icon: '📚' },
  { id: 3, name: 'Moderator', users: 3, permissions: ['Shikoyatlar', 'Sharhlar', 'Foydalanuvchilar (ko\'rish)'], color: '#22d3ee', icon: '🛡️' },
  { id: 4, name: 'Tahlilchi', users: 1, permissions: ['Analitika', 'Hisobotlar'], color: '#4ade80', icon: '📊' },
  { id: 5, name: 'Moliyachi', users: 1, permissions: ['To\'lovlar', 'Obunalar', 'Hisobotlar'], color: '#fb7185', icon: '💰' },
];

const ACCESS_LOGS = [
  { id: 1, user: 'admin@neurolib.uz', action: 'Login', ip: '185.22.64.12', location: 'Toshkent, UZ', device: 'Chrome / Windows', time: '2024-01-15 14:32:01', status: 'success' },
  { id: 2, user: 'content@neurolib.uz', action: 'Kitob tahrirlash', ip: '91.207.4.18', location: 'Samarqand, UZ', device: 'Firefox / Mac', time: '2024-01-15 12:15:44', status: 'success' },
  { id: 3, user: 'unknown', action: 'Login urinish', ip: '45.33.32.156', location: 'Amsterdam, NL', device: 'cURL / Linux', time: '2024-01-15 09:03:22', status: 'failed' },
  { id: 4, user: 'unknown', action: 'Login urinish', ip: '45.33.32.156', location: 'Amsterdam, NL', device: 'cURL / Linux', time: '2024-01-15 09:03:18', status: 'failed' },
  { id: 5, user: 'mod@neurolib.uz', action: 'Login', ip: '77.245.33.9', location: 'Toshkent, UZ', device: 'Safari / iPhone', time: '2024-01-14 18:50:10', status: 'success' },
];

const BLOCKED_IPS = [
  { ip: '45.33.32.156', reason: 'Ko\'p marta xato login', blocked: '2024-01-15', attempts: 15 },
  { ip: '192.168.100.254', reason: 'Suspicious activity', blocked: '2024-01-10', attempts: 8 },
];

const ADMIN_USERS = [
  { id: 1, name: 'Sarvarbek A.', email: 'admin@neurolib.uz', role: 'Superadmin', lastLogin: '2024-01-15 14:32', twoFA: true, twoFAMethod: 'Authenticator', active: true },
  { id: 2, name: 'Nilufar K.', email: 'content@neurolib.uz', role: 'Kontent menejeri', lastLogin: '2024-01-15 12:15', twoFA: false, twoFAMethod: null, active: true },
  { id: 3, name: 'Jasur M.', email: 'mod@neurolib.uz', role: 'Moderator', lastLogin: '2024-01-14 18:50', twoFA: true, twoFAMethod: 'Email', active: true },
  { id: 4, name: 'Dilnoza F.', email: 'finance@neurolib.uz', role: 'Moliyachi', lastLogin: '2024-01-13 10:00', twoFA: false, twoFAMethod: null, active: false },
];

const TOKENS = [
  { id: 1, user: 'admin@neurolib.uz', type: 'JWT', issued: '2024-01-15 14:32', expires: '2024-01-15 16:32', device: 'Chrome / Windows', status: 'active' },
  { id: 2, user: 'admin@neurolib.uz', type: 'Refresh', issued: '2024-01-15 14:32', expires: '2024-02-15 14:32', device: 'Chrome / Windows', status: 'active' },
  { id: 3, user: 'content@neurolib.uz', type: 'JWT', issued: '2024-01-15 12:15', expires: '2024-01-15 14:15', device: 'Firefox / Mac', status: 'expired' },
  { id: 4, user: 'mod@neurolib.uz', type: 'JWT', issued: '2024-01-14 18:50', expires: '2024-01-14 20:50', device: 'Safari / iPhone', status: 'revoked' },
  { id: 5, user: 'mod@neurolib.uz', type: 'Refresh', issued: '2024-01-14 18:50', expires: '2024-02-14 18:50', device: 'Safari / iPhone', status: 'active' },
];

export default function AdminSecurity() {
  const [tab, setTab] = useState('roles');
  const [blockedIPs, setBlockedIPs] = useState(BLOCKED_IPS);
  const [adminUsers, setAdminUsers] = useState(ADMIN_USERS);
  const [tokens, setTokens] = useState(TOKENS);
  const [newIP, setNewIP] = useState('');
  const [newReason, setNewReason] = useState('');
  const [logFilter, setLogFilter] = useState('all');
  const [twoFASettings, setTwoFASettings] = useState({ email: true, sms: false, authenticator: true });

  const filteredLogs = logFilter === 'all' ? ACCESS_LOGS : ACCESS_LOGS.filter(l => l.status === logFilter);
  const failedAttempts = ACCESS_LOGS.filter(l => l.status === 'failed').length;

  const addBlock = (e) => {
    e.preventDefault();
    if (!newIP.trim()) return;
    setBlockedIPs(prev => [...prev, { ip: newIP.trim(), reason: newReason || 'Qo\'lda bloklangan', blocked: new Date().toISOString().slice(0, 10), attempts: 0 }]);
    setNewIP(''); setNewReason('');
  };

  const unblock = (ip) => setBlockedIPs(prev => prev.filter(b => b.ip !== ip));
  const revokeToken = (id) => setTokens(prev => prev.map(t => t.id === id ? { ...t, status: 'revoked' } : t));
  const revokeAllForUser = (user) => setTokens(prev => prev.map(t => t.user === user && t.status === 'active' ? { ...t, status: 'revoked' } : t));
  const toggle2FA = (id) => setAdminUsers(prev => prev.map(u => u.id === id ? { ...u, twoFA: !u.twoFA } : u));

  const TOKEN_COLORS = { active: 'adm-badge-green', expired: 'adm-badge-yellow', revoked: 'adm-badge-red' };

  return (
    <div className="adm-page">
      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h2>🔐 Xavfsizlik markazi</h2>
          <p>Admin rollari, 2FA, kirish loglari va token monitoring</p>
        </div>
        {failedAttempts > 0 && (
          <span style={{ background: '#ef4444', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700 }}>
            ⚠️ {failedAttempts} muvaffaqiyatsiz urinish
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="adm-stats">
        <div className="adm-stat"><span className="adm-stat-icon">👥</span><span className="adm-stat-value">{adminUsers.length}</span><span className="adm-stat-label">Admin foydalanuvchilar</span></div>
        <div className="adm-stat"><span className="adm-stat-icon">🔒</span><span className="adm-stat-value">{adminUsers.filter(u => u.twoFA).length}</span><span className="adm-stat-label">2FA yoqilgan</span></div>
        <div className="adm-stat"><span className="adm-stat-icon">🔴</span><span className="adm-stat-value">{failedAttempts}</span><span className="adm-stat-label">Muvaffaqiyatsiz login</span></div>
        <div className="adm-stat"><span className="adm-stat-icon">🚫</span><span className="adm-stat-value">{blockedIPs.length}</span><span className="adm-stat-label">Bloklangan IP</span></div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid #1e2433', marginBottom: '1.5rem' }}>
        {[['roles', '👑 Rollar'], ['twofa', '🔒 2FA'], ['logs', '📋 Loglar'], ['ips', '🌐 IP Monitor'], ['tokens', '🔑 Tokenlar']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '0.6rem 1.1rem', border: 'none', background: 'none', cursor: 'pointer',
            color: tab === key ? '#a78bfa' : '#4b5580', fontWeight: tab === key ? 600 : 400, fontSize: '0.875rem',
            borderBottom: tab === key ? '2px solid #a78bfa' : '2px solid transparent', transition: 'all 0.15s'
          }}>{label}</button>
        ))}
      </div>

      {/* ── ROLES TAB ── */}
      {tab === 'roles' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {ROLES.map(role => (
              <div key={role.id} className="adm-card" style={{ borderLeft: `4px solid ${role.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.3rem' }}>{role.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: '#e8eaf0' }}>{role.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#4b5580' }}>{role.users} foydalanuvchi</div>
                    </div>
                  </div>
                  <button className="adm-btn adm-btn-sm adm-btn-secondary">✏️</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {role.permissions.map(p => (
                    <span key={p} style={{ background: '#1a2035', border: `1px solid ${role.color}33`, color: role.color, padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem' }}>✓ {p}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="adm-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <p className="adm-card-title" style={{ margin: 0 }}>👤 Admin foydalanuvchilar</p>
              <button className="adm-btn adm-btn-primary adm-btn-sm">+ Qo'shish</button>
            </div>
            <table className="adm-table">
              <thead><tr><th>Foydalanuvchi</th><th>Rol</th><th>So'nggi kirish</th><th>2FA</th><th>Holat</th><th>Amallar</th></tr></thead>
              <tbody>
                {adminUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '34px', height: '34px', background: '#1e2845', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#a78bfa' }}>{u.name.charAt(0)}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#e8eaf0', fontSize: '0.875rem' }}>{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#4b5580' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="adm-badge adm-badge-purple">{u.role}</span></td>
                    <td style={{ fontSize: '0.75rem', color: '#8b92b0' }}>{u.lastLogin}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`adm-badge ${u.twoFA ? 'adm-badge-green' : 'adm-badge-red'}`}>{u.twoFA ? `🔒 ${u.twoFAMethod}` : '⚠️ O\'chirilgan'}</span>
                      </div>
                    </td>
                    <td><span className={`adm-badge ${u.active ? 'adm-badge-green' : 'adm-badge-gray'}`}>{u.active ? '● Faol' : '○ Nofaol'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => toggle2FA(u.id)} title="2FA">{u.twoFA ? '🔓' : '🔒'}</button>
                        <button className="adm-btn adm-btn-sm adm-btn-secondary">✏️</button>
                        <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => revokeAllForUser(u.email)} title="Tokenlarni bekor qilish">🔑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 2FA TAB ── */}
      {tab === 'twofa' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="adm-card">
            <p className="adm-card-title">🔒 2FA Usullari</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { key: 'email', icon: '📧', label: 'Email orqali', desc: 'Tasdiqlash kodi email ga yuboriladi', method: 'Email' },
                { key: 'sms', icon: '📱', label: 'SMS orqali', desc: 'Tasdiqlash kodi SMS ga yuboriladi', method: 'SMS' },
                { key: 'authenticator', icon: '🔐', label: 'Authenticator ilovasi', desc: 'Google Authenticator, Authy va boshqalar', method: 'Authenticator' },
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#1a2035', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                    <div>
                      <div style={{ color: '#e8eaf0', fontWeight: 500 }}>{item.label}</div>
                      <div style={{ color: '#4b5580', fontSize: '0.75rem' }}>{item.desc}</div>
                    </div>
                  </div>
                  <div onClick={() => setTwoFASettings(p => ({ ...p, [item.key]: !p[item.key] }))}
                    style={{ width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', background: twoFASettings[item.key] ? '#a78bfa' : '#2a3045', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: '3px', left: twoFASettings[item.key] ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="adm-card" style={{ marginBottom: '1rem' }}>
              <p className="adm-card-title">📊 2FA holati</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {adminUsers.map(u => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: '#1a2035', borderRadius: '8px' }}>
                    <div>
                      <div style={{ color: '#e8eaf0', fontSize: '0.85rem', fontWeight: 500 }}>{u.name}</div>
                      <div style={{ color: '#4b5580', fontSize: '0.7rem' }}>{u.role}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {u.twoFA
                        ? <span className="adm-badge adm-badge-green">🔒 {u.twoFAMethod}</span>
                        : <span className="adm-badge adm-badge-red">⚠️ Yoqilmagan</span>
                      }
                      <button className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => toggle2FA(u.id)} style={{ fontSize: '0.7rem' }}>
                        {u.twoFA ? 'O\'chirish' : 'Yoqish'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="adm-card" style={{ background: '#1a2a1a', border: '1px solid #204b20' }}>
              <p className="adm-card-title" style={{ color: '#4ade80' }}>💡 Tavsiya</p>
              <p style={{ color: '#8b92b0', fontSize: '0.8rem', lineHeight: 1.6, margin: 0 }}>
                Barcha admin foydalanuvchilar uchun 2FA yoqish tavsiya etiladi. Authenticator ilovasi eng xavfsiz usul hisoblanadi.
                {adminUsers.some(u => !u.twoFA) && <span style={{ color: '#f87171', display: 'block', marginTop: '0.5rem' }}>
                  ⚠️ {adminUsers.filter(u => !u.twoFA).length} ta foydalanuvchida 2FA yoqilmagan!
                </span>}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── LOGS TAB ── */}
      {tab === 'logs' && (
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {[['all', 'Barchasi'], ['success', '✅ Muvaffaqiyatli'], ['failed', '❌ Xato']].map(([val, label]) => (
              <button key={val} onClick={() => setLogFilter(val)} className={`adm-btn adm-btn-sm ${logFilter === val ? 'adm-btn-primary' : 'adm-btn-secondary'}`}>{label}</button>
            ))}
            <button className="adm-btn adm-btn-sm adm-btn-secondary" style={{ marginLeft: 'auto' }}>📥 Eksport</button>
          </div>
          <div className="adm-card" style={{ padding: 0 }}>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>Foydalanuvchi</th><th>Amal</th><th>IP manzil</th><th>Joylashuv</th><th>Qurilma</th><th>Vaqt</th><th>Natija</th></tr></thead>
                <tbody>
                  {filteredLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.85rem', color: '#e8eaf0' }}>{log.user}</td>
                      <td style={{ fontSize: '0.85rem', color: '#8b92b0' }}>{log.action}</td>
                      <td><code style={{ background: '#1a2035', padding: '0.15rem 0.4rem', borderRadius: '4px', color: '#a78bfa', fontSize: '0.75rem' }}>{log.ip}</code></td>
                      <td style={{ fontSize: '0.75rem', color: '#4b5580' }}>{log.location}</td>
                      <td style={{ fontSize: '0.75rem', color: '#4b5580' }}>{log.device}</td>
                      <td style={{ fontSize: '0.75rem', color: '#4b5580' }}>{log.time}</td>
                      <td><span className={`adm-badge ${log.status === 'success' ? 'adm-badge-green' : 'adm-badge-red'}`}>{log.status === 'success' ? '✅ OK' : '❌ Xato'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── IPs TAB ── */}
      {tab === 'ips' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="adm-card">
            <p className="adm-card-title">🚫 Bloklangan IP manzillar</p>
            <form onSubmit={addBlock} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              <input style={{ background: '#1a2035', border: '1px solid #2a3045', borderRadius: '8px', color: '#e8eaf0', padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none' }}
                placeholder="IP manzil (masalan: 45.33.32.156)" value={newIP} onChange={e => setNewIP(e.target.value)} />
              <input style={{ background: '#1a2035', border: '1px solid #2a3045', borderRadius: '8px', color: '#e8eaf0', padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none' }}
                placeholder="Sabab (ixtiyoriy)" value={newReason} onChange={e => setNewReason(e.target.value)} />
              <button type="submit" className="adm-btn adm-btn-danger adm-btn-sm">🚫 IP Bloklash</button>
            </form>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {blockedIPs.map(b => (
                <div key={b.ip} style={{ background: '#2a1a1a', border: '1px solid #4b2020', borderRadius: '8px', padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <code style={{ color: '#f87171', fontSize: '0.875rem' }}>{b.ip}</code>
                    <div style={{ fontSize: '0.75rem', color: '#4b5580', marginTop: '0.2rem' }}>{b.reason} · {b.blocked}</div>
                    {b.attempts > 0 && <div style={{ fontSize: '0.7rem', color: '#f87171' }}>{b.attempts} urinish</div>}
                  </div>
                  <button className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => unblock(b.ip)}>Ochish</button>
                </div>
              ))}
              {blockedIPs.length === 0 && <div className="adm-empty"><span className="adm-empty-icon">✅</span><p>Bloklangan IP yo'q</p></div>}
            </div>
          </div>
          <div className="adm-card">
            <p className="adm-card-title">🔒 Xavfsizlik holati</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: '2FA yoqilgan adminlar', val: `${adminUsers.filter(u => u.twoFA).length}/${adminUsers.length}`, ok: adminUsers.every(u => u.twoFA) },
                { label: 'Bloklangan IP lar', val: blockedIPs.length, ok: true },
                { label: 'SSL sertifikat', val: 'Faol', ok: true },
                { label: 'So\'nggi zaxira nusxa', val: '2024-01-14', ok: true },
                { label: 'Muvaffaqiyatsiz loginlar (24s)', val: failedAttempts, ok: failedAttempts < 5 },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#1a2035', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#8b92b0' }}>{item.label}</span>
                  <span style={{ fontSize: '0.85rem', color: item.ok ? '#4ade80' : '#f87171', fontWeight: 600 }}>{item.ok ? '✓' : '⚠️'} {item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TOKENS TAB ── */}
      {tab === 'tokens' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className="adm-badge adm-badge-green">● Faol: {tokens.filter(t => t.status === 'active').length}</span>
              <span className="adm-badge adm-badge-yellow">⏱ Muddati o'tgan: {tokens.filter(t => t.status === 'expired').length}</span>
              <span className="adm-badge adm-badge-red">✕ Bekor qilingan: {tokens.filter(t => t.status === 'revoked').length}</span>
            </div>
            <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => setTokens(prev => prev.map(t => t.status === 'active' ? { ...t, status: 'revoked' } : t))}>
              🔑 Barchasini bekor qilish
            </button>
          </div>
          <div className="adm-card" style={{ padding: 0 }}>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>Foydalanuvchi</th><th>Tur</th><th>Qurilma</th><th>Chiqarilgan</th><th>Muddati</th><th>Holat</th><th>Amallar</th></tr></thead>
                <tbody>
                  {tokens.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontSize: '0.85rem', color: '#e8eaf0' }}>{t.user}</td>
                      <td><span className={`adm-badge ${t.type === 'JWT' ? 'adm-badge-blue' : 'adm-badge-purple'}`}>{t.type}</span></td>
                      <td style={{ fontSize: '0.75rem', color: '#4b5580' }}>{t.device}</td>
                      <td style={{ fontSize: '0.75rem', color: '#4b5580' }}>{t.issued}</td>
                      <td style={{ fontSize: '0.75rem', color: t.status === 'expired' ? '#f59e0b' : '#4b5580' }}>{t.expires}</td>
                      <td><span className={`adm-badge ${TOKEN_COLORS[t.status]}`}>{t.status === 'active' ? '● Faol' : t.status === 'expired' ? '⏱ Muddati o\'tgan' : '✕ Bekor'}</span></td>
                      <td>
                        {t.status === 'active' && (
                          <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => revokeToken(t.id)}>Bekor qilish</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
