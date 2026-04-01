import React, { useContext, useState } from 'react';
import { DataContext } from '../context/DataContext';
import '../styles/AdminPDFLibrary.css';

function AdminPDFLibrary() {
  const { addBook, refreshBooks } = useContext(DataContext);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Sample PDF URLs (Ishlayotgan havolalar)
  const samplePDFs = [
    {
      title: 'Alice in Wonderland',
      author: 'Lewis Carroll',
      category: 'Klassik',
      url: 'https://www.gutenberg.org/files/11/11-pdf.pdf',
      cover: '📕'
    },
    {
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      category: 'Klassik',
      url: 'https://www.gutenberg.org/files/1342/1342-pdf.pdf',
      cover: '📗'
    },
    {
      title: 'Moby Dick',
      author: 'Herman Melville',
      category: 'Klassik',
      url: 'https://www.gutenberg.org/files/2701/2701-pdf.pdf',
      cover: '📘'
    },
    {
      title: 'Frankenstein',
      author: 'Mary Shelley',
      category: 'Klassik',
      url: 'https://www.gutenberg.org/files/84/84-pdf.pdf',
      cover: '📙'
    },
    {
      title: 'Dracula',
      author: 'Bram Stoker',
      category: 'Klassik',
      url: 'https://www.gutenberg.org/files/345/345-pdf.pdf',
      cover: '📔'
    },
    {
      title: 'The Adventures of Sherlock Holmes',
      author: 'Arthur Conan Doyle',
      category: 'Detektiv',
      url: 'https://www.gutenberg.org/files/1661/1661-pdf.pdf',
      cover: '📓'
    },
    {
      title: 'A Tale of Two Cities',
      author: 'Charles Dickens',
      category: 'Klassik',
      url: 'https://www.gutenberg.org/files/98/98-pdf.pdf',
      cover: '📒'
    },
    {
      title: 'The Picture of Dorian Gray',
      author: 'Oscar Wilde',
      category: 'Klassik',
      url: 'https://www.gutenberg.org/files/174/174-pdf.pdf',
      cover: '📚'
    }
  ];

  const generatePDFLibrary = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const books = [];

      for (const sample of samplePDFs) {
        const book = {
          title: sample.title,
          author: sample.author,
          category: sample.category,
          price: 0,
          cover: sample.cover,
          description: `Bepul onlayn o'qish uchun ${sample.title}. ${sample.author} tomonidan yozilgan klassik asar.`,
          stock: 999,
          pdf_url: sample.url
        };
        await addBook(book);
        books.push(book);
      }

      await refreshBooks();

      setResult({
        success: true,
        count: books.length,
        books: books
      });

    } catch (err) {
      setError('Xatolik: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pdf-library-container">
      <div className="library-header">
        <h2>📚 Klassik Kutubxona</h2>
        <p>Bepul onlayn o'qish uchun jahon klassik asarlari</p>
      </div>

      <div className="library-info">
        <div className="info-card">
          <h3>ℹ️ Bu Nima?</h3>
          <p>Bu bo'lim jahon klassik asarlarini PDF formatida yuklab, saytga qo'shadi.</p>
          <ul>
            <li>✅ Bepul kitoblar (narx: $0)</li>
            <li>✅ PDF formatida</li>
            <li>✅ Onlayn o'qish</li>
            <li>✅ Yuklab olish mumkin</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>📖 Mavjud Kitoblar:</h3>
          <ul>
            {samplePDFs.map((pdf, i) => (
              <li key={i}>
                {pdf.cover} <strong>{pdf.title}</strong> - {pdf.author}
              </li>
            ))}
          </ul>
        </div>
      </div>

          <button 
        className="btn btn-load-library"
        onClick={generatePDFLibrary}
        disabled={loading}
      >
        {loading ? '⏳ Yuklanmoqda...' : '📚 Klassik Kutubxonani Yuklash'}
      </button>

      {error && (
        <div className="library-error">
          ❌ {error}
        </div>
      )}

      {result && (
        <div className="library-result">
          <div className="result-header">
            <h3>✅ Muvaffaqiyatli!</h3>
            <p>{result.count} ta klassik asar qo'shildi</p>
          </div>
          
          <div className="result-books">
            {result.books.map((book, index) => (
              <div key={index} className="result-book-item">
                <span className="book-cover">{book.cover}</span>
                <div className="book-info">
                  <strong>{book.title}</strong>
                  <span>{book.author}</span>
                  <span className="pdf-badge">📄 PDF</span>
                </div>
                <span className="book-price">BEPUL</span>
              </div>
            ))}
          </div>

          <div className="next-steps">
            <h4>✅ Keyingi Qadamlar:</h4>
            <ol>
              <li>📚 "Kitoblar" sahifasiga o'ting</li>
              <li>📖 Kitobni tanlang</li>
              <li>🔍 "Onlayn O'qish" tugmasini bosing</li>
              <li>📄 PDF ochiladi va o'qishingiz mumkin!</li>
            </ol>
          </div>

          <button 
            className="btn btn-secondary"
            onClick={() => setResult(null)}
          >
            ✔️ OK
          </button>
        </div>
      )}

      <div className="library-note">
        <h4>⚠️ Eslatma:</h4>
        <p>Bu kitoblar <strong>public domain</strong> - mualliflik huquqi tugagan klassik asarlar. Ularni bepul o'qish, yuklab olish va tarqatish mumkin.</p>
        <p>Manba: <a href="https://www.gutenberg.org" target="_blank" rel="noopener noreferrer">Project Gutenberg</a> - 70,000+ bepul kitoblar</p>
        <p><strong>O'zbek kitoblar:</strong> O'zbek kitoblarini qo'shish uchun PDF fayllarni Google Drive yoki boshqa serverga yuklang va havolalarni kiriting.</p>
      </div>
    </div>
  );
}

export default AdminPDFLibrary;
