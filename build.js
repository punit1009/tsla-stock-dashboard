const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting build process...');

// Function to find Vite binary
function findViteBinary() {
  // Try local node_modules/.bin first
  const localBinPath = path.resolve(process.cwd(), 'node_modules/.bin/vite');
  if (fs.existsSync(localBinPath)) {
    return localBinPath;
  }
  
  // Try global npm path
  try {
    const npmRoot = execSync('npm root -g').toString().trim();
    const globalVitePath = path.join(npmRoot, '.bin/vite');
    if (fs.existsSync(globalVitePath)) {
      return globalVitePath;
    }
  } catch (e) {
    console.log('Could not find global npm root');
  }
  
  // Try direct path in node_modules
  const directPath = path.resolve(process.cwd(), 'node_modules/vite/bin/vite.js');
  if (fs.existsSync(directPath)) {
    return `node ${directPath}`;
  }
  
  return null;
}

// Main build process
try {
  console.log('Installing Vite...');
  execSync('npm install vite@latest --save-dev', { stdio: 'inherit' });
  
  // Find Vite binary
  const viteCommand = findViteBinary();
  if (!viteCommand) {
    console.log('Vite binary not found, trying to install globally...');
    execSync('npm install -g vite@latest', { stdio: 'inherit' });
    
    const globalViteCommand = findViteBinary();
    if (!globalViteCommand) {
      throw new Error('Failed to find or install Vite binary');
    }
    
    console.log('Running Vite build with global installation...');
    execSync(`${globalViteCommand} build --config vite.config.js`, { stdio: 'inherit' });
  } else {
    console.log('Running Vite build with local installation...');
    execSync(`${viteCommand} build --config vite.config.js`, { stdio: 'inherit' });
  }
  
  console.log('Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error.message);
  console.error('Full error:', error);
  process.exit(1);
}
