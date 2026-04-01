import { useState } from 'react';

const SAMPLE_BOOKS = [
  { id: 1, title: "O'tkan kunlar", author: 'Abdulla Qodiriy', genre: 'Klassika', language: "O'zbekcha", isbn: '978-9943-01-001-1', status: 'published', has_pdf: true, views: 1240, cover: '📕', description: 'O\'zbek adabiyotining eng mashhur romanlaridan biri.' },
  { id: 2, title: 'Mehrobdan chayon', author: 'Abdulla Qodiriy', genre: 'Klassika', language: "O'zbekcha", isbn: '978-9943-01-002-8', status: 'published', has_pdf: true, views: 870, cover: '📗', description: 'Abdulla Qodiriyning ikkinchi romani.' },
  { id: 3, title: 'Sariq devni minib', author: 'X. Toxtaboev', genre: 'Bolalar', language: "O'zbekcha", isbn: '978-9943-01-003-5', status: 'draft', has_pdf: false, views: 320, cover: '📘', description: 'Bolalar adabiyotining sevimli asari.' },
  { id: 4, title: 'Shum bola', author: 'G\'ayratiy', genre: 'Bolalar', language: "O'zbekcha", isbn: '', status: 'archived', has_pdf: false, views: 150, cover: '📙', description: 'Yoshlar uchun hazil-mutoyiba hikoyalar.' },
  { id: 5, title: 'Crime and Punishment', author: 'F. Dostoevsky', genre: 'Roman', language: 'Русский', isbn: '978-0-14-044913-6', status: 'published', has_pdf: true, views: 540, cover: '📒', description: 'Классический роман Достоевского.' },
];

const GENRES = ['Klassika', 'Roman', 'Bolalar', 'Ilmiy', 'Tarix', 'Falsafa', 'Detektiv', 'She\'riyat', 'Biografiya', 'Boshqa'];
const LANGUAGES = ["O'zbekcha", 'Русский', 'English'];
const STATUSES = { published: { label: 'Nashr etilgan', cls: 'adm-badge-green' }, draft: { label: 'Qoralama', cls: 'adm-badge-yellow' }, archived: { label: 'Arxivlangan', cls: 'adm-badge-gray' } };

const emptyForm = { title: '', author: '', genre: 'Klassika', language: "O'zbekcha", isbn: '', status: 'draft', description: '', cover: '📕' };

export default function AdminBooks() {
  const [tab, setTab] = useState('books');
  const [books, setBooks] = useState(SAMPLE_BOOKS);
  const [genres, setGenres] = useState(GENRES);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [previewBook, setPreviewBook] = useState(null);
  const [newGenre, setNewGenre] = useState('');
  const [editGenre, setEditGenre] = useState(null);

  const filtered = books.filter(b => {
    const q = search.toLowerCase();
    const matchSearch = b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (book) => { setEditId(book.id); setForm({ ...book }); setShowForm(true); setTab('books'); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editId) {
      setBooks(prev => prev.map(b => b.id === editId ? { ...b, ...form } : b));
    } else {
      setBooks(prev => [{ ...form, id: Date.now(), views: 0, has_pdf: false }, ...prev]);
    }
    setShowForm(false); setEditId(null); setForm(emptyForm);
  };

  const handleDelete = (id) => {
    if (window.confirm('Kitobni o\'chirishni tasdiqlaysizmi?'))
      setBooks(prev => prev.filter(b => b.id !== id));
  };

  const addGenre = (e) => {
    e.preventDefault();
    const g = newGenre.trim();
    if (g && !genres.includes(g)) { setGenres(prev => [...prev, g]); }
    setNewGenre('');
  };

  const deleteGenre = (g) => { if (window.confirm(`"${g}" janrini o'chirishni tasdiqlaysizmi?`)) setGenres(prev => prev.filter(x => x !== g)); };
  const saveEditGenre = (old, val) => {
    if (val.trim() && val !== old) {
      setGenres(prev => prev.map(g => g === old ? val.trim() : g));
      setBooks(prev => prev.map(b => b.genre === old ? { ...b, genre: val.trim() } : b));
    }
    setEditGenre(null);
  };

  const COVERS = ['📕', '📗', '📙', '📘', '📔', '📓', '📒', '📑'];

  return (
    <div className="adm-page">
      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h2>📚 Kitoblar boshqaruvi</h2>
          <p>Kitoblarni qo'shish, tahrirlash va kategoriyalarni boshqaring</p>
        </div>
        {tab === 'books' && (
          <button className="adm-btn adm-btn-primary" onClick={showForm ? () => setShowForm(false) : openAdd}>
            {showForm ? '✕ Yopish' : '+ Yangi kitob'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="adm-stats">
        <div className="adm-stat"><span className="adm-stat-icon">📚</span><span className="adm-stat-value">{books.length}</span><span className="adm-stat-label">Jami kitoblar</span></div>
        <div className="adm-stat"><span className="adm-stat-icon">✅</span><span className="adm-stat-value">{books.filter(b => b.status === 'published').length}</span><span className="adm-stat-label">Nashr etilgan</span></div>
        <div className="adm-stat"><span className="adm-stat-icon">📝</span><span className="adm-stat-value">{books.filter(b => b.status === 'draft').length}</span><span className="adm-stat-label">Qoralama</span></div>
        <div className="adm-stat"><span className="adm-stat-icon">📄</span><span className="adm-stat-value">{books.filter(b => b.has_pdf).length}</span><span className="adm-stat-label">PDF bor</span></div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid #1e2433', marginBottom: '1.5rem' }}>
        {[['books', '📚 Kitoblar'], ['categories', '🏷️ Kategoriyalar'], ['preview', '👁️ Ko\'rish']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '0.6rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer',
            color: tab === key ? '#a78bfa' : '#4b5580', fontWeight: tab === key ? 600 : 400, fontSize: '0.875rem',
            borderBottom: tab === key ? '2px solid #a78bfa' : '2px solid transparent', transition: 'all 0.15s'
          }}>{label}</button>
        ))}
      </div>

      {/* ── BOOKS TAB ── */}
      {tab === 'books' && (
        <>
          {/* Form */}
          {showForm && (
            <div className="adm-card" style={{ marginBottom: '1.5rem' }}>
              <p className="adm-card-title">{editId ? '✏️ Kitobni tahrirlash' : '➕ Yangi kitob qo\'shish'}</p>
              <form className="adm-form" onSubmit={handleSubmit}>
                <div className="adm-form-row">
                  <div className="adm-field">
                    <label>Kitob nomi *</label>
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Kitob nomini kiriting" required />
                  </div>
                  <div className="adm-field">
                    <label>Muallif *</label>
                    <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="Muallif ismi" required />
                  </div>
                  <div className="adm-field">
                    <label>Janr</label>
                    <select value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}>
                      {genres.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="adm-field">
                    <label>Til</label>
                    <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
                      {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="adm-field">
                    <label>ISBN</label>
                    <input value={form.isbn} onChange={e => setForm(f => ({ ...f, isbn: e.target.value }))} placeholder="978-..." />
                  </div>
                  <div className="adm-field">
                    <label>Holat</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="draft">Qoralama</option>
                      <option value="published">Nashr etilgan</option>
                      <option value="archived">Arxivlangan</option>
                    </select>
                  </div>
                </div>

                <div className="adm-field" style={{ marginBottom: '1rem' }}>
                  <label>Tavsif</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                    style={{ background: '#1a2035', border: '1px solid #2a3045', borderRadius: '8px', color: '#e8eaf0', padding: '0.6rem 0.75rem', fontSize: '0.875rem', outline: 'none', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                    placeholder="Kitob haqida qisqacha ma'lumot..." />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="adm-field" style={{ flex: 1 }}>
                    <label>Muqova (emoji)</label>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {COVERS.map(c => (
                        <button type="button" key={c} onClick={() => setForm(f => ({ ...f, cover: c }))}
                          style={{ fontSize: '1.4rem', background: form.cover === c ? '#2a1845' : '#1a2035', border: `2px solid ${form.cover === c ? '#a78bfa' : '#2a3045'}`, borderRadius: '8px', padding: '0.3rem 0.5rem', cursor: 'pointer' }}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="adm-field" style={{ flex: 1 }}>
                    <label>Muqova rasmi (yuklash)</label>
                    <div style={{ border: '2px dashed #2a3045', borderRadius: '8px', padding: '1rem', textAlign: 'center', color: '#4b5580', cursor: 'pointer', fontSize: '0.8rem' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#a78bfa'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#2a3045'}>
                      🖼️ JPG, PNG (max 2 MB)
                    </div>
                  </div>
                  <div className="adm-field" style={{ flex: 1 }}>
                    <label>Fayl (PDF / EPUB)</label>
                    <div style={{ border: '2px dashed #2a3045', borderRadius: '8px', padding: '1rem', textAlign: 'center', color: '#4b5580', cursor: 'pointer', fontSize: '0.8rem' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#a78bfa'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#2a3045'}>
                      📄 PDF, EPUB (max 50 MB)
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="adm-btn adm-btn-secondary" onClick={() => { setShowForm(false); setEditId(null); }}>Bekor qilish</button>
                  <button type="submit" className="adm-btn adm-btn-primary">✅ {editId ? 'Yangilash' : 'Saqlash'}</button>
                </div>
              </form>
            </div>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input style={{ background: '#1a2035', border: '1px solid #2a3045', borderRadius: '8px', color: '#e8eaf0', padding: '0.6rem 1rem', fontSize: '0.875rem', outline: 'none', flex: 1, minWidth: '200px' }}
              placeholder="🔍 Kitob nomi yoki muallif..." value={search} onChange={e => setSearch(e.target.value)} />
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {[['all', 'Barchasi'], ['published', '✅ Nashr'], ['draft', '📝 Qoralama'], ['archived', '📦 Arxiv']].map(([val, label]) => (
                <button key={val} onClick={() => setFilterStatus(val)} className={`adm-btn adm-btn-sm ${filterStatus === val ? 'adm-btn-primary' : 'adm-btn-secondary'}`}>{label}</button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="adm-card" style={{ padding: 0 }}>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr>
                  <th>Muqova</th><th>Kitob</th><th>Janr</th><th>Til</th><th>PDF</th><th>Ko'rishlar</th><th>Holat</th><th>Amallar</th>
                </tr></thead>
                <tbody>
                  {filtered.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontSize: '1.8rem' }}>{b.cover}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#e8eaf0' }}>{b.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#4b5580' }}>{b.author}</div>
                        {b.isbn && <div style={{ fontSize: '0.7rem', color: '#2a3045' }}>{b.isbn}</div>}
                      </td>
                      <td><span className="adm-badge adm-badge-blue">{b.genre}</span></td>
                      <td style={{ fontSize: '0.8rem', color: '#8b92b0' }}>{b.language}</td>
                      <td>{b.has_pdf ? <span className="adm-badge adm-badge-green">✓ PDF</span> : <span style={{ color: '#2a3045' }}>—</span>}</td>
                      <td style={{ color: '#8b92b0', fontSize: '0.85rem' }}>👁 {b.views}</td>
                      <td><span className={`adm-badge ${STATUSES[b.status].cls}`}>{STATUSES[b.status].label}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => { setPreviewBook(b); setTab('preview'); }} title="Ko'rish">👁</button>
                          <button className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => openEdit(b)} title="Tahrirlash">✏️</button>
                          <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => handleDelete(b.id)} title="O'chirish">🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="adm-empty"><span className="adm-empty-icon">📚</span><p>Kitob topilmadi</p></div>}
            </div>
          </div>
        </>
      )}

      {/* ── CATEGORIES TAB ── */}
      {tab === 'categories' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <form onSubmit={addGenre} style={{ display: 'flex', gap: '0.5rem' }}>
              <input style={{ background: '#1a2035', border: '1px solid #2a3045', borderRadius: '8px', color: '#e8eaf0', padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none' }}
                placeholder="Yangi janr nomi..." value={newGenre} onChange={e => setNewGenre(e.target.value)} />
              <button type="submit" className="adm-btn adm-btn-primary">+ Qo'shish</button>
            </form>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            {genres.map(g => {
              const count = books.filter(b => b.genre === g).length;
              return (
                <div key={g} className="adm-card" style={{ padding: '1rem' }}>
                  {editGenre === g ? (
                    <input autoFocus defaultValue={g}
                      style={{ background: '#1a2035', border: '1px solid #a78bfa', borderRadius: '6px', color: '#e8eaf0', padding: '0.4rem 0.6rem', fontSize: '0.875rem', outline: 'none', width: '100%', boxSizing: 'border-box', marginBottom: '0.5rem' }}
                      onBlur={e => saveEditGenre(g, e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEditGenre(g, e.target.value); if (e.key === 'Escape') setEditGenre(null); }} />
                  ) : (
                    <div style={{ fontWeight: 600, color: '#e8eaf0', marginBottom: '0.5rem' }}>🏷️ {g}</div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: '#4b5580', marginBottom: '0.75rem' }}>{count} kitob</div>
                  <div style={{ background: '#1a2035', borderRadius: '4px', height: '4px', marginBottom: '0.75rem', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min((count / books.length) * 100, 100)}%`, height: '100%', background: '#a78bfa' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="adm-btn adm-btn-sm adm-btn-secondary" style={{ flex: 1 }} onClick={() => setEditGenre(g)}>✏️</button>
                    <button className="adm-btn adm-btn-sm adm-btn-danger" style={{ flex: 1 }} onClick={() => deleteGenre(g)}>🗑</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PREVIEW TAB ── */}
      {tab === 'preview' && (
        <div>
          {!previewBook ? (
            <div className="adm-card">
              <div className="adm-empty">
                <span className="adm-empty-icon">👁️</span>
                <p>Ko'rish uchun kitoblar ro'yxatidan 👁 tugmasini bosing</p>
                <button className="adm-btn adm-btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setTab('books')}>📚 Kitoblar ro'yxatiga</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
              {/* Cover panel */}
              <div className="adm-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '6rem', marginBottom: '1rem', padding: '2rem 0', background: '#1a2035', borderRadius: '12px' }}>{previewBook.cover}</div>
                <h3 style={{ color: '#e8eaf0', margin: '0 0 0.25rem' }}>{previewBook.title}</h3>
                <p style={{ color: '#4b5580', fontSize: '0.875rem', margin: '0 0 1rem' }}>{previewBook.author}</p>
                <span className={`adm-badge ${STATUSES[previewBook.status].cls}`}>{STATUSES[previewBook.status].label}</span>
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                  <button className="adm-btn adm-btn-primary" onClick={() => openEdit(previewBook)}>✏️ Tahrirlash</button>
                  {previewBook.has_pdf && <button className="adm-btn adm-btn-secondary">📄 Namuna yuklab olish</button>}
                </div>
              </div>

              {/* Details panel */}
              <div>
                <div className="adm-card" style={{ marginBottom: '1rem' }}>
                  <p className="adm-card-title">📋 Kitob ma'lumotlari</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {[
                      ['Janr', previewBook.genre],
                      ['Til', previewBook.language],
                      ['ISBN', previewBook.isbn || '—'],
                      ['Ko\'rishlar', `👁 ${previewBook.views}`],
                      ['PDF', previewBook.has_pdf ? '✓ Mavjud' : '✗ Yo\'q'],
                      ['Holat', STATUSES[previewBook.status].label],
                    ].map(([label, value]) => (
                      <div key={label} style={{ background: '#1a2035', padding: '0.75rem', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#4b5580', marginBottom: '0.25rem' }}>{label}</div>
                        <div style={{ color: '#e8eaf0', fontSize: '0.875rem', fontWeight: 500 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {previewBook.description && (
                  <div className="adm-card">
                    <p className="adm-card-title">📝 Tavsif</p>
                    <p style={{ color: '#8b92b0', fontSize: '0.875rem', lineHeight: 1.7, margin: 0 }}>{previewBook.description}</p>
                  </div>
                )}
                <div className="adm-card" style={{ marginTop: '1rem' }}>
                  <p className="adm-card-title">📄 1-sahifa namunasi</p>
                  <div style={{ background: '#1a2035', borderRadius: '8px', padding: '1.5rem', minHeight: '120px', fontFamily: 'Georgia, serif', color: '#c4c9e0', fontSize: '0.9rem', lineHeight: 1.8 }}>
                    <p style={{ margin: '0 0 0.75rem', fontWeight: 700, color: '#e8eaf0' }}>{previewBook.title}</p>
                    <p style={{ margin: 0, color: '#8b92b0', fontStyle: 'italic' }}>Muallif: {previewBook.author}</p>
                    <hr style={{ border: 'none', borderTop: '1px solid #2a3045', margin: '0.75rem 0' }} />
                    <p style={{ margin: 0 }}>{previewBook.description || 'PDF fayl yuklanmagan yoki namuna mavjud emas.'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
