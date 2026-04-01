import { useContext, useState } from 'react';
import { DataContext } from '../context/DataContext';
import { buildApiUrl } from '../config/api';
import '../styles/AdminAutoImport.css';

const API = buildApiUrl();

const QUICK_SEARCHES = [
  { label: '📜 Tarix', query: 'history' },
  { label: '🔬 Fan', query: 'science nature' },
  { label: '🔍 Detektiv', query: 'detective mystery sherlock' },
  { label: '🧙 Fantastika', query: 'fantasy science fiction wells verne' },
  { label: '💝 Muhabbat', query: 'romance love' },
  { label: '🌍 Sayohat', query: 'adventure travel exploration' },
  { label: '🧠 Falsafa', query: 'philosophy wisdom' },
  { label: '📖 Klassika', query: 'classic literature dickens twain' },
  { label: '👮 Jinoyat', query: 'crime thriller agatha christie' },
  { label: '🏰 Tarixiy roman', query: 'historical novel medieval' },
];

const LANGUAGES = [
  { code: '', label: '🌐 Barcha tillar' },
  { code: 'en', label: '🇬🇧 Ingliz' },
  { code: 'ru', label: '🇷🇺 Rus' },
  { code: 'fr', label: '🇫🇷 Fransuz' },
  { code: 'de', label: '🇩🇪 Nemis' },
  { code: 'es', label: '🇪🇸 Ispan' },
  { code: 'it', label: '🇮🇹 Italyan' },
  { code: 'zh', label: '🇨🇳 Xitoy' },
  { code: 'ar', label: '🇸🇦 Arab' },
  { code: 'pt', label: '🇵🇹 Portugal' },
  { code: 'fi', label: '🇫🇮 Fin' },
];

const REGIONS = [
  { code: '', label: '🌍 Barcha mintaqalar' },
  { code: 'american', label: '🇺🇸 Amerika' },
  { code: 'british', label: '🇬🇧 Britaniya' },
  { code: 'russian', label: '🇷🇺 Rus' },
  { code: 'french', label: '🇫🇷 Fransuz' },
  { code: 'german', label: '🇩🇪 Nemis' },
  { code: 'chinese', label: '🇨🇳 Xitoy' },
  { code: 'latin', label: '🏛️ Lotin (antik)' },
  { code: 'oriental', label: '🌏 Sharq' },
  { code: 'african', label: '🌍 Afrika' },
  { code: 'indian', label: '🇮🇳 Hind' },
  { code: 'scandinavian', label: '🇸🇪 Skandinaviya' },
];

function AdminAutoImport() {
  const { refreshBooks } = useContext(DataContext);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(10);
  const [language, setLanguage] = useState('');
  const [region, setRegion] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundBooks, setFoundBooks] = useState([]);
  const [removed, setRemoved] = useState(new Set());
  const [importing, setImporting] = useState(false);
  const [importingIdx, setImportingIdx] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const token = localStorage.getItem('adminToken');

  const searchBooks = async (customQuery) => {
    const q = (customQuery || query).trim();
    if (!q) { setError("Qidiruv so'zini kiriting!"); return; }
    setSearching(true);
    setError('');
    setFoundBooks([]);
    setRemoved(new Set());
    setResult(null);

    try {
      const res = await fetch(`${API}/books/import/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
        body: JSON.stringify({ query: q, limit, language, region })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server xatosi');
      if (!data.books || data.books.length === 0) {
        setError('Hech narsa topilmadi. Boshqa so\'z yoki filtr sinab ko\'ring.');
        return;
      }
      setFoundBooks(data.books);
    } catch (err) {
      setError('❌ ' + err.message);
    } finally {
      setSearching(false);
    }
  };

  const removeBook = (idx) => setRemoved(prev => new Set([...prev, idx]));
  const restoreBook = (idx) => {
    setRemoved(prev => { const n = new Set(prev); n.delete(idx); return n; });
  };

  const toImport = foundBooks.filter((_, i) => !removed.has(i));

  const importAll = async () => {
    if (!toImport.length) { setError('Hech bo\'lmaganda 1 ta kitob kerak!'); return; }
    setImporting(true);
    setError('');
    try {
      for (let i = 0; i < toImport.length; i++) {
        setImportingIdx(i + 1);
        await fetch(`${API}/books/import/do`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
          body: JSON.stringify({ books: [toImport[i]] })
        });
      }
      await refreshBooks();
      setResult({ count: toImport.length, books: toImport });
      setFoundBooks([]);
      setRemoved(new Set());
    } catch (err) {
      setError('❌ ' + err.message);
    } finally {
      setImporting(false);
      setImportingIdx(null);
    }
  };

  return (
    <div className="auto-import-container">
      <div className="import-header">
        <h2>🌐 Internetdan Kitob Yuklash</h2>
        <p>Project Gutenberg — 70,000+ bepul kitob • Til va mintaqa bo'yicha filtrlash</p>
      </div>

      {/* Quick searches */}
      <div className="quick-searches">
        <p>Tezkor qidiruv:</p>
        <div className="quick-btns">
          {QUICK_SEARCHES.map(s => (
            <button
              key={s.query}
              className="quick-btn"
              onClick={() => { setQuery(s.query); searchBooks(s.query); }}
              disabled={searching}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search form */}
      <div className="import-form">
        <div className="search-row">
          <input
            type="text"
            placeholder="Kitob nomi, muallif yoki mavzu (inglizcha)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchBooks()}
            disabled={searching}
            className="search-input"
          />
          <select value={limit} onChange={e => setLimit(parseInt(e.target.value))} disabled={searching} className="limit-select">
            {[5, 10, 15, 20, 30].map(n => (
              <option key={n} value={n}>{n} ta</option>
            ))}
          </select>
          <button className="btn btn-import" onClick={() => searchBooks()} disabled={searching || !query.trim()}>
            {searching ? '⏳ Qidirilmoqda...' : '🔍 Qidirish'}
          </button>
        </div>

        {/* Filters */}
        <div className="filter-row">
          <div className="filter-group">
            <label>🗣️ Til:</label>
            <div className="filter-chips">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  className={`filter-chip ${language === l.code ? 'active' : ''}`}
                  onClick={() => setLanguage(l.code)}
                  disabled={searching}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>🗺️ Mintaqa:</label>
            <div className="filter-chips">
              {REGIONS.map(r => (
                <button
                  key={r.code}
                  className={`filter-chip ${region === r.code ? 'active' : ''}`}
                  onClick={() => setRegion(r.code)}
                  disabled={searching}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {(language || region) && (
            <div className="active-filters">
              <span>Faol filtrlar:</span>
              {language && <span className="active-filter-tag">{LANGUAGES.find(l => l.code === language)?.label}</span>}
              {region && <span className="active-filter-tag">{REGIONS.find(r => r.code === region)?.label}</span>}
              <button className="clear-filters" onClick={() => { setLanguage(''); setRegion(''); }}>✕ Tozalash</button>
            </div>
          )}
        </div>
      </div>

      {error && <div className="import-error">{error}</div>}

      {searching && (
        <div className="searching-state">
          <div className="search-spinner"></div>
          <p>Internetdan kitoblar qidirilmoqda...</p>
        </div>
      )}

      {/* Found books */}
      {foundBooks.length > 0 && !searching && (
        <div className="found-books">
          <div className="found-header">
            <div>
              <strong>{foundBooks.length} ta kitob topildi</strong>
              <span className="found-sub"> • {toImport.length} ta saytga qo'shiladi</span>
            </div>
            <span className="found-hint">❌ ni bosib kerakmasini o'chiring</span>
          </div>

          <div className="found-list">
            {foundBooks.map((book, idx) => (
              <div key={idx} className={`found-item ${removed.has(idx) ? 'removed' : ''}`}>
                <div className="book-thumb">
                  {book.cover_img
                    ? <img src={book.cover_img} alt="" onError={e => e.target.style.display = 'none'} />
                    : <span className="book-emoji">{book.cover}</span>}
                </div>
                <div className="book-meta">
                  <strong className="book-title">{book.title}</strong>
                  <span className="book-author">{book.author}</span>
                  <div className="book-tags">
                    <span className="tag-pdf">📄 HTML</span>
                    {book.languages?.map(l => {
                      const lang = LANGUAGES.find(x => x.code === l);
                      return lang ? <span key={l} className="tag-lang">{lang.label}</span> : null;
                    })}
                  </div>
                </div>
                {removed.has(idx) ? (
                  <button className="btn-restore" onClick={() => restoreBook(idx)}>↩️ Qaytarish</button>
                ) : (
                  <button className="btn-remove" onClick={() => removeBook(idx)}>✕</button>
                )}
              </div>
            ))}
          </div>

          {toImport.length > 0 && (
            <div className="import-action">
              {importing && (
                <div className="import-progress">
                  <div className="progress-bar" style={{ width: `${(importingIdx / toImport.length) * 100}%` }}></div>
                  <span>{importingIdx} / {toImport.length} ta yuklanmoqda...</span>
                </div>
              )}
              <button className="btn btn-import btn-do-import" onClick={importAll} disabled={importing}>
                {importing ? `⏳ Yuklanmoqda ${importingIdx}/${toImport.length}...` : `⬇️ ${toImport.length} ta kitobni saytga qo'shish`}
              </button>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="import-result">
          <div className="result-success-banner">✅ {result.count} ta kitob muvaffaqiyatli qo'shildi!</div>
          <div className="result-books">
            {result.books.map((book, i) => (
              <div key={i} className="result-book-item">
                <span>{book.cover}</span>
                <div className="book-info">
                  <strong>{book.title}</strong>
                  <span>{book.author}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-secondary" onClick={() => setResult(null)}>✔️ Yangi qidiruv</button>
        </div>
      )}

      {!foundBooks.length && !searching && !result && (
        <div className="import-info">
          <h4>Qanday ishlaydi?</h4>
          <div className="steps">
            <div className="step"><span className="step-num">1</span><p>Tezkor tugma bosing <strong>yoki</strong> so'z kiriting, til va mintaqani tanlang</p></div>
            <div className="step"><span className="step-num">2</span><p>Topilgan kitoblar ro'yxatidan kerakmaslari yonidagi <strong>✕</strong> ni bosib o'chiring</p></div>
            <div className="step"><span className="step-num">3</span><p><strong>"Saytga qo'shish"</strong> tugmasini bosing</p></div>
          </div>
          <p className="source-note">Manba: <strong>Project Gutenberg</strong> — 70,000+ bepul, qonuniy kitoblar.</p>
        </div>
      )}
    </div>
  );
}

export default AdminAutoImport;
