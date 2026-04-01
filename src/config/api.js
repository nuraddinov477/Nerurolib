// Production: same host (Django serves both frontend and API)
// Development: Django runs on port 8000
const defaultApiBase = typeof window !== 'undefined'
  ? (process.env.NODE_ENV === 'production'
      ? `${window.location.protocol}//${window.location.host}/api`
      : 'http://localhost:8000/api')
  : 'http://localhost:8000/api';

export const API_BASE = (process.env.REACT_APP_API_URL || defaultApiBase).replace(/\/+$/, '');

export function buildApiUrl(path = '') {
  if (!path) return API_BASE;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const withSlash = normalized.endsWith('/') ? normalized : `${normalized}/`;
  return `${API_BASE}${withSlash}`;
}
