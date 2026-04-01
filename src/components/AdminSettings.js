import { useState } from 'react';
import { buildApiUrl } from '../config/api';

const LANGUAGES = [
  { code: "uz", label: "O'zbekcha", native: "O'zbek tili", flag: "🇺🇿" },
  { code: "ru", label: "Русский", native: "Русский язык", flag: "🇷🇺" },
  { code: "en", label: "English", native: "English", flag: "🇬🇧" },
];

const INTEGRATIONS = [
  { key: 'googleAnalytics', label: 'Google Analytics', icon: '📈', desc: 'GA4 yoki UA tracking ID', placeholder: 'G-XXXXXXXXXX' },
  { key: 'yandexMetrica', label: 'Yandex Metrica', icon: '📊', desc: 'Yandex Metrica counter ID', placeholder: '12345678' },
  { key: 'firebase', label: 'Firebase', icon: '🔥', desc: 'Firebase project ID', placeholder: 'my-project-id' },
  { key: 'sentry', label: 'Sentry', icon: '🛡️', desc: 'Sentry DSN URL', placeholder: 'https://xxx@sentry.io/xxx' },
];

export default function AdminSettings() {
  const [tab, setTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // General
  const [general, setGeneral] = useState({
    siteName: 'Neurolib', siteDescription: 'O\'zbek kitoblar kutubxonasi', adminEmail: 'admin@neurolib.uz', supportEmail: 'support@neurolib.uz',
  });

  // Language
  const [langSettings, setLangSettings] = useState({
    defaultLang: 'uz', availableLangs: ['uz', 'ru', 'en'], rtlSupport: false,
  });

  // Theme
  const [theme, setTheme] = useState({
    mode: 'dark',
    primaryColor: '#a78bfa', accentColor: '#22d3ee', bgColor: '#0f1117',
  });

  // Notifications
  const [notifs, setNotifs] = useState({
    email: true, push: false, sms: false, digestFrequency: 'weekly',
  });

  // Integrations
  const [integrations, setIntegrations] = useState({
    googleAnalytics: '', yandexMetrica: '', firebase: '', sentry: '',
  });

  // AI
  const [ai, setAi] = useState({
    enabled: true, claudeApiKey: '', geminiApiKey: '', openaiApiKey: '', grokApiKey: '',
  });

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const payload = { siteName: general.siteName, siteDescription: general.siteDescription, adminEmail: general.adminEmail, defaultLanguage: langSettings.defaultLang };
      await fetch(buildApiUrl('/settings/'), {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Admin-Token': token } : {}) },
        body: JSON.stringify(payload),
      });
      showMsg('✅ Sozlamalar muvaffaqiyatli saqlandi!');
    } catch {
      localStorage.setItem('adminSettings', JSON.stringify({ general, langSettings, theme, notifs, integrations }));
      showMsg('✅ Sozlamalar mahalliy saqlovda saqlandi!');
    } finally {
      setSaving(false);
    }
  };

  const toggleLang = (code) => {
    setLangSettings(prev => ({
      ...prev,
      availableLangs: prev.availableLangs.includes(code)
        ? prev.availableLangs.filter(l => l !== code)
        : [...prev.availableLangs, code],
    }));
  };

  const Toggle = ({ value, onChange }) => (
    <div onClick={onChange} style={{ width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', background: value ? '#a78bfa' : '#2a3045', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: '3px', left: value ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
    </div>
  );

  return (
    <div className="adm-page">
      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h2>⚙️ Sozlamalar</h2>
          <p>Til, dizayn, bildirishnomalar va integratsiyalar</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {msg && <span style={{ fontSize: '0.85rem', color: msg.startsWith('✅') ? '#4ade80' : '#f87171' }}>{msg}</span>}
          <button className="adm-btn adm-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Saqlanmoqda...' : '💾 Saqlash'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid #1e2433', marginBottom: '1.5rem' }}>
        {[['general', '🏠 Umumiy'], ['language', '🌐 Til'], ['theme', '🎨 Dizayn'], ['notifications', '🔔 Bildirishnomalar'], ['integrations', '🔗 Integratsiyalar'], ['ai', '🤖 AI']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '0.6rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
            color: tab === key ? '#a78bfa' : '#4b5580', fontWeight: tab === key ? 600 : 400, fontSize: '0.85rem',
            borderBottom: tab === key ? '2px solid #a78bfa' : '2px solid transparent', transition: 'all 0.15s', whiteSpace: 'nowrap'
          }}>{label}</button>
        ))}
      </div>

      {/* ── GENERAL ── */}
      {tab === 'general' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="adm-card">
            <p className="adm-card-title">🏠 Sayt ma'lumotlari</p>
            <div className="adm-form">
              <div className="adm-field">
                <label>Sayt nomi</label>
                <input value={general.siteName} onChange={e => setGeneral(p => ({ ...p, siteName: e.target.value }))} />
              </div>
              <div className="adm-field">
                <label>Sayt tavsifi</label>
                <textarea value={general.siteDescription} onChange={e => setGeneral(p => ({ ...p, siteDescription: e.target.value }))} rows={3}
                  style={{ background: '#1a2035', border: '1px solid #2a3045', borderRadius: '8px', color: '#e8eaf0', padding: '0.6rem 0.75rem', fontSize: '0.875rem', outline: 'none', resize: 'vertical', width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div className="adm-field">
                <label>Admin email</label>
                <input type="email" value={general.adminEmail} onChange={e => setGeneral(p => ({ ...p, adminEmail: e.target.value }))} />
              </div>
              <div className="adm-field">
                <label>Support email</label>
                <input type="email" value={general.supportEmail} onChange={e => setGeneral(p => ({ ...p, supportEmail: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="adm-card">
            <p className="adm-card-title">📋 Tizim ma'lumotlari</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                ['Versiya', 'v2.0.0'], ['Django backend', '4.2.x'], ['React frontend', '18.x'],
                ['Database', 'PostgreSQL'], ['Deploy', 'Railway.app'], ['Python', '3.10.12'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#1a2035', borderRadius: '6px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#4b5580' }}>{k}</span>
                  <span style={{ color: '#e8eaf0', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── LANGUAGE ── */}
      {tab === 'language' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="adm-card">
            <p className="adm-card-title">🌐 Mavjud tillar</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              {LANGUAGES.map(lang => (
                <div key={lang.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#1a2035', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>{lang.flag}</span>
                    <div>
                      <div style={{ color: '#e8eaf0', fontWeight: 500 }}>{lang.native}</div>
                      <div style={{ color: '#4b5580', fontSize: '0.75rem' }}>{lang.code.toUpperCase()}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {langSettings.defaultLang === lang.code && <span className="adm-badge adm-badge-green">Asosiy</span>}
                    <Toggle value={langSettings.availableLangs.includes(lang.code)} onChange={() => toggleLang(lang.code)} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="adm-card" style={{ marginBottom: '1rem' }}>
              <p className="adm-card-title">⚙️ Til sozlamalari</p>
              <div className="adm-form">
                <div className="adm-field">
                  <label>Asosiy til</label>
                  <select value={langSettings.defaultLang} onChange={e => setLangSettings(p => ({ ...p, defaultLang: e.target.value }))}
                    style={{ background: '#1a2035', border: '1px solid #2a3045', borderRadius: '8px', color: '#e8eaf0', padding: '0.6rem 0.75rem', fontSize: '0.875rem', outline: 'none', width: '100%' }}>
                    {LANGUAGES.filter(l => langSettings.availableLangs.includes(l.code)).map(l => (
                      <option key={l.code} value={l.code}>{l.flag} {l.native}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#1a2035', borderRadius: '8px', marginTop: '0.75rem' }}>
                <div>
                  <div style={{ color: '#e8eaf0', fontSize: '0.875rem' }}>RTL qo'llab-quvvatlash</div>
                  <div style={{ color: '#4b5580', fontSize: '0.75rem' }}>Arab, Fors tillari uchun</div>
                </div>
                <Toggle value={langSettings.rtlSupport} onChange={() => setLangSettings(p => ({ ...p, rtlSupport: !p.rtlSupport }))} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── THEME ── */}
      {tab === 'theme' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="adm-card">
            <p className="adm-card-title">🎨 Mavzu tanlash</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[
                { key: 'dark', label: '🌙 Qoʻngʻir (Dark)', desc: 'Hozirgi mavzu', bg: '#0f1117', text: '#e8eaf0' },
                { key: 'light', label: '☀️ Yorugʻ (Light)', desc: 'Kelajakda', bg: '#f8f9fa', text: '#2c3e50' },
                { key: 'custom', label: '🎨 Shaxsiy', desc: 'Ranglarni o\'zingiz tanlang', bg: theme.bgColor, text: '#e8eaf0' },
              ].map(opt => (
                <div key={opt.key} onClick={() => setTheme(p => ({ ...p, mode: opt.key }))}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', background: theme.mode === opt.key ? '#2a1845' : '#1a2035', border: `2px solid ${theme.mode === opt.key ? '#a78bfa' : '#2a3045'}`, borderRadius: '10px', cursor: 'pointer' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: opt.bg, border: '1px solid #2a3045', flexShrink: 0 }} />
                  <div>
                    <div style={{ color: '#e8eaf0', fontWeight: 500 }}>{opt.label}</div>
                    <div style={{ color: '#4b5580', fontSize: '0.75rem' }}>{opt.desc}</div>
                  </div>
                  {theme.mode === opt.key && <span className="adm-badge adm-badge-purple" style={{ marginLeft: 'auto' }}>Tanlangan</span>}
                </div>
              ))}
            </div>

            {theme.mode === 'custom' && (
              <div className="adm-form">
                <div className="adm-form-row">
                  {[['primaryColor', 'Asosiy rang'], ['accentColor', 'Urg\'u rang'], ['bgColor', 'Fon rangi']].map(([key, label]) => (
                    <div key={key} className="adm-field">
                      <label>{label}</label>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input type="color" value={theme[key]} onChange={e => setTheme(p => ({ ...p, [key]: e.target.value }))} style={{ width: '40px', height: '36px', padding: '2px', background: 'none', border: '1px solid #2a3045', borderRadius: '6px', cursor: 'pointer' }} />
                        <input value={theme[key]} onChange={e => setTheme(p => ({ ...p, [key]: e.target.value }))} style={{ background: '#1a2035', border: '1px solid #2a3045', borderRadius: '8px', color: '#e8eaf0', padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none', flex: 1 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="adm-card">
            <p className="adm-card-title">👁️ Ko'rinish namunasi</p>
            <div style={{ background: theme.mode === 'light' ? '#f8f9fa' : '#1a2035', borderRadius: '10px', padding: '1rem', border: '1px solid #2a3045' }}>
              <div style={{ background: theme.primaryColor, padding: '0.5rem 0.75rem', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Header / Button</div>
              <div style={{ background: theme.mode === 'light' ? '#fff' : '#141820', padding: '0.75rem', borderRadius: '6px', border: '1px solid #2a3045', marginBottom: '0.5rem' }}>
                <div style={{ color: theme.mode === 'light' ? '#2c3e50' : '#e8eaf0', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Kitob sarlavhasi</div>
                <div style={{ color: '#8b92b0', fontSize: '0.75rem' }}>Muallif ismi · Janr</div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <div style={{ background: theme.accentColor, padding: '0.3rem 0.6rem', borderRadius: '4px', color: '#fff', fontSize: '0.7rem' }}>Badge</div>
                <div style={{ background: '#4ade80', padding: '0.3rem 0.6rem', borderRadius: '4px', color: '#fff', fontSize: '0.7rem' }}>Faol</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {tab === 'notifications' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="adm-card">
            <p className="adm-card-title">🔔 Bildirishnoma kanallari</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { key: 'email', icon: '📧', label: 'Email bildirishnomalar', desc: 'Muhim hodisalar haqida email olasiz' },
                { key: 'push', icon: '🔔', label: 'Push bildirishnomalar', desc: 'Brauzer bildirishnomalari' },
                { key: 'sms', icon: '📱', label: 'SMS bildirishnomalar', desc: 'Xavfsizlik hodisalari uchun' },
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#1a2035', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>{item.icon}</span>
                    <div>
                      <div style={{ color: '#e8eaf0', fontWeight: 500, fontSize: '0.875rem' }}>{item.label}</div>
                      <div style={{ color: '#4b5580', fontSize: '0.75rem' }}>{item.desc}</div>
                    </div>
                  </div>
                  <Toggle value={notifs[item.key]} onChange={() => setNotifs(p => ({ ...p, [item.key]: !p[item.key] }))} />
                </div>
              ))}
            </div>
          </div>

          <div className="adm-card">
            <p className="adm-card-title">⏱️ Digest chastotasi</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[['realtime', '⚡ Real vaqt'], ['daily', '📅 Kunlik'], ['weekly', '📆 Haftalik'], ['monthly', '🗓️ Oylik'], ['never', '🔕 Hech qachon']].map(([val, label]) => (
                <div key={val} onClick={() => setNotifs(p => ({ ...p, digestFrequency: val }))}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', background: notifs.digestFrequency === val ? '#2a1845' : '#1a2035', border: `1px solid ${notifs.digestFrequency === val ? '#a78bfa' : '#2a3045'}`, borderRadius: '8px', cursor: 'pointer' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${notifs.digestFrequency === val ? '#a78bfa' : '#4b5580'}`, background: notifs.digestFrequency === val ? '#a78bfa' : 'none', flexShrink: 0 }} />
                  <span style={{ color: '#e8eaf0', fontSize: '0.875rem' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── INTEGRATIONS ── */}
      {tab === 'integrations' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {INTEGRATIONS.map(item => (
            <div key={item.key} className="adm-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                <div>
                  <div style={{ color: '#e8eaf0', fontWeight: 600 }}>{item.label}</div>
                  <div style={{ color: '#4b5580', fontSize: '0.75rem' }}>{item.desc}</div>
                </div>
                <span className={`adm-badge ${integrations[item.key] ? 'adm-badge-green' : 'adm-badge-gray'}`} style={{ marginLeft: 'auto' }}>
                  {integrations[item.key] ? '● Ulangan' : '○ Ulanmagan'}
                </span>
              </div>
              <div className="adm-field">
                <label>API Key / ID</label>
                <input value={integrations[item.key]} onChange={e => setIntegrations(p => ({ ...p, [item.key]: e.target.value }))}
                  placeholder={item.placeholder} />
              </div>
              {integrations[item.key] && (
                <button className="adm-btn adm-btn-sm adm-btn-secondary" style={{ marginTop: '0.5rem' }}
                  onClick={() => setIntegrations(p => ({ ...p, [item.key]: '' }))}>
                  ✕ Uzish
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── AI ── */}
      {tab === 'ai' && (
        <div>
          <div className="adm-card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="adm-card-title" style={{ margin: 0 }}>🤖 AI Chat yordamchisi</p>
                <p style={{ color: '#4b5580', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>Foydalanuvchilarga AI yordamchisi ko'rsatish</p>
              </div>
              <Toggle value={ai.enabled} onChange={() => setAi(p => ({ ...p, enabled: !p.enabled }))} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { key: 'claudeApiKey', label: 'Claude (Anthropic)', icon: '🤖', placeholder: 'sk-ant-api03-...', hint: 'console.anthropic.com' },
              { key: 'geminiApiKey', label: 'Gemini (Google)', icon: '✨', placeholder: 'AIzaSy...', hint: 'aistudio.google.com' },
              { key: 'openaiApiKey', label: 'ChatGPT (OpenAI)', icon: '💬', placeholder: 'sk-...', hint: 'platform.openai.com' },
              { key: 'grokApiKey', label: 'Grok (xAI)', icon: '⚡', placeholder: 'xai-...', hint: 'x.ai' },
            ].map(prov => (
              <div key={prov.key} className="adm-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>{prov.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#e8eaf0', fontWeight: 600, fontSize: '0.9rem' }}>{prov.label}</div>
                  </div>
                  <span className={`adm-badge ${ai[prov.key] ? 'adm-badge-green' : 'adm-badge-gray'}`} style={{ fontSize: '0.7rem' }}>
                    {ai[prov.key] ? '● Faol' : '○ Yo\'q'}
                  </span>
                </div>
                <div className="adm-field">
                  <label>API Key</label>
                  <input type="password" value={ai[prov.key]} onChange={e => setAi(p => ({ ...p, [prov.key]: e.target.value }))}
                    placeholder={prov.placeholder} />
                </div>
                <div style={{ fontSize: '0.72rem', color: '#4b5580', marginTop: '0.25rem' }}>🔗 {prov.hint}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
