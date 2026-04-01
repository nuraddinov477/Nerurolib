import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { DataContext, DataProvider } from './context/DataContext';
import { LanguageProvider } from './context/LanguageContext';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Home from './pages/Home';
import Books from './pages/Books';
import Cart from './pages/Cart';
import BookReader from './pages/BookReader';
import AdminPanel from './pages/AdminPanel';
import Favorites from './pages/Favorites';
import AIChat from './pages/AIChat';
import './styles/App.css';
import './styles/animations.css';

function AppContent() {
  const location = useLocation();
  const { trackPageView } = useContext(DataContext);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.12 }
    );
    const targets = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [location]);

  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title);
    // trackPageView comes from context and can be recreated; pathname/search changes are the trigger we need.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  const isReaderPage = /^\/books\/\d+\/read/.test(location.pathname);

  return (
    <>
      {!isReaderPage && <Navigation />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/books" element={<Books />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/books/:id/read" element={<BookReader />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/ai" element={<AIChat />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
      {!isReaderPage && <Footer />}
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <DataProvider>
        <Router>
          <AppContent />
        </Router>
      </DataProvider>
    </LanguageProvider>
  );
}

export default App;
