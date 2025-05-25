/**
 * Deployment script for the TSLA Stock Dashboard
 * This script builds the frontend and prepares the project for deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  frontendDir: path.resolve(__dirname),
  backendDir: path.resolve(__dirname, 'backend'),
  distDir: path.resolve(__dirname, 'dist'),
  deployDir: path.resolve(__dirname, 'deploy')
};

// Helper function to run commands
function runCommand(command, cwd = config.frontendDir) {
  console.log(`\n> ${command}`);
  try {
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Create deploy directory if it doesn't exist
if (!fs.existsSync(config.deployDir)) {
  fs.mkdirSync(config.deployDir, { recursive: true });
  console.log(`Created deploy directory: ${config.deployDir}`);
}

// Build frontend
console.log('\n📦 Building frontend...');
if (!runCommand('npm run build')) {
  process.exit(1);
}

// Copy backend files to deploy directory
console.log('\n📦 Preparing backend files...');
if (!fs.existsSync(path.join(config.deployDir, 'backend'))) {
  fs.mkdirSync(path.join(config.deployDir, 'backend'), { recursive: true });
}

// Copy server.js and package.json
fs.copyFileSync(
  path.join(config.backendDir, 'server.js'),
  path.join(config.deployDir, 'backend', 'server.js')
);

fs.copyFileSync(
  path.join(config.backendDir, 'package.json'),
  path.join(config.deployDir, 'backend', 'package.json')
);

// Copy .env.production to .env in the deploy directory
fs.copyFileSync(
  path.join(config.backendDir, '.env.production'),
  path.join(config.deployDir, 'backend', '.env')
);

// Copy frontend build to deploy directory
console.log('\n📦 Copying frontend build...');
if (!fs.existsSync(path.join(config.deployDir, 'dist'))) {
  fs.mkdirSync(path.join(config.deployDir, 'dist'), { recursive: true });
}

// Helper function to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy the dist directory
copyDir(config.distDir, path.join(config.deployDir, 'dist'));

// Ensure the backend directory exists in deploy
const backendDeployDir = path.join(config.deployDir, 'backend');
if (!fs.existsSync(backendDeployDir)) {
  fs.mkdirSync(backendDeployDir, { recursive: true });
}

// Copy backend files individually to handle .env properly
const backendFiles = fs.readdirSync(config.backendDir);
backendFiles.forEach(file => {
  // Skip node_modules and other non-essential files
  if (file === 'node_modules' || file.startsWith('.')) return;
  
  const srcPath = path.join(config.backendDir, file);
  const destPath = path.join(backendDeployDir, file);
  
  if (fs.statSync(srcPath).isDirectory()) {
    copyDir(srcPath, destPath);
  } else {
    fs.copyFileSync(srcPath, destPath);
  }
});

// Create a root package.json for the deploy directory
const rootPackageJson = {
  "name": "tsla-stock-dashboard",
  "version": "1.0.0",
  "private": true,
  "type": "commonjs",
  "scripts": {
    "preinstall": "npm install -g npm@latest",
    "install": "cd backend && npm install --production && cd ..",
    "start": "node backend/server.js",
    "build": "npm install && npm run build"
  },
  "engines": {
    "node": ">=16.0.0"
  },
  "dependencies": {
    // Backend dependencies will be installed from backend/package.json
  },
  "cacheDirectories": [
    "node_modules",
    "backend/node_modules"
  ]
};

fs.writeFileSync(
  path.join(config.deployDir, 'package.json'),
  JSON.stringify(rootPackageJson, null, 2)
);

// Create a README.md with deployment instructions
const readmeContent = `# TSLA Stock Dashboard

A dashboard for analyzing Tesla stock data with AI-powered insights.

## Deployment Instructions

### Prerequisites

- Node.js 16 or higher
- NPM or Yarn

### Local Deployment

1. Install dependencies and start the server:
   \`\`\`
   npm start
   \`\`\`

2. The application will be available at http://localhost:3000

### Environment Variables

The following environment variables can be set in the \`.env\` file in the backend directory:

- \`PORT\`: The port on which the server will run (default: 3000)
- \`GEMINI_API_KEY\`: Your Google Gemini API key
- \`FRONTEND_URL\`: The URL of the frontend (for CORS)
- \`NODE_ENV\`: Set to 'production' for production deployment

### Cloud Deployment

This application can be deployed to various cloud platforms:

#### Heroku

1. Create a new Heroku app
2. Set the environment variables in the Heroku dashboard
3. Deploy using the Heroku CLI or GitHub integration

#### Render

1. Create a new Web Service
2. Set the build command to \`npm install\`
3. Set the start command to \`npm start\`
4. Set the environment variables

#### Netlify

1. Deploy the frontend to Netlify
2. Deploy the backend separately to a service like Render or Heroku
3. Update the \`VITE_GEMINI_API_URL\` in the frontend to point to your backend URL
`;

fs.writeFileSync(
  path.join(config.deployDir, 'README.md'),
  readmeContent
);

// Create a .gitignore file
fs.writeFileSync(
  path.join(config.deployDir, '.gitignore'),
  'node_modules\n.DS_Store\n.env.local\n'
);

console.log('\n✅ Deployment package prepared successfully!');
console.log(`📁 Deploy directory: ${config.deployDir}`);
console.log('\n📋 Next steps:');
console.log('1. Navigate to the deploy directory');
console.log('2. Deploy to your hosting provider');
console.log('3. Set the required environment variables');
