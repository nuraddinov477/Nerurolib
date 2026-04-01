import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/Books.css';

function Books() {
  const { books, categories } = useContext(DataContext);
  const { t } = useContext(LanguageContext);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredBooks = books.filter(book => {
    const categoryMatch = selectedCategory === 'All' || book.category === selectedCategory;
    const searchMatch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       book.author.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  return (
    <div className="books-page">
      <div className="books-hero">
        <h1>🗄️ Kitoblar Javoni</h1>
        <p className="books-subtitle">Barcha kitoblar bu yerda. Qidiring, filtrlang va o'qing!</p>
        <div className="books-stats">
          <div className="stat-item">
            <span className="stat-number">{books.length}</span>
            <span className="stat-label">Kitoblar</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{categories.length}</span>
            <span className="stat-label">Kategoriyalar</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{filteredBooks.length}</span>
            <span className="stat-label">Natijalar</span>
          </div>
        </div>
      </div>

      <div className="books-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters">
          <button
            className={`filter-btn ${selectedCategory === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('All')}
          >
            {t('allCategories')}
          </button>
          {categories.map(category => (
            <button
              key={category}
              className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="books-grid">
        {filteredBooks.length > 0 ? (
          filteredBooks.map(book => (
            <div key={book.id} className="book-item clickable-card" onClick={() => navigate(`/books/${book.id}/read`)}>
              <div className="book-cover-large">{book.cover}</div>
              <h3>{book.title}</h3>
              <p className="author">{book.author}</p>
              <p className="description">{book.description}</p>
            </div>
          ))
        ) : (
          <p className="no-results">{t('noResults')}</p>
        )}
      </div>
    </div>
  );
}

export default Books;
