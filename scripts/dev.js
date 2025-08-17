const { spawn } = require('child_process');
const { execSync } = require('child_process');

console.log('🚀 Starting Expense Sharing App in Desktop Mode...\n');

// Check if port 3000 is available
try {
  execSync('netstat -an | findstr :3000', { stdio: 'pipe' });
  console.log('⚠️  Port 3000 is already in use. Please close any running Next.js apps.\n');
} catch (error) {
  // Port is available
}

// Start Next.js dev server
console.log('📦 Starting Next.js development server...');
const nextProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Wait for server to start
setTimeout(() => {
  console.log('\n🖥️  Starting Electron app...');
  const electronProcess = spawn('npm', ['run', 'electron'], {
    stdio: 'inherit',
    shell: true
  });

  electronProcess.on('close', () => {
    console.log('\n👋 Electron app closed. Shutting down Next.js server...');
    nextProcess.kill();
    process.exit(0);
  });
}, 5000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  nextProcess.kill();
  process.exit(0);
}); 