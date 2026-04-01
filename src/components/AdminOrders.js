import React, { useContext } from 'react';
import { DataContext } from '../context/DataContext';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/AdminOrders.css';

function AdminOrders() {
  const { orders, updateOrder } = useContext(DataContext);
  const { t } = useContext(LanguageContext);

  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  return (
    <div className="admin-orders">
      <div className="admin-header">
        <h2>{t('ordersManagement')} ({orders.length})</h2>
      </div>

      {orders.length === 0 ? (
        <p className="no-orders">{t('noOrders')}</p>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <h3>{t('ordersManagement')} #{order.id}</h3>
                <span className="order-date">{order.date}</span>
              </div>
              <div className="order-items">
                <h4>{t('items')}:</h4>
                <ul>
                  {order.items.map(item => (
                    <li key={item.id}>
                      {item.cover} {item.title} x{item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="order-footer">
                <p className="order-total">{t('total')}: ${order.total}</p>
                <div className="status-control">
                  <label>{t('status')}:</label>
                  <select
                    value={order.status}
                    onChange={(e) => updateOrder(order.id, e.target.value)}
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {getStatusLabel(status, t)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getStatusLabel(status, t) {
  const statusMap = {
    pending: t('pending'),
    processing: t('processing'),
    shipped: t('shipped'),
    delivered: t('delivered'),
    cancelled: t('cancelled')
  };
  const icons = {
    pending: '⏳',
    processing: '🔄',
    shipped: '📦',
    delivered: '✅',
    cancelled: '❌'
  };
  return `${icons[status]} ${statusMap[status]}` || status;
}

export default AdminOrders;
