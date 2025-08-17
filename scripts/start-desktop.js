const { spawn } = require('child_process');
const { execSync } = require('child_process');

console.log('🚀 Starting Expense Sharing Desktop App...\n');

// Function to check if port is in use
function isPortInUse(port) {
  try {
    execSync(`netstat -an | findstr :${port}`, { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if port 3000 is available
if (isPortInUse(3000)) {
  console.log('⚠️  Port 3000 is already in use. Please close any running Next.js apps.\n');
  console.log('You can kill the process using:');
  console.log('netstat -ano | findstr :3000');
  console.log('taskkill /PID <PID> /F\n');
  process.exit(1);
}

// Start Next.js dev server
console.log('📦 Starting Next.js development server...');
const nextProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Wait for server to start and then launch Electron
setTimeout(() => {
  console.log('\n🖥️  Starting Electron app...');
  const electronProcess = spawn('electron', ['electron/main.js'], {
    stdio: 'inherit',
    shell: true
  });

  electronProcess.on('close', () => {
    console.log('\n👋 Electron app closed. Shutting down Next.js server...');
    nextProcess.kill();
    process.exit(0);
  });

  electronProcess.on('error', (error) => {
    console.error('❌ Error starting Electron:', error.message);
    nextProcess.kill();
    process.exit(1);
  });
}, 8000); // Wait 8 seconds for Next.js to start

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  nextProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  nextProcess.kill();
  process.exit(0);
}); 