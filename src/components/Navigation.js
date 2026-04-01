import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Navigation.css';

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const goToAbout = (e) => {
    e.preventDefault();
    const scroll = () => {
      const el = document.getElementById('loyiha-haqida');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    };
    if (location.pathname === '/') {
      scroll();
    } else {
      navigate('/');
      setTimeout(scroll, 400);
    }
  };

  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) return stored === 'true';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const applyTheme = (isDark) => {
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    const meta = document.getElementById('meta-theme-color');
    if (meta) meta.setAttribute('content', isDark ? '#060c1a' : '#ffffff');
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    applyTheme(newMode);
  };

  React.useEffect(() => { applyTheme(darkMode); }, [darkMode]);

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (localStorage.getItem('darkMode') === null) { setDarkMode(e.matches); applyTheme(e.matches); }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (/^\/books\/\d+\/read/.test(location.pathname)) return null;

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">📚 Neurolib</Link>
        <ul className="nav-menu">
          <li><Link to="/books" className="nav-link">Javon</Link></li>
          <li>
            <a className="nav-link" href="#loyiha-haqida" onClick={goToAbout}>Loyiha haqida</a>
          </li>
          <li>
            <a className="nav-link" href="#loyiha-haqida" onClick={goToAbout}>Yordam</a>
          </li>
          <li><Link to="/ai" className="nav-link nav-ai">🤖 AI</Link></li>
          <li><Link to="/favorites" className="nav-link nav-fav">❤️ Sevimlilar</Link></li>
          <li>
            <button
              className={`theme-toggle-btn ${darkMode ? 'is-dark' : 'is-light'}`}
              onClick={toggleDarkMode}
            >
              <span className="toggle-thumb">
                {darkMode ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="4"/>
                    <line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                )}
              </span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;
