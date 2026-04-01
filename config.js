// Backend Configuration
// Bu faylda qaysi backend ishlatilishini tanlash mumkin

const BACKEND_CONFIG = {
  // 'node' yoki 'python' tanlang
  activeBackend: 'node', // Default: Node.js
  
  backends: {
    node: {
      url: 'http://localhost:3001/api',
      name: 'Node.js + Express + SQLite'
    },
    python: {
      url: 'http://localhost:5000/api',
      name: 'Python + Flask + SQLite'
    }
  }
};

// Export qilish
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BACKEND_CONFIG;
}
