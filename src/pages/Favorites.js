import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import '../styles/Cart.css';

function Favorites() {
  const { books } = useContext(DataContext);
  const navigate = useNavigate();
  const [favoriteIds, setFavoriteIds] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('favorites') || '[]');
    setFavoriteIds(saved);
  }, []);

  const favoriteBooks = books.filter(b => favoriteIds.includes(b.id));

  const removeFavorite = (bookId) => {
    const updated = favoriteIds.filter(id => id !== bookId);
    setFavoriteIds(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
  };

  const clearAll = () => {
    setFavoriteIds([]);
    localStorage.setItem('favorites', JSON.stringify([]));
  };

  return (
    <div className="cart-page">
      <h1>❤️ Sevimli kitoblar</h1>

      {favoriteBooks.length === 0 ? (
        <div className="empty-cart">
          <p>Hali sevimli kitob qo'shilmagan</p>
          <Link to="/books" className="btn btn-primary">📚 Kitoblar javoniga o'tish</Link>
        </div>
      ) : (
        <>
          <p className="favorites-count">{favoriteBooks.length} ta kitob saqlangan</p>
          <div className="books-grid favorites-grid">
            {favoriteBooks.map(book => (
              <div key={book.id} className="book-card">
                <button
                  className="favorite-btn active"
                  onClick={() => removeFavorite(book.id)}
                  title="Sevimlilardan olib tashlash"
                >❤️</button>
                <div className="book-cover">{book.cover}</div>
                <h3>{book.title}</h3>
                <p className="author">{book.author}</p>
                <p className="category">{book.category}</p>
                <div className="card-actions">
                  <button
                    className="btn btn-read-online"
                    onClick={() => navigate(`/books/${book.id}/read`)}
                  >
                    📖 O'qishni boshlash
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button className="btn btn-secondary" onClick={clearAll}>
              🗑️ Hammasini tozalash
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Favorites;
