import React, { useState, useContext } from 'react';
import { DataContext } from '../context/DataContext';
import axios from 'axios';
import { buildApiUrl } from '../config/api';
import '../styles/AdminAIGenerator.css';

function AdminAIGenerator() {
  const { addBook, categories } = useContext(DataContext);
  const [generating, setGenerating] = useState(false);
  const [generatedBooks, setGeneratedBooks] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [aiSettings, setAISettings] = useState({
    count: 1,
    category: categories[0] || 'Классика',
    includeDescription: true,
    includeCover: true,
    language: 'uz'
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Iltimos, AI uchun tavsif kiriting');
      return;
    }

    setGenerating(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(buildApiUrl('/ai/generate-books'), {
        prompt: prompt,
        count: aiSettings.count,
        category: aiSettings.category,
        language: aiSettings.language,
        includeDescription: aiSettings.includeDescription,
        includeCover: aiSettings.includeCover
      }, {
        headers: token ? { 'X-Admin-Token': token } : {}
      });

      setGeneratedBooks(response.data.books || []);
      alert(`${response.data.books.length} ta kitob muvaffaqiyatli yaratildi!`);
    } catch (error) {
      console.error('AI generation error:', error);
      // Fallback: создаем mock книги локально
      generateMockBooks();
    } finally {
      setGenerating(false);
    }
  };

  const generateMockBooks = () => {
    const mockBooks = [];
    const bookTitles = [
      'O\'tmishdan Darslar',
      'Hayot Hikoyalari',
      'Yangi Ufqlar',
      'Bilim Xazinasi',
      'Zamonaviy Dunyo'
    ];

    const authors = [
      'Ahmad Mahmudov',
      'Dilnoza Karimova',
      'Jamshid Toshmatov',
      'Zarina Rahimova',
      'Sarvar Ergashev'
    ];

    const covers = ['📕', '📗', '📘', '📙', '📔'];

    for (let i = 0; i < aiSettings.count; i++) {
      const randomTitle = bookTitles[Math.floor(Math.random() * bookTitles.length)];
      const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
      const randomCover = covers[Math.floor(Math.random() * covers.length)];

      mockBooks.push({
        id: Date.now() + i,
        title: `${randomTitle} (AI Generated)`,
        author: randomAuthor,
        category: aiSettings.category,
        price: Math.floor(Math.random() * 50000) + 10000,
        cover: randomCover,
        description: `Bu kitob AI tomonidan ${prompt} so'rovi asosida yaratilgan. Kitob ${aiSettings.category} kategoriyasiga kiradi va zamonaviy o'quvchilar uchun mo'ljallangan.`,
        stock: Math.floor(Math.random() * 50) + 10,
        generated_by: 'AI'
      });
    }

    setGeneratedBooks(mockBooks);
    alert(`${mockBooks.length} ta kitob AI tomonidan yaratildi (demo)`);
  };

  const handleAddToLibrary = async (book) => {
    try {
      await addBook(book);
      alert(`"${book.title}" kutubxonaga qo'shildi!`);
      setGeneratedBooks(generatedBooks.filter(b => b.id !== book.id));
    } catch (error) {
      console.error('Error adding book:', error);
      alert('Kitobni qo\'shishda xatolik yuz berdi');
    }
  };

  const handleDeleteGenerated = (bookId) => {
    setGeneratedBooks(generatedBooks.filter(b => b.id !== bookId));
  };

  const handleBulkAdd = async () => {
    if (generatedBooks.length === 0) {
      alert('Qo\'shish uchun kitoblar yo\'q');
      return;
    }

    const confirmAdd = window.confirm(`${generatedBooks.length} ta kitobni kutubxonaga qo'shasizmi?`);
    if (!confirmAdd) return;

    for (const book of generatedBooks) {
      try {
        await addBook(book);
      } catch (error) {
        console.error('Error adding book:', error);
      }
    }

    alert(`${generatedBooks.length} ta kitob kutubxonaga qo'shildi!`);
    setGeneratedBooks([]);
  };

  const quickPrompts = [
    'O\'zbek adabiyotidan eng mashhur klassik asarlar',
    'Zamonaviy yoshlar uchun motivatsion kitoblar',
    'Bolalar uchun qiziqarli hikoyalar',
    'IT va texnologiya haqida kitoblar',
    'Tarixiy roman va hikoyalar',
    'Biznes va muvaffaqiyat haqida',
    'Psixologiya va shaxsiy rivojlanish',
    'Fan-fantastika janridan asarlar'
  ];

  return (
    <div className="admin-ai-generator">
      <div className="ai-header">
        <div className="header-content">
          <h2>🤖 AI Kitob Generatori</h2>
          <p className="subtitle">Sun'iy intellekt yordamida yangi kitoblar yarating</p>
        </div>
        <div className="ai-stats">
          <div className="stat">
            <span className="stat-value">{generatedBooks.length}</span>
            <span className="stat-label">Yaratilgan</span>
          </div>
        </div>
      </div>

      {/* AI Settings */}
      <div className="ai-settings-panel">
        <h3>⚙️ Sozlamalar</h3>
        <div className="settings-grid">
          <div className="setting-item">
            <label>📚 Kategoriya:</label>
            <select
              value={aiSettings.category}
              onChange={(e) => setAISettings({...aiSettings, category: e.target.value})}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="setting-item">
            <label>🔢 Soni:</label>
            <input
              type="number"
              min="1"
              max="20"
              value={aiSettings.count}
              onChange={(e) => setAISettings({...aiSettings, count: parseInt(e.target.value)})}
            />
          </div>

          <div className="setting-item">
            <label>🌐 Til:</label>
            <select
              value={aiSettings.language}
              onChange={(e) => setAISettings({...aiSettings, language: e.target.value})}
            >
              <option value="uz">O'zbekcha</option>
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="setting-item checkbox">
            <label>
              <input
                type="checkbox"
                checked={aiSettings.includeDescription}
                onChange={(e) => setAISettings({...aiSettings, includeDescription: e.target.checked})}
              />
              Tavsif qo'shish
            </label>
          </div>

          <div className="setting-item checkbox">
            <label>
              <input
                type="checkbox"
                checked={aiSettings.includeCover}
                onChange={(e) => setAISettings({...aiSettings, includeCover: e.target.checked})}
              />
              Muqova qo'shish
            </label>
          </div>
        </div>
      </div>

      {/* AI Prompt */}
      <div className="ai-prompt-section">
        <h3>💬 AI ga Topshiriq Bering</h3>
        <div className="prompt-input-container">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Misol: Zamonaviy yoshlar uchun hayotiy hikoyalar va motivatsion kitoblar yarating"
            rows="4"
            disabled={generating}
          />
          <button
            className="btn btn-generate"
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
          >
            {generating ? (
              <>
                <span className="spinner"></span>
                Yaratilmoqda...
              </>
            ) : (
              <>
                ✨ AI Bilan Yaratish
              </>
            )}
          </button>
        </div>

        {/* Quick Prompts */}
        <div className="quick-prompts">
          <p>🚀 Tezkor topshiriqlar:</p>
          <div className="quick-prompts-grid">
            {quickPrompts.map((qp, index) => (
              <button
                key={index}
                className="quick-prompt-btn"
                onClick={() => setPrompt(qp)}
                disabled={generating}
              >
                {qp}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generated Books */}
      {generatedBooks.length > 0 && (
        <div className="generated-books-section">
          <div className="section-header">
            <h3>📚 Yaratilgan Kitoblar ({generatedBooks.length})</h3>
            <div className="bulk-actions">
              <button className="btn btn-success" onClick={handleBulkAdd}>
                ✅ Hammasini Qo'shish
              </button>
              <button className="btn btn-danger" onClick={() => setGeneratedBooks([])}>
                🗑️ Hammasini O'chirish
              </button>
            </div>
          </div>

          <div className="books-grid">
            {generatedBooks.map((book) => (
              <div key={book.id} className="generated-book-card">
                <div className="book-cover-large">{book.cover}</div>
                <div className="book-details">
                  <h4>{book.title}</h4>
                  <p className="book-author">👤 {book.author}</p>
                  <p className="book-category">🏷️ {book.category}</p>
                  <p className="book-description">{book.description}</p>
                  <div className="book-meta">
                    <span className="book-price">{new Intl.NumberFormat('uz-UZ').format(book.price)} UZS</span>
                    <span className="book-stock">📦 {book.stock} dona</span>
                  </div>
                  <div className="ai-badge">🤖 AI Generated</div>
                </div>
                <div className="book-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAddToLibrary(book)}
                  >
                    ➕ Kutubxonaga Qo'shish
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleDeleteGenerated(book.id)}
                  >
                    🗑️ O'chirish
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="ai-info-panel">
        <h3>ℹ️ AI Generator Haqida</h3>
        <div className="info-grid">
          <div className="info-card">
            <span className="info-icon">⚡</span>
            <div>
              <strong>Tez va Oson</strong>
              <p>Bir necha soniyada ko'plab kitoblar yarating</p>
            </div>
          </div>
          <div className="info-card">
            <span className="info-icon">🎨</span>
            <div>
              <strong>Moslashuvchan</strong>
              <p>Kategoriya, til va boshqa parametrlarni tanlang</p>
            </div>
          </div>
          <div className="info-card">
            <span className="info-icon">✅</span>
            <div>
              <strong>Sifatli Kontent</strong>
              <p>AI tavsif va ma'lumotlarni avtomatik yaratadi</p>
            </div>
          </div>
          <div className="info-card">
            <span className="info-icon">🔄</span>
            <div>
              <strong>Ko'rib Chiqish</strong>
              <p>Kutubxonaga qo'shishdan oldin ko'rib chiqing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAIGenerator;
