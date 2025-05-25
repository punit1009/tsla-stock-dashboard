const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting build process...');

// Install Vite if not present
try {
  console.log('Installing Vite...');
  execSync('npm install vite@latest --no-save', { stdio: 'inherit' });
  
  // Get the path to the Vite binary
  const vitePath = path.resolve(process.cwd(), 'node_modules/.bin/vite');
  
  if (!fs.existsSync(vitePath)) {
    throw new Error('Vite binary not found after installation');
  }
  
  console.log('Running Vite build...');
  execSync(`${vitePath} build --config vite.config.js`, { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
