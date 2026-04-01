import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import DOMPurify from 'dompurify';
import { DataContext } from '../context/DataContext';
import { buildApiUrl } from '../config/api';
import '../styles/BookReader.css';

// Set up PDF.js worker from local public folder (no CDN dependency)
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`;

const AI_API = buildApiUrl('/ai');

function BookReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { books, booksLoading } = React.useContext(DataContext);
  const [book, setBook] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // AI Summary
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  // AI Translation
  const [showTranslate, setShowTranslate] = useState(false);
  const [translateText, setTranslateText] = useState('');
  const [translateResult, setTranslateResult] = useState('');
  const [translateLang, setTranslateLang] = useState("O'zbek");
  const [translateLoading, setTranslateLoading] = useState(false);

  // External content (Gutenberg)
  const [externalContent, setExternalContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('readerDark') === 'true');

  // HTML sahifa raqami (scroll asosida)
  const [htmlPage, setHtmlPage] = useState(1);
  const [htmlTotalPages, setHtmlTotalPages] = useState(0);
  const [htmlPageInput, setHtmlPageInput] = useState('');

  const goToHtmlPage = (pageNum) => {
    const p = parseInt(pageNum);
    if (!p || p < 1 || p > htmlTotalPages) return;
    const content = document.querySelector('.reader-content');
    if (!content) return;
    content.scrollTop = (p - 1) * content.clientHeight;
  };

  const fetchSummary = async (b) => {
    const cacheKey = `summary_${b.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { setSummaryText(cached); setShowSummary(true); return; }
    setSummaryLoading(true);
    setShowSummary(true);
    try {
      const res = await fetch(`${AI_API}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: b.title, author: b.author, category: b.category, description: b.description }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSummaryText(data.summary);
      localStorage.setItem(cacheKey, data.summary);
    } catch (err) {
      setSummaryText('❌ Xatolik: ' + err.message);
    } finally {
      setSummaryLoading(false);
    }
  };

  const translateContent = async () => {
    if (!translateText.trim() || translateLoading) return;
    setTranslateLoading(true);
    setTranslateResult('');
    try {
      const res = await fetch(`${AI_API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Quyidagi matnni ${translateLang} tiliga tarjima qil. Faqat tarjimani yoz, boshqa hech narsa qo'shma:\n\n"${translateText}"`,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTranslateResult(data.reply);
    } catch (err) {
      setTranslateResult('❌ Xatolik: ' + err.message);
    } finally {
      setTranslateLoading(false);
    }
  };

  // Navbar va footer yashirish
  useEffect(() => {
    document.body.classList.add('reader-mode');
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.classList.remove('reader-mode');
      document.body.style.overflow = '';
    };
  }, []);

  // Dark mode saqlash
  useEffect(() => {
    localStorage.setItem('readerDark', darkMode);
  }, [darkMode]);

  // Har bir sahifaga raqam markeri qo'yish
  useEffect(() => {
    if (!externalContent || externalContent.startsWith('__error__:')) return;
    const timer = setTimeout(() => {
      const scrollEl = document.querySelector('.reader-content');
      const contentEl = document.querySelector('.book-html-content');
      if (!scrollEl || !contentEl) return;

      // Oldingi markerlarni o'chirish
      contentEl.querySelectorAll('.page-marker').forEach(el => el.remove());

      const pageH = scrollEl.clientHeight;
      if (pageH <= 0) return;

      let pageNum = 1;
      let nextBoundary = pageH;
      const children = Array.from(contentEl.children);

      for (const child of children) {
        if (child.offsetTop >= nextBoundary) {
          const marker = document.createElement('div');
          marker.className = 'page-marker';
          marker.textContent = `— ${pageNum} —`;
          contentEl.insertBefore(marker, child);
          pageNum++;
          nextBoundary = child.offsetTop + pageH;
        }
      }
      setHtmlTotalPages(pageNum);

      // Scroll tracking
      const handler = () => {
        const current = Math.min(pageNum, Math.floor(scrollEl.scrollTop / pageH) + 1);
        setHtmlPage(current);
      };
      scrollEl.addEventListener('scroll', handler);
      handler();
      // cleanup stored on element to remove later
      scrollEl._pageHandler = handler;
    }, 600);

    return () => {
      clearTimeout(timer);
      const scrollEl = document.querySelector('.reader-content');
      if (scrollEl?._pageHandler) {
        scrollEl.removeEventListener('scroll', scrollEl._pageHandler);
      }
    };
  }, [externalContent]);

  useEffect(() => {
    if (booksLoading) return;
    const foundBook = books.find(b => b.id === parseInt(id));
    if (!foundBook) {
      setError('not_found');
      setLoading(false);
      return;
    }
    // external_url eski localStorage versiyasida bo'lmasligi mumkin
    const normalizedBook = {
      ...foundBook,
      external_url: foundBook.external_url || foundBook.pdf_url || null,
    };
    setBook(normalizedBook);
    setLoading(false);
  }, [id, books, booksLoading]);

  // External kontent yuklash (Gutenberg proxy)
  useEffect(() => {
    if (!book || book.has_pdf || !book.external_url) return;
    setContentLoading(true);
    fetch(buildApiUrl(`/books/${book.id}/content`))
      .then(r => r.json())
      .then(d => {
        if (d.error) { setExternalContent('__error__:' + d.error); }
        else {
          setExternalContent(d.content || null);
          // Yuqoriga qaytish — kitob boshidan boshlansin
          const el = document.querySelector('.reader-content');
          if (el) el.scrollTop = 0;
        }
      })
      .catch(err => setExternalContent('__error__:' + err.message))
      .finally(() => setContentLoading(false));
  }, [book]);

  useEffect(() => {
    // reset page when book changes
    setPageNumber(1);
    setNumPages(null);
    setError(null);
  }, [book]);

  const handleDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const goToNextPage = () => {
    if (pageNumber < numPages) {
      setPageNumber(pageNumber + 1);
    }
  };

  const goToPreviousPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
    }
  };

  const goToPage = (event) => {
    const page = parseInt(event.target.value) || 1;
    setPageNumber(Math.min(Math.max(page, 1), numPages));
  };

  const zoomIn = () => {
    setScale(Math.min(scale + 0.2, 3));
  };

  const zoomOut = () => {
    setScale(Math.max(scale - 0.2, 0.5));
  };

  const resetZoom = () => {
    setScale(1.5);
  };

  if (loading) {
    return <div className="reader-loading">Yuklanmoqda...</div>;
  }

  if (!book) {
    return (
      <div className="reader-error">
        <p>Kitob topilmadi</p>
        <button onClick={() => navigate('/books')} className="btn btn-primary">← Orqaga</button>
      </div>
    );
  }

  return (
    <div className={`book-reader-container${darkMode ? ' reader-dark' : ''}`}>
      {/* Bottom page number — kitobdagi kabi */}
      {htmlTotalPages > 0 && (
        <div className="reader-page-number">— {htmlPage} —</div>
      )}

      {/* Top info bar */}
      <div className="reader-topbar">
        <span className="reader-topbar-title">{book.title}</span>
        {htmlTotalPages > 0 && (
          <span className="reader-topbar-page">
            <input
              className="reader-page-input"
              type="number"
              min="1"
              max={htmlTotalPages}
              value={htmlPageInput !== '' ? htmlPageInput : htmlPage}
              onChange={e => setHtmlPageInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  goToHtmlPage(htmlPageInput || htmlPage);
                  setHtmlPageInput('');
                  e.target.blur();
                }
              }}
              onBlur={() => setHtmlPageInput('')}
              title="Sahifa raqamini kiriting va Enter bosing"
            />
            <span> / {htmlTotalPages}</span>
          </span>
        )}
      </div>

      {/* Floating controls */}
      <div className="reader-float-bar">
        <button onClick={() => navigate('/books')} className="reader-float-close" title="Yopish">✕</button>
        <button
          className={`reader-float-btn ${darkMode ? 'active' : ''}`}
          onClick={() => setDarkMode(d => !d)}
          title={darkMode ? 'Kunduzgi rejim' : 'Tungi rejim'}
        >{darkMode ? '☀️' : '🌙'}</button>
        <button className={`reader-float-btn ${showSummary ? 'active' : ''}`} onClick={() => showSummary ? setShowSummary(false) : fetchSummary(book)} title="AI Xulosa">🤖</button>
        <button className={`reader-float-btn ${showTranslate ? 'active' : ''}`} onClick={() => setShowTranslate(p => !p)} title="Tarjima">🌐</button>
      </div>

      {/* AI Summary Panel */}
      {showSummary && (
        <div className="reader-ai-panel">
          <div className="reader-ai-panel-header">
            <span>🤖 AI Xulosa — <em>{book.title}</em></span>
            <button onClick={() => setShowSummary(false)}>✕</button>
          </div>
          {summaryLoading
            ? <div className="reader-ai-loading">⏳ AI tahlil qilmoqda...</div>
            : <div className="reader-ai-content">
                {summaryText.split('\n').map((line, i) => <p key={i}>{line}</p>)}
              </div>
          }
        </div>
      )}

      {/* Translation Panel */}
      {showTranslate && (
        <div className="reader-ai-panel">
          <div className="reader-ai-panel-header">
            <span>🌐 Tarjima qilish</span>
            <button onClick={() => setShowTranslate(false)}>✕</button>
          </div>
          <div className="reader-translate-body">
            <div className="reader-translate-top">
              <textarea
                className="reader-translate-input"
                placeholder="Tarjima qilinadigan matnni yozing..."
                value={translateText}
                onChange={e => setTranslateText(e.target.value)}
                rows={4}
              />
              <div className="reader-translate-controls">
                <select
                  className="reader-lang-select"
                  value={translateLang}
                  onChange={e => setTranslateLang(e.target.value)}
                >
                  <option>O'zbek</option>
                  <option>Ingliz</option>
                  <option>Rus</option>
                  <option>Xitoy</option>
                  <option>Arab</option>
                </select>
                <button
                  className="reader-translate-btn"
                  onClick={translateContent}
                  disabled={translateLoading || !translateText.trim()}
                >
                  {translateLoading ? '⏳' : '🌐 Tarjima'}
                </button>
              </div>
            </div>
            {translateResult && (
              <div className="reader-translate-result">
                <strong>{translateLang} tiliga tarjima:</strong>
                <p>{translateResult}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toolbar — faqat PDF kitoblar uchun */}
      <div className="reader-toolbar" style={book.external_url && !book.has_pdf ? {display:'none'} : {}}>
        <div className="toolbar-section">
          {/* Navigation */}
          <button 
            onClick={goToPreviousPage} 
            disabled={pageNumber <= 1}
            title="Oldingi sahifa (←)"
            className="toolbar-btn"
          >
            ⬅️ Oldingi
          </button>

          <div className="page-input-group">
            <input
              type="number"
              min="1"
              max={numPages}
              value={pageNumber}
              onChange={goToPage}
              className="page-input"
            />
            <span className="page-of"> / {numPages || 0}</span>
          </div>

          <button 
            onClick={goToNextPage} 
            disabled={pageNumber >= numPages}
            title="Keyingi sahifa (→)"
            className="toolbar-btn"
          >
            Keyingi ➡️
          </button>
        </div>

        <div className="toolbar-separator"></div>

        <div className="toolbar-section">
          {/* Zoom Controls */}
          <button 
            onClick={zoomOut}
            title="Kichik qilish (-)"
            className="toolbar-btn"
          >
            🔍−
          </button>

          <span className="zoom-display">
            {(scale * 100).toFixed(0)}%
          </span>

          <button 
            onClick={zoomIn}
            title="Katta qilish (+)"
            className="toolbar-btn"
          >
            🔍+
          </button>

          <button 
            onClick={resetZoom}
            title="Oziq o'lchamini qaytarish"
            className="toolbar-btn"
          >
            🔄 Normal
          </button>
        </div>

        <div className="toolbar-separator"></div>

        {/* Download Button */}
        <a
          href={buildApiUrl(`/books/${book.id}/pdf`)}
          download={`${book.title}.pdf`}
          className="toolbar-btn download-btn"
          title="PDF yuklab olish"
        >
          ⬇️ Yuklab olish
        </a>
      </div>

      {/* PDF / Book Viewer */}
      <div className={`reader-content${book.external_url && !book.has_pdf ? ' reader-content--iframe' : ''}`}>
        {book.has_pdf && !error ? (
          <div className="pdf-viewer">
            <Document
              file={buildApiUrl(`/books/${book.id}/pdf`)}
              onLoadSuccess={handleDocumentLoadSuccess}
              onLoadError={() => setError('no_pdf')}
              loading={<div className="pdf-loading">PDF yuklanmoqda...</div>}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
          </div>
        ) : book.external_url ? (
          <div className="external-reader">
            {contentLoading && <div className="pdf-loading">Kitob yuklanmoqda...</div>}
            {externalContent && !externalContent.startsWith('__error__:') && (
              <div
                className="book-html-content"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(externalContent, { ADD_TAGS: ['img'], ADD_ATTR: ['src', 'alt', 'class', 'id'] }) }}
              />
            )}
            {!contentLoading && (!externalContent || externalContent.startsWith('__error__:')) && (
              <div className="no-pdf-notice">
                {externalContent?.startsWith('__error__:') && (
                  <p style={{fontSize:'0.8rem',color:'#999',marginBottom:'0.5rem'}}>
                    Xato: {externalContent.replace('__error__:', '')}
                  </p>
                )}
                <p>⚠️ Kontent yuklanmadi.</p>
                <a href={book.external_url} target="_blank" rel="noreferrer" className="reader-ai-btn">
                  Tashqi saytda o'qish →
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="no-pdf-info">
            <div className="book-info-card">
              <div className="book-cover-big">{book.cover}</div>
              <h2>{book.title}</h2>
              <p className="book-author-big">✍️ {book.author}</p>
              <p className="book-category-tag">📚 {book.category}</p>
              {book.description && (
                <div className="book-description-full">
                  <h3>Kitob haqida</h3>
                  <p>{book.description}</p>
                </div>
              )}
              <div className="no-pdf-notice">
                <p>📄 Bu kitobning elektron versiyasi hali yuklanmagan.</p>
                <p>Tez orada qo'shiladi!</p>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default BookReader;
