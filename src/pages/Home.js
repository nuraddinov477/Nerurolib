import { useContext, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import '../styles/Home.css';

const CAT_EMOJIS = {
  'Klassik': '📜', 'Klassika': '📜', 'Roman': '📖', 'Detektiv': '🔍',
  'Fantastika': '🚀', "She'riyat": '✍️', 'Bolalar': '🎠',
  'Tarixiy asarlar': '🏛️', 'Tarix': '🏛️', 'Ilmiy': '🔬',
  'Falsafa': '🧠', 'Biografiya': '👤', 'Psixologiya': '💭',
  'Fiction': '📖', 'Non-Fiction': '📋', 'Science': '🔬',
  'History': '🏛️', 'Biography': '👤', 'Классика': '📜',
  'Романтика': '💕', 'Детективы': '🔍', 'Фантастика': '🚀',
};

const PARTNERS = [];

const COVER_COLORS = [
  '#e8f4fd','#fef9e7','#eafaf1','#fdf2f8','#f4ecf7',
  '#ebf5fb','#fdfefe','#fef5e4','#e8f8f5','#f9ebea',
];

function BookCard({ book, onClick, idx = 0 }) {
  const r = parseFloat(book.rating) || 0;
  const bg = COVER_COLORS[idx % COVER_COLORS.length];
  return (
    <div className="m-book-card" onClick={onClick}>
      <div className="m-book-cover" style={{ background: bg }}>
        <span className="m-book-emoji">{book.cover || '📕'}</span>
      </div>
      <div className="m-book-info">
        <p className="m-book-title">{book.title}</p>
        <p className="m-book-author">{book.author}</p>
        {r > 0 && (
          <span className="m-rating">
            <span className="m-star">★</span>
            <span className="m-rating-num">{r.toFixed(1)}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function Home() {
  const { books } = useContext(DataContext);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeAuthor, setActiveAuthor] = useState('');

  const isFiltered = search.trim() || activeCategory || activeAuthor;

  /* Derived data */
  const bookCategories = useMemo(() => {
    const map = {};
    books.forEach(b => { if (b.category) map[b.category] = (map[b.category] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [books]);

  const authors = useMemo(() => {
    const map = {};
    books.forEach(b => { if (b.author) map[b.author] = (map[b.author] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 15);
  }, [books]);

  const topRated = useMemo(() =>
    [...books].sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0)).slice(0, 12),
    [books]
  );

  const newest = useMemo(() =>
    [...books].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 12),
    [books]
  );

  const filteredBooks = useMemo(() => {
    if (!isFiltered) return [];
    let r = books;
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
    }
    if (activeCategory) r = r.filter(b => b.category === activeCategory);
    if (activeAuthor) r = r.filter(b => b.author === activeAuthor);
    return r;
  }, [books, search, activeCategory, activeAuthor, isFiltered]);

  const handleBookClick = (id) => navigate(`/books/${id}/read`);
  const clearFilters = () => { setSearch(''); setActiveCategory(''); setActiveAuthor(''); };

  return (
    <div className="m-home">

      {/* ── Hero ── */}
      {!isFiltered && books.length > 0 && (
        <div className="m-hero">
          <div className="m-hero-text">
            <h1 className="m-hero-title">📚 Neurolib — eng sara elektron kitoblar!</h1>
            <p className="m-hero-sub">O'zbek va jahon adabiyotining eng yaxshi asarlarini bepul o'qing</p>
            <div className="m-hero-btns">
              <button className="m-hero-btn primary" onClick={() => navigate('/books')}>Kitoblarni ko'rish</button>
              <button className="m-hero-btn secondary" onClick={() => { document.querySelector('.m-section')?.scrollIntoView({ behavior: 'smooth' }); }}>Ko'proq bilish ↓</button>
            </div>
          </div>
          <div className="m-hero-books">
            {topRated.slice(0, 4).map((b, i) => (
              <div key={b.id} className="m-hero-book" style={{ '--i': i }} onClick={() => handleBookClick(b.id)}>
                <span>{b.cover || '📕'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Search ── */}
      <div className="m-search-wrap">
        <span className="m-search-icon">🔍</span>
        <input
          className="m-search"
          type="text"
          placeholder="Kitob yoki muallif bo'yicha qidiring..."
          value={search}
          onChange={e => { setSearch(e.target.value); setActiveCategory(''); setActiveAuthor(''); }}
        />
        {search && <button className="m-search-clear" onClick={() => setSearch('')}>×</button>}
      </div>

      {/* ── Category tabs (from real book data) ── */}
      <div className="m-cat-scroll">
        <div className="m-cat-tabs">
          {bookCategories.map(([cat]) => (
            <button
              key={cat}
              className={'m-cat-tab' + (activeCategory === cat ? ' active' : '')}
              onClick={() => { setActiveCategory(p => p === cat ? '' : cat); setSearch(''); setActiveAuthor(''); }}
            >
              {CAT_EMOJIS[cat] || '📚'} {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats banner ── */}
      {!isFiltered && books.length > 0 && (
        <div className="m-stats-bar">
          <div className="m-stat">
            <span className="m-stat-num">{books.length}+</span>
            <span className="m-stat-label">Kitoblar</span>
          </div>
          <div className="m-stat-divider" />
          <div className="m-stat">
            <span className="m-stat-num">{authors.length}+</span>
            <span className="m-stat-label">Mualliflar</span>
          </div>
          <div className="m-stat-divider" />
          <div className="m-stat">
            <span className="m-stat-num">{bookCategories.length}</span>
            <span className="m-stat-label">Janrlar</span>
          </div>
          <div className="m-stat-divider" />
          <div className="m-stat">
            <span className="m-stat-num">∞</span>
            <span className="m-stat-label">Bepul</span>
          </div>
        </div>
      )}

      {/* ── FILTERED RESULTS ── */}
      {isFiltered && (
        <div className="m-filtered-wrap">
          <div className="m-filtered-header">
            <span className="m-filtered-count">
              {filteredBooks.length} ta kitob
              {activeCategory && <em> · {activeCategory}</em>}
              {activeAuthor && <em> · {activeAuthor}</em>}
              {search && <em> · "{search}"</em>}
            </span>
            <button className="m-clear-btn" onClick={clearFilters}>× Tozalash</button>
          </div>
          {filteredBooks.length === 0
            ? <div className="m-empty">Hech narsa topilmadi 📭</div>
            : <div className="m-grid">
                {filteredBooks.map((book, i) => (
                  <BookCard key={book.id} book={book} onClick={() => handleBookClick(book.id)} idx={i} />
                ))}
              </div>
          }
        </div>
      )}

      {/* ── HOME SECTIONS ── */}
      {!isFiltered && (
        <div className="m-sections">

          {/* Eng ko'p o'qilgan */}
          {topRated.length > 0 && (
            <section className="m-section">
              <div className="m-section-header">
                <h2 className="m-section-title">Eng ko'p o'qilgan kitoblar</h2>
                <button className="m-see-all" onClick={() => navigate('/books')}>Barchasi →</button>
              </div>
              <div className="m-books-row">
                {topRated.map((book, i) => <BookCard key={book.id} book={book} onClick={() => handleBookClick(book.id)} idx={i} />)}
              </div>
            </section>
          )}

          {/* Yangi qo'shilgan */}
          {newest.length > 0 && (
            <section className="m-section">
              <div className="m-section-header">
                <h2 className="m-section-title">Yangi qo'shilgan kitoblar</h2>
                <button className="m-see-all" onClick={() => navigate('/books')}>Barchasi →</button>
              </div>
              <div className="m-books-row">
                {newest.map((book, i) => <BookCard key={book.id} book={book} onClick={() => handleBookClick(book.id)} idx={i} />)}
              </div>
            </section>
          )}

          {/* Eng-eng — vertical columns */}
          {books.length > 0 && (
            <section className="m-engeng-section">
              {/* Left: ENG-ENG labels */}
              <div className="m-engeng-left">
                {['ENG-ENG','ENG-ENG','ENG-ENG','ENG-ENG','ENG-ENG','ENG-ENG','ENG-ENG'].map((t, i) => (
                  <span key={i} className={`m-engeng-label ${i === 3 ? 'active' : ''}`}>{t}</span>
                ))}
              </div>
              {/* Right: 3 vertical scrolling columns */}
              <div className="m-engeng-columns">
                {[0, 1, 2].map(col => {
                  const colBooks = [...books].slice(col * 4, col * 4 + 8);
                  const doubled = [...colBooks, ...colBooks];
                  const dir = col === 1 ? 'down' : 'up';
                  return (
                    <div key={col} className="m-engeng-col">
                      <div className={`m-engeng-track m-engeng-${dir}`}>
                        {doubled.map((book, i) => (
                          <div
                            key={i}
                            className="m-engeng-card"
                            onClick={() => handleBookClick(book.id)}
                          >
                            <div className="m-engeng-cover" style={{ background: COVER_COLORS[(col * 8 + i) % COVER_COLORS.length] }}>
                              <span className="m-engeng-emoji">{book.cover || '📕'}</span>
                            </div>
                            <div className="m-engeng-info">
                              <p className="m-engeng-title">{book.title}</p>
                              <p className="m-engeng-author">{book.author}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Janrlar */}
          {bookCategories.length > 0 && (
            <section className="m-section">
              <div className="m-section-header">
                <h2 className="m-section-title">Janrlar</h2>
              </div>
              <div className="m-cat-cards-row">
                {bookCategories.map(([cat, count]) => (
                  <div key={cat} className="m-cat-card" onClick={() => { setActiveCategory(cat); setSearch(''); setActiveAuthor(''); }}>
                    <span className="m-cat-card-emoji">{CAT_EMOJIS[cat] || '📚'}</span>
                    <span className="m-cat-card-name">{cat}</span>
                    <span className="m-cat-card-count">{count} kitob</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Mualliflar */}
          {authors.length > 0 && (
            <section className="m-section">
              <div className="m-section-header">
                <h2 className="m-section-title">Mualliflar</h2>
              </div>
              <div className="m-authors-row">
                {authors.map(([name, count]) => (
                  <div key={name} className="m-author-card" onClick={() => { setActiveAuthor(name); setActiveCategory(''); setSearch(''); }}>
                    <div className="m-author-avatar">{name.charAt(0).toUpperCase()}</div>
                    <p className="m-author-name">{name}</p>
                    <p className="m-author-count">{count} kitob</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Platforma haqida — CTA banner */}
          <section className="m-cta-section">
            <div className="m-cta-inner">
              <div className="m-cta-text">
                <h2 className="m-cta-title">📚 Neurolib — onlayn kutubxona</h2>
                <p className="m-cta-desc">
                  O'zbek va jahon adabiyotining eng sara asarlarini bir joyda — bepul, ro'yxatdan o'tmasdan o'qing.
                </p>
                <div className="m-cta-features">
                  <span className="m-cta-feat">✓ Bepul o'qish</span>
                  <span className="m-cta-feat">✓ {books.length}+ kitob</span>
                  <span className="m-cta-feat">✓ Qurilma tanlovi yo'q</span>
                </div>
              </div>
              <button className="m-cta-btn" onClick={() => navigate('/books')}>
                Kitoblarni ko'rish →
              </button>
            </div>
          </section>


          {/* Loyiha haqida */}
          <section className="m-about-section" id="loyiha-haqida">

            {/* Top hero */}
            <div className="m-about-hero">
              <div className="m-about-badge">📚 Platforma haqida</div>
              <h2 className="m-about-hero-title">Ilm ulashuv platformasi</h2>
              <p className="m-about-hero-sub">
                Neurolib — bilimni hamma uchun ochiq, bepul va qulay qilish maqsadida yaratilgan
                onlayn kutubxona. O'zbek va jahon adabiyotining eng sara asarlarini
                bir joyda topasiz.
              </p>
              <div className="m-about-stats-row">
                <div className="m-about-stat"><span>{books.length}+</span>Kitob</div>
                <div className="m-about-stat-div"/>
                <div className="m-about-stat"><span>{authors.length}+</span>Muallif</div>
                <div className="m-about-stat-div"/>
                <div className="m-about-stat"><span>{bookCategories.length}</span>Janr</div>
                <div className="m-about-stat-div"/>
                <div className="m-about-stat"><span>∞</span>Bepul</div>
              </div>
            </div>

            {/* Features grid */}
            <div className="m-about-features">
              {[
                { icon: '📖', title: 'Bepul o\'qish', desc: 'Barcha kitoblar to\'liq bepul. Ro\'yxatdan o\'tish, to\'lov yoki reklama yo\'q.' },
                { icon: '🌐', title: 'Istalgan qurilma', desc: 'Telefon, planshet yoki kompyuter — har qanday qurilmadan muammosiz o\'qing.' },
                { icon: '🔍', title: 'Aqlli qidiruv', desc: 'Kitob nomi, muallif yoki janr bo\'yicha bir zumda qidiring va toping.' },
                { icon: '❤️', title: 'Sevimlilar', desc: 'Yoqtirgan kitoblaringizni sevimlilar ro\'yxatiga qo\'shib, keyinroq davom eting.' },
                { icon: '🌙', title: 'Tungi rejim', desc: 'Ko\'zga qulay qorong\'i rejim — gechalari ham charchamay o\'qing.' },
                { icon: '🎓', title: 'Ilmiy asarlar', desc: 'Badiiy adabiyot bilan birga ilmiy, falsafiy va ta\'limiy kitoblar ham mavjud.' },
              ].map(f => (
                <div key={f.title} className="m-about-feat-card">
                  <span className="m-about-feat-icon">{f.icon}</span>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Mission + Contact */}
            <div className="m-about-bottom">
              <div className="m-about-mission">
                <h3>🎯 Missiyamiz</h3>
                <p>
                  O'zbekistonda kitob o'qish madaniyatini rivojlantirish va bilimni hamma uchun
                  teng va bepul qilish. Har bir inson — yoshi, moddiy ahvoli yoki joyi qanday
                  bo'lishidan qat'i nazar — dunyo bilimidan bahramand bo'lishi kerak.
                </p>
                <div className="m-about-tags">
                  <span>✅ Bepul</span>
                  <span>✅ Reklamasiz</span>
                  <span>✅ Ro'yxatsiz</span>
                  <span>✅ Ochiq manba</span>
                </div>
              </div>
              <div className="m-about-contact">
                <h3>📬 Bog'lanish</h3>
                <p>Taklif, fikr yoki xatolik haqida yozing — biz qulamiz!</p>
                <div className="m-about-contact-links">
                  <a href="mailto:neurolib@gmail.com" className="m-about-link">
                    <span>✉️</span> neurolib@gmail.com
                  </a>
                  <a href="https://t.me/neurolib" className="m-about-link">
                    <span>💬</span> Telegram: @neurolib
                  </a>
                </div>
                <div className="m-about-socials">
                  <span className="m-about-social">🐦 Twitter</span>
                  <span className="m-about-social">📘 Facebook</span>
                  <span className="m-about-social">📸 Instagram</span>
                </div>
              </div>
            </div>

          </section>

        </div>
      )}

    </div>
  );
}

export default Home;
