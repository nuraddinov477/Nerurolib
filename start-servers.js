const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// .env faylini o'qish
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
  }
}

loadEnv();

const NODE_PORT = process.env.NODE_PORT || 3001;
const PYTHON_PORT = process.env.PYTHON_PORT || 5000;

console.log('🚀 Starting both Node.js and Python servers...\n');
console.log(`📦 Node.js  → http://localhost:${NODE_PORT}`);
console.log(`🐍 Python   → http://localhost:${PYTHON_PORT}`);
console.log('\nPress Ctrl+C to stop both servers\n');

// Start Node.js server
const nodeServer = spawn('node', ['server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: NODE_PORT }
});

// Start Python Flask server
const pythonServer = spawn('python', ['main.py'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PYTHON_PORT: PYTHON_PORT }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down servers...');
  nodeServer.kill();
  pythonServer.kill();
  process.exit();
});

nodeServer.on('error', (err) => {
  console.error('❌ Node.js server error:', err);
});

pythonServer.on('error', (err) => {
  console.error('❌ Python server error:', err);
});
