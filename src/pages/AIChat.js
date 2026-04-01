import { useState, useRef, useEffect, useContext } from 'react';
import { DataContext } from '../context/DataContext';
import { buildApiUrl } from '../config/api';
import '../styles/AIChat.css';

const AI_CHAT_URL = buildApiUrl('/ai/chat');
const AI_RECOMMEND_URL = buildApiUrl('/ai/recommend');
const AI_SEARCH_URL = buildApiUrl('/ai/search');

const MOODS = [
  { emoji: '😄', label: 'Xursand', value: 'xursand' },
  { emoji: '😢', label: "G'amgin", value: 'gamgin' },
  { emoji: '🤔', label: "O'rganmoq", value: 'organmoq' },
  { emoji: '😴', label: 'Dam olish', value: 'dam_olish' },
  { emoji: '💪', label: 'Motivatsiya', value: 'motivatsiya' },
  { emoji: '🔥', label: 'Ilhom', value: 'ilhom' },
];

const LEVELS = [
  { label: "Boshlang'ich", value: 'boshlangich' },
  { label: "O'rta", value: 'orta' },
  { label: "Ilg'or", value: 'ilgor' },
];

const GOALS = [
  { label: "O'rganish", value: 'organish' },
  { label: 'Ko\'ngil ochar', value: 'kongilоchar' },
  { label: 'Ilhom olish', value: 'ilhom' },
  { label: 'Kasbiy rivojlanish', value: 'kasbiy' },
];

export default function AIChat() {
  const { books } = useContext(DataContext);
  const [tab, setTab] = useState('chat'); // 'chat' | 'recommend' | 'search'

  // --- CHAT STATE ---
  const [selectedBook, setSelectedBook] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'ai', text: '👋 Salom! Men Neurolib AI yordamchisiman.\nQaysi kitob haqida suhbatlashmoqchisiz? Yoki shunchaki adabiyot haqida savol bering!' }
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // --- RECOMMEND STATE ---
  const [mood, setMood] = useState('');
  const [level, setLevel] = useState('');
  const [goal, setGoal] = useState('');
  const [recommendations, setRecommendations] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recMessage, setRecMessage] = useState('');

  // --- SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return;
    const userMsg = { role: 'user', text: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setChatLoading(true);
    try {
      const res = await fetch(AI_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.text,
          bookContext: selectedBook ? `${selectedBook.title} - ${selectedBook.author}` : '',
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages(prev => [...prev, { role: 'ai', text: data.reply || data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: '❌ Xatolik: ' + err.message }]);
    } finally {
      setChatLoading(false);
    }
  };

  const getRecommendations = async () => {
    if (!mood || recLoading) return;
    setRecLoading(true);
    setRecommendations(null);
    try {
      const res = await fetch(AI_RECOMMEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, level, goal, books }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRecommendations(data.recommendations || []);
      setRecMessage(data.message || '');
    } catch (err) {
      setRecMessage('❌ Xatolik: ' + err.message);
    } finally {
      setRecLoading(false);
    }
  };

  const aiSearch = async () => {
    if (!searchQuery.trim() || searchLoading) return;
    setSearchLoading(true);
    setSearchResults([]);
    try {
      const res = await fetch(AI_SEARCH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, books }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const found = (data.results || [])
        .map(title => books.find(b => b.title === title))
        .filter(Boolean);
      setSearchResults(found);
    } catch (err) {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="ai-page">
      {/* ── LEFT SIDEBAR ── */}
      <div className="ai-sidebar">
        <div className="ai-sidebar-logo">🤖 AI Yordamchi</div>
        <nav className="ai-sidebar-nav">
          <button className={`ai-sidebar-btn ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>
            <span>💬</span> AI Chat
          </button>
          <button className={`ai-sidebar-btn ${tab === 'recommend' ? 'active' : ''}`} onClick={() => setTab('recommend')}>
            <span>✨</span> Tavsiya
          </button>
          <button className={`ai-sidebar-btn ${tab === 'search' ? 'active' : ''}`} onClick={() => setTab('search')}>
            <span>🔍</span> Aqlli qidiruv
          </button>
        </nav>
        {/* Book list in sidebar */}
        <div className="ai-sidebar-books">
          <p className="ai-sidebar-books-label">Kitob tanlang:</p>
          <button
            className={`ai-sidebar-book-item ${!selectedBook ? 'active' : ''}`}
            onClick={() => setSelectedBook(null)}
          >📚 Umumiy suhbat</button>
          {books.slice(0, 20).map(b => (
            <button
              key={b.id}
              className={`ai-sidebar-book-item ${selectedBook?.id === b.id ? 'active' : ''}`}
              onClick={() => setSelectedBook(b)}
            >
              {b.cover || '📕'} {b.title}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="ai-main">

      {/* ── CHAT TAB ── */}
      {tab === 'chat' && (
        <div className="ai-chat-wrap">
          {/* Selected book badge */}
          {selectedBook && (
            <div className="ai-selected-book-badge">
              {selectedBook.cover || '📕'} <strong>{selectedBook.title}</strong> haqida suhbat
              <button onClick={() => setSelectedBook(null)}>✕</button>
            </div>
          )}

          {/* Messages */}
          <div className="ai-messages">
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role}`}>
                {m.role === 'ai' && <span className="ai-msg-avatar">🤖</span>}
                <div className="ai-msg-bubble">
                  {m.text.split('\n').map((line, j) => (
                    <span key={j}>{line}{j < m.text.split('\n').length - 1 && <br />}</span>
                  ))}
                </div>
                {m.role === 'user' && <span className="ai-msg-avatar user-av">👤</span>}
              </div>
            ))}
            {chatLoading && (
              <div className="ai-msg ai">
                <span className="ai-msg-avatar">🤖</span>
                <div className="ai-msg-bubble ai-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="ai-input-row">
            <input
              className="ai-input"
              placeholder="Savol bering... (masalan: 'Bu kitob qanday tugaydi?')"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            />
            <button className="ai-send-btn" onClick={sendMessage} disabled={chatLoading || !input.trim()}>
              {chatLoading ? '⏳' : '➤'}
            </button>
          </div>
        </div>
      )}

      {/* ── RECOMMEND TAB ── */}
      {tab === 'recommend' && (
        <div className="ai-recommend-wrap">
          <h2 className="ai-section-title">Bugun qanday kitob o'qiysiz?</h2>

          <div className="ai-filter-group">
            <label>Kayfiyatingiz:</label>
            <div className="ai-mood-row">
              {MOODS.map(m => (
                <button
                  key={m.value}
                  className={`ai-mood-btn ${mood === m.value ? 'active' : ''}`}
                  onClick={() => setMood(m.value)}
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ai-filter-group">
            <label>Daraja:</label>
            <div className="ai-chip-row">
              {LEVELS.map(l => (
                <button
                  key={l.value}
                  className={`ai-chip ${level === l.value ? 'active' : ''}`}
                  onClick={() => setLevel(l.value)}
                >{l.label}</button>
              ))}
            </div>
          </div>

          <div className="ai-filter-group">
            <label>Maqsad:</label>
            <div className="ai-chip-row">
              {GOALS.map(g => (
                <button
                  key={g.value}
                  className={`ai-chip ${goal === g.value ? 'active' : ''}`}
                  onClick={() => setGoal(g.value)}
                >{g.label}</button>
              ))}
            </div>
          </div>

          <button
            className="ai-get-rec-btn"
            onClick={getRecommendations}
            disabled={!mood || recLoading}
          >
            {recLoading ? '⏳ Tavsiya tayyorlanmoqda...' : '✨ Tavsiya olish'}
          </button>

          {recMessage && <p className="ai-rec-message">{recMessage}</p>}

          {recommendations && (
            <div className="ai-rec-cards">
              {recommendations.map((r, i) => {
                const book = books.find(b => b.title === r.title);
                return (
                  <div key={i} className="ai-rec-card">
                    <div className="ai-rec-num">{i + 1}</div>
                    <div className="ai-rec-cover">{book?.cover || '📕'}</div>
                    <div className="ai-rec-info">
                      <h3>{r.title}</h3>
                      <p className="ai-rec-author">{book?.author || ''}</p>
                      <p className="ai-rec-reason">💡 {r.reason}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SMART SEARCH TAB ── */}
      {tab === 'search' && (
        <div className="ai-search-wrap">
          <h2 className="ai-section-title">Aqlli qidiruv</h2>
          <p className="ai-search-hint">Oddiy so'z bilan yozing — AI tushunadi</p>

          <div className="ai-search-examples">
            {[
              'menga motivatsiya beradigan kitob',
              'AI haqida boshlang\'ich kitob',
              'uxlashdan oldin engil o\'qish',
              'o\'zbek klassik adabiyoti',
            ].map(ex => (
              <button key={ex} className="ai-example-chip" onClick={() => setSearchQuery(ex)}>
                {ex}
              </button>
            ))}
          </div>

          <div className="ai-search-row">
            <input
              className="ai-search-input"
              placeholder="Masalan: menga motivatsiya beradigan kitob..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && aiSearch()}
            />
            <button className="ai-search-btn" onClick={aiSearch} disabled={searchLoading || !searchQuery.trim()}>
              {searchLoading ? '⏳' : '🔍 Qidirish'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="ai-search-results">
              {searchResults.map((book, i) => (
                <div key={book.id} className="ai-search-card">
                  <span className="ai-search-rank">#{i + 1}</span>
                  <span className="ai-search-cover">{book.cover || '📕'}</span>
                  <div className="ai-search-info">
                    <h3>{book.title}</h3>
                    <p>{book.author} · {book.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchLoading && (
            <div className="ai-search-loading">🤖 AI qidirmoqda...</div>
          )}
        </div>
      )}
      </div>{/* ai-main */}
    </div>
  );
}
