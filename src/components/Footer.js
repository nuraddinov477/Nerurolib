import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Footer.css';

function Footer() {
  const location = useLocation();
  if (/^\/books\/\d+\/read/.test(location.pathname)) return null;

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>📚 Neurolib</h3>
          <p>Eng ko'p kitob, eng yaxshi narxlar</p>
        </div>

        <div className="footer-section">
          <h4>Havola</h4>
          <ul>
            <li><Link to="/">Bosh sahifa</Link></li>
            <li><Link to="/books">Katalog</Link></li>
            <li><a href="/#loyiha-haqida">Biz haqida</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Aloqa</h4>
          <p>📞 +998 90 123 45 67</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="copyright">&copy; 2024 Neurolib. Barcha huquqlar himoyalangan.</p>
      </div>
    </footer>
  );
}

export default Footer;
