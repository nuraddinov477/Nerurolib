import { useState } from 'react';

const PLANS = [
  { id: 1, name: 'Bepul', price: 0, currency: 'UZS', period: 'oylik', features: ['5 kitob/oy', 'PDF o\'qish', 'Qidirish'], color: '#4b5580', users: 1240, active: true },
  { id: 2, name: 'Premium', price: 49900, currency: 'UZS', period: 'oylik', features: ['Cheksiz kitoblar', 'Audiokitoblar', 'PDF yuklab olish', 'Offline rejim'], color: '#a78bfa', users: 380, active: true },
  { id: 3, name: 'VIP', price: 99900, currency: 'UZS', period: 'oylik', features: ['Hamma Premium imkoniyatlar', 'AI yordamchi', 'Erta kirish', 'Shaxsiy tavsiyalar', 'Yordam 24/7'], color: '#f59e0b', users: 95, active: true },
];

const PAYMENTS = [
  { id: 1, user: 'Alisher M.', plan: 'Premium', amount: 49900, method: 'Payme', status: 'success', date: '2024-01-15', tx: 'PME-2024011501' },
  { id: 2, user: 'Dilnoza K.', plan: 'VIP', amount: 99900, method: 'Click', status: 'success', date: '2024-01-15', tx: 'CLK-2024011502' },
  { id: 3, user: 'Bobur T.', plan: 'Premium', amount: 49900, method: 'Stripe', status: 'pending', date: '2024-01-14', tx: 'STR-2024011401' },
  { id: 4, user: 'Malika R.', plan: 'Premium', amount: 49900, method: 'Payme', status: 'failed', date: '2024-01-14', tx: 'PME-2024011401' },
  { id: 5, user: 'Jasur N.', plan: 'VIP', amount: 99900, method: 'PayPal', status: 'success', date: '2024-01-13', tx: 'PPL-2024011301' },
];

const PROMOS = [
  { id: 1, code: 'NEURO2024', discount: 20, type: '%', uses: 45, maxUses: 100, expires: '2024-03-01', active: true },
  { id: 2, code: 'YANGIOYLIK', discount: 10000, type: 'UZS', uses: 12, maxUses: 50, expires: '2024-02-15', active: true },
  { id: 3, code: 'STUDENT50', discount: 50, type: '%', uses: 100, maxUses: 100, expires: '2024-01-31', active: false },
];

const METHODS = [
  { name: 'Payme', icon: '💳', share: 45, color: '#00b5ad' },
  { name: 'Click', icon: '📱', share: 30, color: '#2563eb' },
  { name: 'Stripe', icon: '🌐', share: 15, color: '#635bff' },
  { name: 'PayPal', icon: '🅿️', share: 10, color: '#003087' },
];

const fmt = n => n.toLocaleString('uz-UZ') + ' UZS';

export default function AdminSubscriptions() {
  const [tab, setTab] = useState('overview');
  const [promos, setPromos] = useState(PROMOS);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoForm, setPromoForm] = useState({ code: '', discount: '', type: '%', maxUses: '', expires: '' });
  const [payFilter, setPayFilter] = useState('all');

  const totalRevenue = PAYMENTS.filter(p => p.status === 'success').reduce((s, p) => s + p.amount, 0);
  const filteredPayments = payFilter === 'all' ? PAYMENTS : PAYMENTS.filter(p => p.status === payFilter);

  const handleAddPromo = (e) => {
    e.preventDefault();
    setPromos(prev => [...prev, { ...promoForm, id: Date.now(), uses: 0, active: true, discount: Number(promoForm.discount), maxUses: Number(promoForm.maxUses) }]);
    setPromoForm({ code: '', discount: '', type: '%', maxUses: '', expires: '' });
    setShowPromoForm(false);
  };

  const togglePromo = (id) => setPromos(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  const deletePromo = (id) => { if (window.confirm('Promo kodni o\'chirishni tasdiqlaysizmi?')) setPromos(prev => prev.filter(p => p.id !== id)); };

  return (
    <div className="adm-page">

      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h2>💳 Obuna & To'lovlar</h2>
          <p>Obuna rejalari, to'lovlar va promo kodlarni boshqaring</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="adm-btn adm-btn-secondary">📥 Eksport</button>
          <button className="adm-btn adm-btn-primary">+ Yangi reja</button>
        </div>
      </div>

      {/* Stats */}
      <div className="adm-stats">
        <div className="adm-stat"><span className="adm-stat-icon">💰</span><span className="adm-stat-value">{fmt(totalRevenue)}</span><span className="adm-stat-label">Bu oy daromad</span></div>
        <div className="adm-stat"><span className="adm-stat-icon">👥</span><span className="adm-stat-value">{PLANS.reduce((s, p) => s + p.users, 0)}</span><span className="adm-stat-label">Jami obunachlar</span></div>
        <div className="adm-stat"><span className="adm-stat-icon">⭐</span><span className="adm-stat-value">{PLANS.find(p => p.name === 'Premium').users + PLANS.find(p => p.name === 'VIP').users}</span><span className="adm-stat-label">To'lovli obunachlar</span></div>
        <div className="adm-stat"><span className="adm-stat-icon">🎫</span><span className="adm-stat-value">{promos.filter(p => p.active).length}</span><span className="adm-stat-label">Faol promo kodlar</span></div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid #1e2433', marginBottom: '1.5rem' }}>
        {[['overview', '📊 Umumiy'], ['payments', '💳 To\'lovlar'], ['promos', '🎫 Promo kodlar']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '0.6rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer',
            color: tab === key ? '#a78bfa' : '#4b5580', fontWeight: tab === key ? 600 : 400, fontSize: '0.875rem',
            borderBottom: tab === key ? '2px solid #a78bfa' : '2px solid transparent', transition: 'all 0.15s'
          }}>{label}</button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div>
          {/* Plans */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {PLANS.map(plan => (
              <div key={plan.id} className="adm-card" style={{ borderTop: `3px solid ${plan.color}`, padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, color: plan.color, fontSize: '1.1rem' }}>{plan.name}</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e8eaf0', marginTop: '0.25rem' }}>
                      {plan.price === 0 ? 'Bepul' : fmt(plan.price)}
                      {plan.price > 0 && <span style={{ fontSize: '0.75rem', color: '#4b5580', fontWeight: 400 }}>/{plan.period}</span>}
                    </div>
                  </div>
                  <span className={`adm-badge ${plan.active ? 'adm-badge-green' : 'adm-badge-gray'}`}>{plan.active ? 'Faol' : 'Nofaol'}</span>
                </div>
                <ul style={{ margin: '0 0 1rem', padding: '0 0 0 1rem', listStyle: 'none' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ fontSize: '0.8rem', color: '#8b92b0', padding: '0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ color: plan.color }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <div style={{ borderTop: '1px solid #1e2433', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#4b5580' }}>{plan.users} foydalanuvchi</span>
                  <button className="adm-btn adm-btn-sm adm-btn-secondary">Tahrirlash</button>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Methods */}
          <div className="adm-card">
            <p className="adm-card-title">💳 To'lov usullari taqsimoti</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              {METHODS.map(m => (
                <div key={m.name} style={{ textAlign: 'center', padding: '1rem', background: '#1a2035', borderRadius: '10px' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{m.icon}</div>
                  <div style={{ fontWeight: 600, color: '#e8eaf0', marginBottom: '0.5rem' }}>{m.name}</div>
                  <div style={{ background: '#0f1117', borderRadius: '4px', height: '6px', marginBottom: '0.4rem', overflow: 'hidden' }}>
                    <div style={{ width: `${m.share}%`, height: '100%', background: m.color, borderRadius: '4px', transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: m.color }}>{m.share}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {tab === 'payments' && (
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {[['all', 'Barchasi'], ['success', '✅ Muvaffaqiyatli'], ['pending', '⏳ Kutilmoqda'], ['failed', '❌ Xato']].map(([val, label]) => (
              <button key={val} onClick={() => setPayFilter(val)} className={`adm-btn adm-btn-sm ${payFilter === val ? 'adm-btn-primary' : 'adm-btn-secondary'}`}>{label}</button>
            ))}
          </div>
          <div className="adm-card" style={{ padding: 0 }}>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Foydalanuvchi</th>
                    <th>Reja</th>
                    <th>Summa</th>
                    <th>Usul</th>
                    <th>Tranzaksiya ID</th>
                    <th>Sana</th>
                    <th>Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: '#e8eaf0' }}>{p.user}</td>
                      <td><span className="adm-badge adm-badge-purple">{p.plan}</span></td>
                      <td style={{ fontWeight: 600, color: '#a78bfa' }}>{fmt(p.amount)}</td>
                      <td><span className="adm-badge adm-badge-blue">{p.method}</span></td>
                      <td style={{ fontSize: '0.75rem', color: '#4b5580', fontFamily: 'monospace' }}>{p.tx}</td>
                      <td style={{ fontSize: '0.8rem', color: '#8b92b0' }}>{p.date}</td>
                      <td>
                        <span className={`adm-badge ${p.status === 'success' ? 'adm-badge-green' : p.status === 'pending' ? 'adm-badge-yellow' : 'adm-badge-red'}`}>
                          {p.status === 'success' ? '✅ Muvaffaqiyatli' : p.status === 'pending' ? '⏳ Kutilmoqda' : '❌ Xato'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Promos Tab */}
      {tab === 'promos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="adm-btn adm-btn-primary" onClick={() => setShowPromoForm(s => !s)}>
              {showPromoForm ? '✕ Yopish' : '+ Yangi promo kod'}
            </button>
          </div>

          {showPromoForm && (
            <div className="adm-card" style={{ marginBottom: '1rem' }}>
              <p className="adm-card-title">🎫 Yangi promo kod yaratish</p>
              <form className="adm-form" onSubmit={handleAddPromo}>
                <div className="adm-form-row">
                  <div className="adm-field">
                    <label>Promo kod *</label>
                    <input value={promoForm.code} onChange={e => setPromoForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="NEURO2024" required />
                  </div>
                  <div className="adm-field">
                    <label>Chegirma *</label>
                    <input type="number" value={promoForm.discount} onChange={e => setPromoForm(f => ({ ...f, discount: e.target.value }))} placeholder="20" required />
                  </div>
                  <div className="adm-field">
                    <label>Tur</label>
                    <select value={promoForm.type} onChange={e => setPromoForm(f => ({ ...f, type: e.target.value }))}>
                      <option value="%">% (foiz)</option>
                      <option value="UZS">UZS (so'm)</option>
                    </select>
                  </div>
                  <div className="adm-field">
                    <label>Max ishlatish</label>
                    <input type="number" value={promoForm.maxUses} onChange={e => setPromoForm(f => ({ ...f, maxUses: e.target.value }))} placeholder="100" />
                  </div>
                  <div className="adm-field">
                    <label>Amal qilish muddati</label>
                    <input type="date" value={promoForm.expires} onChange={e => setPromoForm(f => ({ ...f, expires: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="adm-btn adm-btn-secondary" onClick={() => setShowPromoForm(false)}>Bekor qilish</button>
                  <button type="submit" className="adm-btn adm-btn-primary">✅ Yaratish</button>
                </div>
              </form>
            </div>
          )}

          <div className="adm-card" style={{ padding: 0 }}>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Kod</th>
                    <th>Chegirma</th>
                    <th>Ishlatilgan</th>
                    <th>Amal qilish muddati</th>
                    <th>Holat</th>
                    <th>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {promos.map(p => (
                    <tr key={p.id}>
                      <td><code style={{ background: '#1a2035', padding: '0.25rem 0.5rem', borderRadius: '4px', color: '#a78bfa', fontSize: '0.85rem' }}>{p.code}</code></td>
                      <td style={{ fontWeight: 600, color: '#e8eaf0' }}>{p.discount}{p.type}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, background: '#1a2035', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                            <div style={{ width: p.maxUses ? `${(p.uses / p.maxUses) * 100}%` : '0%', height: '100%', background: '#a78bfa', borderRadius: '4px' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#4b5580' }}>{p.uses}/{p.maxUses || '∞'}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#8b92b0' }}>{p.expires || '—'}</td>
                      <td><span className={`adm-badge ${p.active ? 'adm-badge-green' : 'adm-badge-gray'}`}>{p.active ? '● Faol' : '○ Nofaol'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => togglePromo(p.id)}>{p.active ? '⏸' : '▶'}</button>
                          <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => deletePromo(p.id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
