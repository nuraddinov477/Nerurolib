import React from 'react';
import '../styles/Loader.css';

function Loader({ message = 'Yuklanmoqda...' }) {
  return (
    <div className="loader-container">
      <div className="loader-spinner">
        <div className="book-loader">
          <span>📚</span>
          <span>📕</span>
          <span>📗</span>
          <span>📘</span>
        </div>
      </div>
      <p className="loader-message">{message}</p>
    </div>
  );
}

export default Loader;
