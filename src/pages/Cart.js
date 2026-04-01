import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/Cart.css';

function Cart() {
  const { cart, removeFromCart, updateCartQuantity, calculateTotal, checkout } = useContext(DataContext);
  const { t } = useContext(LanguageContext);

  return (
    <div className="cart-page">
      <h1>🛒 {t('myCart')}</h1>

      {cart.length === 0 ? (
        <div className="empty-cart">
          <p>{t('emptyCart')}</p>
          <Link to="/books" className="btn btn-primary">
            {t('continueShopping')}
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-items">
            <table className="cart-table">
              <thead>
                <tr>
                  <th>{t('book')}</th>
                  <th>{t('price')}</th>
                  <th>{t('quantity')}</th>
                  <th>{t('amount')}</th>
                  <th>{t('action')}</th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.id}>
                    <td>{item.cover} {item.title}</td>
                    <td>{t('free')}</td>
                    <td>
                      <div className="quantity-control">
                        <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)}>-</button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value))}
                          min="1"
                        />
                        <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)}>+</button>
                      </div>
                    </td>
                    <td>{t('free')}</td>
                    <td>
                      <button
                        className="btn btn-delete"
                        onClick={() => removeFromCart(item.id)}
                      >
                        ❌
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cart-summary">
            <h2>{t('total')}</h2>
            <p className="total-price">{t('free')}</p>
            <button className="btn btn-checkout" onClick={checkout}>
              {t('checkout')}
            </button>
            <Link to="/books" className="btn btn-secondary">
              {t('continueShopping')}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;
