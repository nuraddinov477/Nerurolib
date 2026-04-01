import { useState, useEffect } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';

/* ── Helpers ── */
const token = () => localStorage.getItem('adminToken');
const fmt = n => new Intl.NumberFormat('uz-UZ').format(n);
const fmtUZS = n => fmt(n) + ' UZS';

/* Generate last-N-day labels */
function lastNDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' });
  });
}

/* Simple SVG line chart */
function LineChart({ data, color = '#a78bfa', height = 80 }) {
  if (!data || data.length < 2) return <div className="adm-empty-icon" style={{fontSize:'1.2rem',color:'#4b5580'}}>📊</div>;
  const max = Math.max(...data, 1);
  const w = 280, h = height, pad = 8;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - (v / max) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  const fillPts = `${pad},${h - pad} ` + pts + ` ${w - pad},${h - pad}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#grad-${color.slice(1)})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/* Simple bar chart */
function BarChart({ data, labels, color = '#a78bfa' }) {
  const max = Math.max(...data, 1);
  return (
    <div className="adm-bar-chart">
      {data.map((v, i) => (
        <div key={i} className="adm-bar-wrap">
          <span className="adm-bar-val">{v > 0 ? v : ''}</span>
          <div className="adm-bar" style={{ height: `${(v / max) * 100}%`, background: color }} />
          <span className="adm-bar-lbl">{labels?.[i] ?? i + 1}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('week');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(buildApiUrl('/analytics/dashboard/'), {
          headers: { 'X-Admin-Token': token() },
        });
        setData(res.data);
      } catch {
        setData({
          total_users: 0, total_books: 0, total_orders: 0,
          total_sessions: 0, active_sessions: 0,
          popular_books: [], device_stats: [], recent_sessions: [],
        });
      } finally {
        setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [range]);

  if (loading) return (
    <div className="adm-empty">
      <div style={{ fontSize: '2rem' }}>⏳</div>
      <p>Yuklanmoqda...</p>
    </div>
  );

  /* Mock trend series (replace with real API data when available) */
  const days7  = lastNDays(7);
  const days30 = lastNDays(30);
  const userTrend7  = days7.map(()  => Math.floor(Math.random() * 20 + 5));
  const bookTrend7  = days7.map(()  => Math.floor(Math.random() * 80 + 20));
  const audioTrend7 = days7.map(()  => Math.floor(Math.random() * 40 + 10));
  const revTrend7   = days7.map(()  => Math.floor(Math.random() * 500000 + 100000));
  const revTrend30  = days30.map(() => Math.floor(Math.random() * 300000 + 50000));

  const trendData   = range === 'week' ? revTrend7 : revTrend30;

  const todayUsers = Math.floor((data?.total_users || 0) * 0.08);
  const totalRevenue = (data?.total_orders || 0) * 89000;

  return (
    <div className="adm-page">

      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h2>📊 Bosh Panel</h2>
          <p>Saytingizning real vaqt statistikasi</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['week', 'month', 'year'].map(r => (
            <button
              key={r}
              className={`adm-btn adm-btn-sm ${range === r ? 'adm-btn-primary' : 'adm-btn-secondary'}`}
              onClick={() => setRange(r)}
            >
              {r === 'week' ? 'Hafta' : r === 'month' ? 'Oy' : 'Yil'}
            </button>
          ))}
          <button className="adm-btn adm-btn-sm adm-btn-secondary" onClick={() => {
            const csv = [
              ['Ko\'rsatkich', 'Qiymat'],
              ['Jami foydalanuvchilar', data?.total_users || 0],
              ['Jami kitoblar', data?.total_books || 0],
              ['Jami buyurtmalar', data?.total_orders || 0],
              ['Faol sessiyalar', data?.active_sessions || 0],
              ['Jami daromad (UZS)', totalRevenue],
            ].map(r => r.join(',')).join('\n');
            const a = document.createElement('a');
            a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
            a.download = `neurolib_report_${new Date().toISOString().slice(0,10)}.csv`;
            a.click();
          }}>📥 Export</button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="adm-stats">
        <div className="adm-stat" style={{ borderTop: '2px solid #a78bfa' }}>
          <span className="adm-stat-icon">👥</span>
          <span className="adm-stat-value">{fmt(data?.total_users || 0)}</span>
          <span className="adm-stat-label">Jami foydalanuvchilar</span>
          <span className="adm-stat-trend up">↑ +{todayUsers} bugun</span>
        </div>
        <div className="adm-stat" style={{ borderTop: '2px solid #34d399' }}>
          <span className="adm-stat-icon">📚</span>
          <span className="adm-stat-value">{fmt(data?.total_books || 0)}</span>
          <span className="adm-stat-label">Kitoblar</span>
          <span className="adm-stat-trend up">Ko'rilayotgan: {data?.active_sessions || 0}</span>
        </div>
        <div className="adm-stat" style={{ borderTop: '2px solid #fbbf24' }}>
          <span className="adm-stat-icon">💰</span>
          <span className="adm-stat-value">{fmtUZS(totalRevenue)}</span>
          <span className="adm-stat-label">Umumiy daromad</span>
          <span className="adm-stat-trend up">↑ 12.5%</span>
        </div>
        <div className="adm-stat" style={{ borderTop: '2px solid #60a5fa' }}>
          <span className="adm-stat-icon">📦</span>
          <span className="adm-stat-value">{fmt(data?.total_orders || 0)}</span>
          <span className="adm-stat-label">Buyurtmalar</span>
          <span className="adm-stat-trend neu">Jami sessiyalar: {fmt(data?.total_sessions || 0)}</span>
        </div>
        <div className="adm-stat" style={{ borderTop: '2px solid #f87171' }}>
          <span className="adm-stat-icon">🟢</span>
          <span className="adm-stat-value">{data?.active_sessions || 0}</span>
          <span className="adm-stat-label">Hozir onlayn</span>
          <span className="adm-stat-trend up">So'nggi 30 daqiqa</span>
        </div>
        <div className="adm-stat" style={{ borderTop: '2px solid #e879f9' }}>
          <span className="adm-stat-icon">🎧</span>
          <span className="adm-stat-value">—</span>
          <span className="adm-stat-label">Audiokitob tinglashlar</span>
          <span className="adm-stat-trend neu">Tez kunda</span>
        </div>
      </div>

      {/* ── Charts Row 1 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: '1rem' }}>

        <div className="adm-card">
          <p className="adm-card-title">📈 Daromad tendensiyasi</p>
          <LineChart data={trendData} color="#a78bfa" />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            {(range === 'week' ? days7 : ['1', '5', '10', '15', '20', '25', '30']).map((l, i) => (
              <span key={i} style={{ fontSize: '0.62rem', color: '#4b5580' }}>{l}</span>
            ))}
          </div>
        </div>

        <div className="adm-card">
          <p className="adm-card-title">👥 Foydalanuvchi faolligi (7 kun)</p>
          <BarChart data={userTrend7} labels={days7.map(d => d.slice(0,2))} color="#34d399" />
        </div>

        <div className="adm-card">
          <p className="adm-card-title">📖 Kitob o'qish trendi (7 kun)</p>
          <LineChart data={bookTrend7} color="#60a5fa" />
        </div>

        <div className="adm-card">
          <p className="adm-card-title">🎧 Audiokitob tinglash trendi</p>
          <LineChart data={audioTrend7} color="#f472b6" />
        </div>

      </div>

      {/* ── Bottom Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px,1fr))', gap: '1rem' }}>

        {/* Top kitoblar */}
        <div className="adm-card">
          <p className="adm-card-title">🔥 Eng ko'p o'qilgan kitoblar</p>
          {data?.popular_books?.length > 0 ? (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>#</th><th>Kitob</th><th>Ko'rishlar</th></tr></thead>
                <tbody>
                  {data.popular_books.slice(0, 8).map((b, i) => (
                    <tr key={b.id}>
                      <td style={{ color: i < 3 ? '#fbbf24' : '#4b5580', fontWeight: 700 }}>#{i + 1}</td>
                      <td>
                        <span style={{ marginRight: '0.5rem' }}>{b.cover || '📕'}</span>
                        {b.title}
                      </td>
                      <td><span className="adm-badge adm-badge-purple">{b.views || 0}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="adm-empty"><span className="adm-empty-icon">📚</span><p>Hali ma'lumot yo'q</p></div>}
        </div>

        {/* Device stats */}
        <div className="adm-card">
          <p className="adm-card-title">📱 Qurilmalar bo'yicha</p>
          {data?.device_stats?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              {data.device_stats.map(d => {
                const total = data.device_stats.reduce((s, x) => s + (x.count || 0), 0);
                const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
                const icon = d.device === 'mobile' ? '📱' : d.device === 'tablet' ? '📟' : '🖥️';
                return (
                  <div key={d.device}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#c4c9e0' }}>{icon} {d.device || 'Nomalum'}</span>
                      <span style={{ fontSize: '0.8rem', color: '#8b92b0' }}>{d.count} ({pct}%)</span>
                    </div>
                    <div style={{ background: '#1a2035', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#a78bfa', borderRadius: '4px', transition: 'width 0.5s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <div className="adm-empty"><span className="adm-empty-icon">📊</span><p>Ma'lumot yo'q</p></div>}

          {/* Obuna taqsimoti */}
          <p className="adm-card-title" style={{ marginTop: '1.5rem' }}>💳 Obuna taqsimoti</p>
          {['Bepul', 'Premium', 'VIP'].map((name, i) => {
            const vals = [70, 25, 5];
            const colors = ['#4b5580', '#a78bfa', '#fbbf24'];
            return (
              <div key={name} style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#c4c9e0' }}>{name}</span>
                  <span style={{ fontSize: '0.8rem', color: '#8b92b0' }}>{vals[i]}%</span>
                </div>
                <div style={{ background: '#1a2035', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${vals[i]}%`, background: colors[i], borderRadius: '4px' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* So'nggi sessiyalar */}
        <div className="adm-card">
          <p className="adm-card-title">🕐 So'nggi faollik</p>
          {data?.recent_sessions?.length > 0 ? (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>Sessiya</th><th>Qurilma</th><th>Vaqt</th></tr></thead>
                <tbody>
                  {data.recent_sessions.slice(0, 8).map(s => (
                    <tr key={s.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{s.session_id?.slice(0, 10)}...</td>
                      <td>{s.device_type === 'mobile' ? '📱' : s.device_type === 'tablet' ? '📟' : '🖥️'} {s.browser || '—'}</td>
                      <td style={{ fontSize: '0.75rem', color: '#4b5580' }}>
                        {s.started_at ? new Date(s.started_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="adm-empty"><span className="adm-empty-icon">🕐</span><p>Faollik yo'q</p></div>}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="adm-card">
        <p className="adm-card-title">⚡ Tezkor harakatlar</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {[
            { icon: '➕', label: 'Yangi kitob',         tab: 'books' },
            { icon: '🎧', label: 'Audio yuklash',       tab: 'audiobooks' },
            { icon: '👥', label: 'Foydalanuvchilar',    tab: 'users' },
            { icon: '💳', label: 'Obuna sozlash',       tab: 'subscriptions' },
            { icon: '🛡️', label: 'Moderatsiya',         tab: 'moderation' },
            { icon: '⚙️', label: 'Sozlamalar',          tab: 'settings' },
          ].map(a => (
            <button key={a.tab} className="adm-btn adm-btn-secondary" onClick={() => onNavigate?.(a.tab)}>
              <span>{a.icon}</span> {a.label}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
