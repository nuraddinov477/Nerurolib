import { useState } from 'react';

const REPORTS = [
  { id: 1, type: 'sharh', content: 'Bu kitob juda yomon yozilgan, muallif...', user: 'Anon_4521', target: 'O\'tkan kunlar sharhi', reason: 'spam', date: '2024-01-15 14:32', status: 'pending' },
  { id: 2, type: 'review', content: 'Hammani aldaydi! Bu sayt firibgar...', user: 'user_8812', target: 'Neurolib sharhi', reason: 'haqorat', date: '2024-01-15 11:20', status: 'pending' },
  { id: 3, type: 'sharh', content: 'Reklama: t.me/kitob_uz eng yaxshi...', user: 'promo_bot', target: 'Mehrobdan chayon sharhi', reason: 'spam', date: '2024-01-14 09:15', status: 'approved' },
  { id: 4, type: 'review', content: 'Bolalarga mos bo\'lmagan kontent...', user: 'parent_user', target: 'Sariq devni minib', reason: 'kontent', date: '2024-01-13 16:45', status: 'rejected' },
];

const BANNED_WORDS = ['spam', 'reklama', 'firibgar', 'aldaydi', 'telegram.me', 't.me'];

const MODERATORS = [
  { id: 1, name: 'Sherzod A.', email: 'sherzod@neurolib.uz', role: 'Moderator', tasks: 45, active: true },
  { id: 2, name: 'Nilufar K.', email: 'nilufar@neurolib.uz', role: 'Kontent menejeri', tasks: 32, active: true },
  { id: 3, name: 'Jasur M.', email: 'jasur@neurolib.uz', role: 'Moderator', tasks: 28, active: false },
];

const REASON_LABELS = { spam: '🚫 Spam', haqorat: '🤬 Haqorat', kontent: '⚠️ Muvofiq emas', boshqa: '❓ Boshqa' };

export default function AdminModeration() {
  const [tab, setTab] = useState('reports');
  const [reports, setReports] = useState(REPORTS);
  const [bannedWords, setBannedWords] = useState(BANNED_WORDS);
  const [newWord, setNewWord] = useState('');
  const [autoFilter, setAutoFilter] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredReports = filterStatus === 'all' ? reports : reports.filter(r => r.status === filterStatus);

  const handleAction = (id, action) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
    setSelected(null);
  };

  const addWord = (e) => {
    e.preventDefault();
    if (newWord.trim() && !bannedWords.includes(newWord.trim().toLowerCase())) {
      setBannedWords(prev => [...prev, newWord.trim().toLowerCase()]);
      setNewWord('');
    }
  };

  const removeWord = (word) => setBannedWords(prev => prev.filter(w => w !== word));

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  return (
    <div className="adm-page">

      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h2>🛡️ Moderatsiya markazi</h2>
          <p>Kontent nazorati, shikoyatlar va avtomatik filtr</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {pendingCount > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700 }}>
              {pendingCount} yangi shikoyat
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="adm-stats">
        <div className="adm-stat"><span className="adm-stat-icon">📋</span><span className="adm-stat-value">{reports.length}</span><span className="adm-stat-label">Jami shikoyatlar</span></div>
        <div className="adm-stat"><span className="adm-stat-icon">⏳</span><span className="adm-stat-value">{reports.filter(r => r.status === 'pending').length}</span><span className="adm-stat-label">Ko'rib chiqilmagan</span></div>
        <div className="adm-stat"><span className="adm-stat-icon">✅</span><span className="adm-stat-value">{reports.filter(r => r.status === 'approved').length}</span><span className="adm-stat-label">Tasdiqlangan</span></div>
        <div className="adm-stat"><span className="adm-stat-icon">🚫</span><span className="adm-stat-value">{bannedWords.length}</span><span className="adm-stat-label">Bloklangan so'zlar</span></div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid #1e2433', marginBottom: '1.5rem' }}>
        {[['reports', '📋 Shikoyatlar'], ['filter', '🔍 Avtomatik filtr'], ['moderators', '👥 Moderatorlar']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '0.6rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer',
            color: tab === key ? '#a78bfa' : '#4b5580', fontWeight: tab === key ? 600 : 400, fontSize: '0.875rem',
            borderBottom: tab === key ? '2px solid #a78bfa' : '2px solid transparent', transition: 'all 0.15s'
          }}>{label}</button>
        ))}
      </div>

      {/* Reports Tab */}
      {tab === 'reports' && (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              {[['all', 'Barchasi'], ['pending', '⏳ Kutilmoqda'], ['approved', '✅ Tasdiqlangan'], ['rejected', '❌ Rad etilgan']].map(([val, label]) => (
                <button key={val} onClick={() => setFilterStatus(val)} className={`adm-btn adm-btn-sm ${filterStatus === val ? 'adm-btn-primary' : 'adm-btn-secondary'}`}>{label}</button>
              ))}
            </div>
            <div className="adm-card" style={{ padding: 0 }}>
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Kontent</th>
                      <th>Sabab</th>
                      <th>Foydalanuvchi</th>
                      <th>Sana</th>
                      <th>Holat</th>
                      <th>Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map(r => (
                      <tr key={r.id} style={{ cursor: 'pointer', background: selected?.id === r.id ? '#1a2035' : '' }} onClick={() => setSelected(r)}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#e8eaf0', fontSize: '0.85rem' }}>{r.target}</div>
                          <div style={{ fontSize: '0.75rem', color: '#4b5580', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.content}</div>
                        </td>
                        <td><span className="adm-badge adm-badge-yellow">{REASON_LABELS[r.reason] || r.reason}</span></td>
                        <td style={{ fontSize: '0.8rem', color: '#8b92b0' }}>{r.user}</td>
                        <td style={{ fontSize: '0.75rem', color: '#4b5580' }}>{r.date}</td>
                        <td>
                          <span className={`adm-badge ${r.status === 'pending' ? 'adm-badge-yellow' : r.status === 'approved' ? 'adm-badge-green' : 'adm-badge-red'}`}>
                            {r.status === 'pending' ? '⏳ Kutilmoqda' : r.status === 'approved' ? '✅ Tasdiqlangan' : '❌ Rad etildi'}
                          </span>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          {r.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button className="adm-btn adm-btn-sm adm-btn-primary" onClick={() => handleAction(r.id, 'approved')}>✅</button>
                              <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => handleAction(r.id, 'rejected')}>❌</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredReports.length === 0 && <div className="adm-empty"><span className="adm-empty-icon">🛡️</span><p>Shikoyat topilmadi</p></div>}
              </div>
            </div>
          </div>

          {selected && (
            <div className="adm-card" style={{ height: 'fit-content' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <p className="adm-card-title" style={{ margin: 0 }}>📋 Batafsil</p>
                <button className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => setSelected(null)}>✕</button>
              </div>
              <div style={{ background: '#1a2035', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: '#4b5580', margin: '0 0 0.5rem' }}>KONTENT</p>
                <p style={{ color: '#e8eaf0', fontSize: '0.875rem', margin: 0, lineHeight: 1.6 }}>{selected.content}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
                <div><span style={{ color: '#4b5580' }}>Tur:</span> <span style={{ color: '#e8eaf0' }}>{selected.type}</span></div>
                <div><span style={{ color: '#4b5580' }}>Sabab:</span> <span style={{ color: '#e8eaf0' }}>{REASON_LABELS[selected.reason]}</span></div>
                <div><span style={{ color: '#4b5580' }}>Foydalanuvchi:</span> <span style={{ color: '#e8eaf0' }}>{selected.user}</span></div>
                <div><span style={{ color: '#4b5580' }}>Sana:</span> <span style={{ color: '#e8eaf0' }}>{selected.date}</span></div>
              </div>
              {selected.status === 'pending' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="adm-btn adm-btn-primary" style={{ flex: 1 }} onClick={() => handleAction(selected.id, 'approved')}>✅ Tasdiqlash</button>
                  <button className="adm-btn adm-btn-danger" style={{ flex: 1 }} onClick={() => handleAction(selected.id, 'rejected')}>❌ Rad etish</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Auto Filter Tab */}
      {tab === 'filter' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="adm-card">
            <p className="adm-card-title">⚙️ Filtr sozlamalari</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                ['autoFilter', autoFilter, setAutoFilter, 'Avtomatik filtr', 'Sharhlar avtomatik tekshiriladi'],
                ['spamBlock', true, null, 'Spam bloklash', 'Takroriy habarlar bloklanadi'],
                ['linkBlock', true, null, 'Havolalar bloklash', 'Tashqi havolalar moderatsiyaga yuboriladi'],
                ['capsBlock', false, null, 'KATTA harflar', '80%+ katta harf bo\'lsa bloklash'],
              ].map(([key, val, setter, label, desc]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#1a2035', borderRadius: '8px' }}>
                  <div>
                    <div style={{ color: '#e8eaf0', fontSize: '0.875rem', fontWeight: 500 }}>{label}</div>
                    <div style={{ color: '#4b5580', fontSize: '0.75rem' }}>{desc}</div>
                  </div>
                  <div
                    onClick={() => setter && setter(v => !v)}
                    style={{
                      width: '44px', height: '24px', borderRadius: '12px', cursor: setter ? 'pointer' : 'default',
                      background: val ? '#a78bfa' : '#2a3045', position: 'relative', transition: 'background 0.2s'
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: '3px', left: val ? '23px' : '3px',
                      width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="adm-card">
            <p className="adm-card-title">🚫 Bloklangan so'zlar ({bannedWords.length})</p>
            <form onSubmit={addWord} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                className="adm-field input"
                style={{ flex: 1, background: '#1a2035', border: '1px solid #2a3045', borderRadius: '8px', color: '#e8eaf0', padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none' }}
                placeholder="Yangi so'z qo'shish..."
                value={newWord}
                onChange={e => setNewWord(e.target.value)}
              />
              <button type="submit" className="adm-btn adm-btn-primary adm-btn-sm">+ Qo'shish</button>
            </form>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto' }}>
              {bannedWords.map(word => (
                <span key={word} style={{
                  background: '#2a1a2a', border: '1px solid #4b2545', color: '#f87171',
                  padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem',
                  display: 'flex', alignItems: 'center', gap: '0.4rem'
                }}>
                  {word}
                  <button onClick={() => removeWord(word)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0, fontSize: '0.7rem' }}>✕</button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Moderators Tab */}
      {tab === 'moderators' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="adm-btn adm-btn-primary">+ Moderator qo'shish</button>
          </div>
          <div className="adm-card" style={{ padding: 0 }}>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Moderator</th>
                    <th>Rol</th>
                    <th>Bajarilgan vazifalar</th>
                    <th>Holat</th>
                    <th>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {MODERATORS.map(m => (
                    <tr key={m.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '36px', height: '36px', background: '#2a1845', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>👤</div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#e8eaf0' }}>{m.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#4b5580' }}>{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="adm-badge adm-badge-purple">{m.role}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, background: '#1a2035', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min((m.tasks / 50) * 100, 100)}%`, height: '100%', background: '#a78bfa' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#8b92b0' }}>{m.tasks}</span>
                        </div>
                      </td>
                      <td><span className={`adm-badge ${m.active ? 'adm-badge-green' : 'adm-badge-gray'}`}>{m.active ? '● Faol' : '○ Nofaol'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="adm-btn adm-btn-sm adm-btn-secondary">Tahrirlash</button>
                          <button className="adm-btn adm-btn-sm adm-btn-danger">🗑</button>
                        </div>
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
