import { useState } from 'react';

const SAMPLE = [
  { id: 1, title: "O'tkan kunlar", author: 'Abdulla Qodiriy', narrator: 'Sherzod Nishonov', duration: '8:42:00', chapters: 24, format: 'MP3', size: '156 MB', status: 'active', plays: 1240,
    chapterList: [
      { n: 1, title: '1-bob: Muqaddima', start: '00:00', end: '22:30', text: '' },
      { n: 2, title: '2-bob: Otabek', start: '22:30', end: '48:15', text: '' },
      { n: 3, title: '3-bob: Kumush', start: '48:15', end: '1:12:00', text: '' },
    ]
  },
  { id: 2, title: 'Mehrobdan chayon', author: 'Abdulla Qodiriy', narrator: 'Dilnoza Yusupova', duration: '6:15:00', chapters: 18, format: 'M4A', size: '98 MB', status: 'active', plays: 870, chapterList: [] },
  { id: 3, title: 'Sariq devni minib', author: 'X. Toxtaboev', narrator: 'Bobur Yusupov', duration: '4:30:00', chapters: 12, format: 'MP3', size: '74 MB', status: 'draft', plays: 0, chapterList: [] },
];

export default function AdminAudiobooks() {
  const [tab, setTab] = useState('list');
  const [books, setBooks] = useState(SAMPLE);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [form, setForm] = useState({ title: '', author: '', narrator: '', format: 'MP3' });
  const [newChapter, setNewChapter] = useState({ title: '', start: '', end: '' });
  const [syncTexts, setSyncTexts] = useState({});

  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (e) => {
    e.preventDefault();
    const newBook = { ...form, id: Date.now(), chapters: 0, duration: '—', size: '—', status: 'draft', plays: 0, chapterList: [] };
    setBooks(prev => [newBook, ...prev]);
    setForm({ title: '', author: '', narrator: '', format: 'MP3' });
    setShowForm(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Audiokitobni o\'chirishni tasdiqlaysizmi?'))
      setBooks(prev => prev.filter(b => b.id !== id));
  };

  const toggleStatus = (id) => {
    setBooks(prev => prev.map(b =>
      b.id === id ? { ...b, status: b.status === 'active' ? 'draft' : 'active' } : b
    ));
  };

  const openChapterSplit = (book) => { setSelectedBook(book); setTab('chapters'); };
  const openSync = (book) => { setSelectedBook(book); setTab('sync'); };

  const addChapter = (e) => {
    e.preventDefault();
    if (!selectedBook || !newChapter.title || !newChapter.start) return;
    const updated = books.map(b => b.id === selectedBook.id
      ? { ...b, chapters: b.chapterList.length + 1, chapterList: [...b.chapterList, { n: b.chapterList.length + 1, ...newChapter, text: '' }] }
      : b
    );
    setBooks(updated);
    setSelectedBook(updated.find(b => b.id === selectedBook.id));
    setNewChapter({ title: '', start: '', end: '' });
  };

  const removeChapter = (bookId, n) => {
    const updated = books.map(b => b.id === bookId
      ? { ...b, chapterList: b.chapterList.filter(c => c.n !== n).map((c, i) => ({ ...c, n: i + 1 })), chapters: b.chapterList.length - 1 }
      : b
    );
    setBooks(updated);
    setSelectedBook(updated.find(b => b.id === bookId));
  };

  const saveSyncText = (bookId, chapN, text) => {
    setSyncTexts(prev => ({ ...prev, [`${bookId}-${chapN}`]: text }));
  };

  return (
    <div className="adm-page">

      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h2>🎧 Audiokitoblar boshqaruvi</h2>
          <p>MP3 / M4A formatdagi audiokitoblar, bob ajratish va sinxronizatsiya</p>
        </div>
        {tab === 'list' && (
          <button className="adm-btn adm-btn-primary" onClick={() => setShowForm(s => !s)}>
            {showForm ? '✕ Yopish' : '+ Yangi audiokitob'}
          </button>
        )}
        {tab !== 'list' && (
          <button className="adm-btn adm-btn-secondary" onClick={() => setTab('list')}>← Ro'yxatga qaytish</button>
        )}
      </div>

      {/* Stats */}
      <div className="adm-stats">
        <div className="adm-stat"><span className="adm-stat-icon">🎧</span><span className="adm-stat-value">{books.length}</span><span className="adm-stat-label">Jami audiokitoblar</span></div>
        <div className="adm-stat"><span className="adm-stat-icon">✅</span><span className="adm-stat-value">{books.filter(b => b.status === 'active').length}</span><span className="adm-stat-label">Faol</span></div>
        <div className="adm-stat"><span className="adm-stat-icon">▶️</span><span className="adm-stat-value">{books.reduce((s, b) => s + b.plays, 0)}</span><span className="adm-stat-label">Jami tinglashlar</span></div>
        <div className="adm-stat"><span className="adm-stat-icon">📁</span><span className="adm-stat-value">{books.reduce((s, b) => s + b.chapters, 0)}</span><span className="adm-stat-label">Jami boblar</span></div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid #1e2433', marginBottom: '1.5rem' }}>
        {[['list', '🎧 Audiokitoblar'], ['chapters', '✂️ Bob ajratish'], ['sync', '🔗 Sinxronizatsiya']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '0.6rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer',
            color: tab === key ? '#a78bfa' : '#4b5580', fontWeight: tab === key ? 600 : 400, fontSize: '0.875rem',
            borderBottom: tab === key ? '2px solid #a78bfa' : '2px solid transparent', transition: 'all 0.15s'
          }}>{label}</button>
        ))}
      </div>

      {/* ── LIST TAB ── */}
      {tab === 'list' && (
        <>
          {/* Upload form */}
          {showForm && (
            <div className="adm-card">
              <p className="adm-card-title">➕ Yangi audiokitob yuklash</p>
              <form className="adm-form" onSubmit={handleAdd}>
                <div className="adm-form-row">
                  <div className="adm-field">
                    <label>Kitob nomi *</label>
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Audiokitob nomi" required />
                  </div>
                  <div className="adm-field">
                    <label>Muallif *</label>
                    <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="Muallif ismi" required />
                  </div>
                  <div className="adm-field">
                    <label>Ovoz beruvchi</label>
                    <input value={form.narrator} onChange={e => setForm(f => ({ ...f, narrator: e.target.value }))} placeholder="Diktor ismi" />
                  </div>
                  <div className="adm-field">
                    <label>Format</label>
                    <select value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))}>
                      <option>MP3</option><option>M4A</option><option>OGG</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="adm-field">
                    <label>Audio fayl (MP3/M4A)</label>
                    <div style={{ border: '2px dashed #2a3045', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', color: '#4b5580' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#a78bfa'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#2a3045'}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎵</div>
                      <p style={{ fontSize: '0.8rem', margin: 0 }}>Faylni shu yerga tashlang yoki bosing</p>
                      <p style={{ fontSize: '0.7rem', margin: '0.25rem 0 0', color: '#2a3045' }}>MP3, M4A, OGG (max 500 MB)</p>
                    </div>
                  </div>
                  <div className="adm-field">
                    <label>Muqova rasmi</label>
                    <div style={{ border: '2px dashed #2a3045', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', color: '#4b5580' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🖼️</div>
                      <p style={{ fontSize: '0.8rem', margin: 0 }}>Muqova rasmi (ixtiyoriy)</p>
                      <p style={{ fontSize: '0.7rem', margin: '0.25rem 0 0', color: '#2a3045' }}>JPG, PNG (max 2 MB)</p>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="adm-btn adm-btn-secondary" onClick={() => setShowForm(false)}>Bekor qilish</button>
                  <button type="submit" className="adm-btn adm-btn-primary">✅ Saqlash</button>
                </div>
              </form>
            </div>
          )}

          {/* Search */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input className="adm-field input"
              style={{ background: '#1a2035', border: '1px solid #2a3045', borderRadius: '8px', color: '#e8eaf0', padding: '0.6rem 1rem', fontSize: '0.875rem', outline: 'none', flex: 1 }}
              placeholder="🔍 Audiokitob nomi yoki muallif..." value={search} onChange={e => setSearch(e.target.value)} />
            <select style={{ background: '#1a2035', border: '1px solid #2a3045', borderRadius: '8px', color: '#c4c9e0', padding: '0.6rem 0.9rem', fontSize: '0.875rem', outline: 'none' }}>
              <option>Barcha formatlar</option><option>MP3</option><option>M4A</option>
            </select>
          </div>

          {/* Table */}
          <div className="adm-card" style={{ padding: 0 }}>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr>
                  <th>Audiokitob</th><th>Diktor</th><th>Davomiyligi</th><th>Boblar</th>
                  <th>Format</th><th>Hajm</th><th>Tinglashlar</th><th>Holat</th><th>Amallar</th>
                </tr></thead>
                <tbody>
                  {filtered.map(b => (
                    <tr key={b.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '36px', height: '36px', background: '#1e2845', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🎧</div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#e8eaf0' }}>{b.title}</div>
                            <div style={{ fontSize: '0.75rem', color: '#4b5580' }}>{b.author}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{b.narrator || '—'}</td>
                      <td>{b.duration}</td>
                      <td><span className="adm-badge adm-badge-blue">{b.chapters} bob</span></td>
                      <td><span className="adm-badge adm-badge-gray">{b.format}</span></td>
                      <td style={{ fontSize: '0.8rem', color: '#8b92b0' }}>{b.size}</td>
                      <td><span className="adm-badge adm-badge-purple">▶ {b.plays}</span></td>
                      <td>
                        <span className={`adm-badge ${b.status === 'active' ? 'adm-badge-green' : 'adm-badge-yellow'}`}>
                          {b.status === 'active' ? '● Faol' : '○ Qoralama'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          <button className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => setPreview(b)} title="Preview">▶</button>
                          <button className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => openChapterSplit(b)} title="Bob ajratish">✂️</button>
                          <button className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => openSync(b)} title="Sinxronizatsiya">🔗</button>
                          <button className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => toggleStatus(b.id)} title="Holat">{b.status === 'active' ? '⏸' : '▶'}</button>
                          <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => handleDelete(b.id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="adm-empty"><span className="adm-empty-icon">🎧</span><p>Audiokitob topilmadi</p></div>}
            </div>
          </div>
        </>
      )}

      {/* ── CHAPTER SPLIT TAB ── */}
      {tab === 'chapters' && (
        <div>
          {!selectedBook ? (
            <div className="adm-card">
              <p style={{ color: '#4b5580', textAlign: 'center', padding: '2rem' }}>Audiokitob tanlash uchun ro'yxatdan ✂️ tugmasini bosing</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
                {books.map(b => (
                  <button key={b.id} className="adm-btn adm-btn-secondary" onClick={() => setSelectedBook(b)}>
                    🎧 {b.title}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem' }}>
              <div>
                <div className="adm-card" style={{ marginBottom: '1rem' }}>
                  <p className="adm-card-title">✂️ Bob ajratish — {selectedBook.title}</p>
                  <form className="adm-form" onSubmit={addChapter}>
                    <div className="adm-form-row">
                      <div className="adm-field">
                        <label>Bob nomi *</label>
                        <input value={newChapter.title} onChange={e => setNewChapter(p => ({ ...p, title: e.target.value }))} placeholder="1-bob: Kirish" required />
                      </div>
                      <div className="adm-field">
                        <label>Boshlanish vaqti *</label>
                        <input value={newChapter.start} onChange={e => setNewChapter(p => ({ ...p, start: e.target.value }))} placeholder="00:00" required />
                      </div>
                      <div className="adm-field">
                        <label>Tugash vaqti</label>
                        <input value={newChapter.end} onChange={e => setNewChapter(p => ({ ...p, end: e.target.value }))} placeholder="22:30" />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="submit" className="adm-btn adm-btn-primary">+ Bob qo'shish</button>
                    </div>
                  </form>
                </div>

                <div className="adm-card" style={{ padding: 0 }}>
                  <div className="adm-table-wrap">
                    <table className="adm-table">
                      <thead><tr><th>#</th><th>Bob nomi</th><th>Boshlanish</th><th>Tugash</th><th>Amallar</th></tr></thead>
                      <tbody>
                        {selectedBook.chapterList.map(c => (
                          <tr key={c.n}>
                            <td><span className="adm-badge adm-badge-purple">{c.n}</span></td>
                            <td style={{ color: '#e8eaf0', fontWeight: 500 }}>{c.title}</td>
                            <td><code style={{ background: '#1a2035', padding: '0.15rem 0.4rem', borderRadius: '4px', color: '#4ade80', fontSize: '0.8rem' }}>{c.start}</code></td>
                            <td><code style={{ background: '#1a2035', padding: '0.15rem 0.4rem', borderRadius: '4px', color: '#f59e0b', fontSize: '0.8rem' }}>{c.end || '—'}</code></td>
                            <td><button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => removeChapter(selectedBook.id, c.n)}>🗑</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {selectedBook.chapterList.length === 0 && <div className="adm-empty"><span className="adm-empty-icon">✂️</span><p>Bob qo'shilmagan</p></div>}
                  </div>
                </div>
              </div>

              {/* Waveform preview */}
              <div className="adm-card" style={{ height: 'fit-content' }}>
                <p className="adm-card-title">🌊 Waveform</p>
                <div style={{ background: '#1a2035', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '60px' }}>
                    {Array.from({ length: 40 }, (_, i) => (
                      <div key={i} style={{ flex: 1, background: i % 7 === 0 ? '#a78bfa' : '#2a3045', borderRadius: '2px', height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 10}%` }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#4b5580', marginTop: '0.4rem' }}>
                    <span>0:00</span><span>{selectedBook.duration}</span>
                  </div>
                </div>
                <div style={{ background: '#1a2035', borderRadius: '8px', padding: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button style={{ background: '#a78bfa', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '0.8rem' }}>▶</button>
                    <div style={{ flex: 1, background: '#2a3045', borderRadius: '4px', height: '4px' }}>
                      <div style={{ width: '0%', height: '100%', background: '#a78bfa', borderRadius: '4px' }} />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#4b5580' }}>0:00</span>
                  </div>
                </div>
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {selectedBook.chapterList.map(c => (
                    <div key={c.n} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: '#1a2035', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#232b42'}
                      onMouseLeave={e => e.currentTarget.style.background = '#1a2035'}>
                      <span style={{ color: '#e8eaf0' }}>{c.n}. {c.title}</span>
                      <span style={{ color: '#a78bfa' }}>{c.start}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SYNC TAB ── */}
      {tab === 'sync' && (
        <div>
          {!selectedBook ? (
            <div className="adm-card">
              <p style={{ color: '#4b5580', textAlign: 'center', padding: '2rem' }}>Audiokitob tanlash uchun ro'yxatdan 🔗 tugmasini bosing</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
                {books.map(b => (
                  <button key={b.id} className="adm-btn adm-btn-secondary" onClick={() => setSelectedBook(b)}>
                    🎧 {b.title}
                  </button>
                ))}
              </div>
            </div>
          ) : selectedBook.chapterList.length === 0 ? (
            <div className="adm-card">
              <div className="adm-empty">
                <span className="adm-empty-icon">🔗</span>
                <p>Avval ✂️ Bob ajratish bo'limida boblar qo'shing</p>
                <button className="adm-btn adm-btn-primary" style={{ marginTop: '1rem' }} onClick={() => setTab('chapters')}>✂️ Bob ajratishga o'tish</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="adm-card" style={{ marginBottom: '1rem' }}>
                <p className="adm-card-title">🔗 Matn-Audio sinxronizatsiyasi — {selectedBook.title}</p>
                <p style={{ fontSize: '0.8rem', color: '#4b5580', margin: '0 0 0.5rem' }}>Har bir bob uchun mos matn (transkripsiya) kiriting</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedBook.chapterList.map(c => (
                  <div key={c.n} className="adm-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className="adm-badge adm-badge-purple">{c.n}</span>
                        <span style={{ fontWeight: 600, color: '#e8eaf0' }}>{c.title}</span>
                        <code style={{ background: '#1a2035', padding: '0.15rem 0.4rem', borderRadius: '4px', color: '#a78bfa', fontSize: '0.75rem' }}>{c.start} → {c.end || '...'}</code>
                      </div>
                      <span className={`adm-badge ${syncTexts[`${selectedBook.id}-${c.n}`] ? 'adm-badge-green' : 'adm-badge-gray'}`}>
                        {syncTexts[`${selectedBook.id}-${c.n}`] ? '✓ Matn bor' : '○ Bo\'sh'}
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      style={{ width: '100%', background: '#1a2035', border: '1px solid #2a3045', borderRadius: '8px', color: '#e8eaf0', padding: '0.75rem', fontSize: '0.85rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                      placeholder={`${c.title} uchun transkripsiya yoki matnni kiriting...`}
                      value={syncTexts[`${selectedBook.id}-${c.n}`] || ''}
                      onChange={e => saveSyncText(selectedBook.id, c.n, e.target.value)}
                    />
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="adm-btn adm-btn-primary">✅ Sinxronizatsiyani saqlash</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setPreview(null)}>
          <div style={{ background: '#141820', border: '1px solid #1e2433', borderRadius: '16px', padding: '2rem', maxWidth: '420px', width: '90%' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: '#e8eaf0' }}>🎧 Preview — 30s</h3>
              <button className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => setPreview(null)}>✕</button>
            </div>
            <div style={{ textAlign: 'center', padding: '2rem', background: '#1a2035', borderRadius: '12px', marginBottom: '1rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🎧</div>
              <p style={{ fontWeight: 700, color: '#e8eaf0', margin: '0.25rem 0' }}>{preview.title}</p>
              <p style={{ color: '#8b92b0', fontSize: '0.875rem', margin: 0 }}>{preview.author} · {preview.narrator}</p>
            </div>
            <div style={{ background: '#1a2035', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button style={{ background: '#a78bfa', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1rem', cursor: 'pointer' }}>▶</button>
                <div style={{ flex: 1, background: '#2a3045', borderRadius: '4px', height: '4px' }}>
                  <div style={{ width: '30%', height: '100%', background: '#a78bfa', borderRadius: '4px' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: '#8b92b0' }}>0:30 / {preview.duration}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
