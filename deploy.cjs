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
console.log('Copying backend files...');
const backendDir = path.join(config.deployDir, 'backend');
fs.mkdirSync(backendDir, { recursive: true });

// Ensure data directory exists in the deployment
const deployDataDir = path.join(backendDir, 'data');
if (!fs.existsSync(deployDataDir)) {
  fs.mkdirSync(deployDataDir, { recursive: true });
  console.log(`Created data directory: ${deployDataDir}`);
}

// Copy backend files individually to handle .env properly
const backendFiles = fs.readdirSync(config.backendDir);
backendFiles.forEach(file => {
  // Skip node_modules and other non-essential files
  if (file === 'node_modules' || file.startsWith('.')) return;
  
  const srcPath = path.join(config.backendDir, file);
  const destPath = path.join(backendDir, file);
  
  if (fs.statSync(srcPath).isDirectory()) {
    copyDir(srcPath, destPath);
  } else {
    fs.copyFileSync(srcPath, destPath);
  }
});

// Copy the Excel data file if it exists in the project root
const excelFileName = 'TSLA_data.xlsx';
const excelSrcPath = path.join(config.frontendDir, excelFileName);
const excelDestPath = path.join(backendDir, excelFileName);

if (fs.existsSync(excelSrcPath)) {
  console.log(`Copying ${excelFileName} to deployment...`);
  fs.copyFileSync(excelSrcPath, excelDestPath);
  console.log(`Successfully copied ${excelFileName} to ${excelDestPath}`);
} else {
  console.warn(`Warning: ${excelFileName} not found in project root.`);
  console.log('Looking for Excel file in parent directories...');
  
  // Try to find the Excel file in parent directories
  const findFileInParents = (filename, startDir = config.frontendDir) => {
    const fullPath = path.join(startDir, filename);
    if (fs.existsSync(fullPath)) return fullPath;
    
    const parentDir = path.dirname(startDir);
    if (parentDir === startDir) return null;
    
    return findFileInParents(filename, parentDir);
  };
  
  const foundExcelPath = findFileInParents(excelFileName);
  if (foundExcelPath) {
    console.log(`Found ${excelFileName} at: ${foundExcelPath}`);
    fs.copyFileSync(foundExcelPath, excelDestPath);
    console.log(`Successfully copied ${excelFileName} to ${excelDestPath}`);
  } else {
    console.error(`Error: Could not find ${excelFileName} in the project or parent directories.`);
  }
}

// Install production dependencies directly in deploy directory
console.log('Installing production dependencies in deploy directory...');

// Create a minimal package.json in deploy directory
const packageJson = JSON.parse(fs.readFileSync(path.join(config.frontendDir, 'package.json'), 'utf8'));

// Create a minimal package.json for production
const prodPackageJson = {
  name: packageJson.name,
  version: packageJson.version,
  private: true,
  scripts: {
    start: 'node backend/server.js',
    'convert-data': 'node backend/convert-excel-to-json.js',
    'postinstall': 'npm run convert-data'
  },
  dependencies: {
    express: '^4.18.2',
    'cors': '^2.8.5',
    'dotenv': '^16.0.3',
    'xlsx': '^0.18.5'
  },
  type: 'commonjs'
};

// Write the package.json to deploy directory
fs.writeFileSync(
  path.join(config.deployDir, 'package.json'),
  JSON.stringify(prodPackageJson, null, 2)
);

// Install production dependencies
console.log('Running npm install in deploy directory...');
try {
  execSync('npm install --production', { 
    cwd: config.deployDir,
    stdio: 'inherit' 
  });
  console.log('Dependencies installed successfully in deploy directory');
} catch (error) {
  console.error('Failed to install dependencies in deploy directory:', error);
  process.exit(1);
}

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

// Ensure the dist directory exists
const distDeployDir = path.join(config.deployDir, 'dist');
if (!fs.existsSync(distDeployDir)) {
  fs.mkdirSync(distDeployDir, { recursive: true });
}

// Copy the dist directory contents
console.log('Copying frontend build files...');
const distFiles = fs.readdirSync(config.distDir);
for (const file of distFiles) {
  const srcPath = path.join(config.distDir, file);
  const destPath = path.join(distDeployDir, file);
  
  if (fs.statSync(srcPath).isDirectory()) {
    copyDir(srcPath, destPath);
  } else {
    fs.copyFileSync(srcPath, destPath);
  }
}

// Ensure the backend directory exists in deploy
const backendDeployDir = path.join(config.deployDir, 'backend');
if (!fs.existsSync(backendDeployDir)) {
  fs.mkdirSync(backendDeployDir, { recursive: true });
}

// Create a root package.json for the deploy directory
const rootPackageJson = {
  "name": "tsla-stock-dashboard",
  "version": "1.0.0",
  "private": true,
  "type": "commonjs",
  "scripts": {
    "start": "node backend/server.js",
    "install": "cd backend && npm install --production && cd .."
  },
  "engines": {
    "node": ">=16.0.0"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "axios": "^1.9.0"
  }
};

// Create a backend package.json
const backendPackageJson = {
  "name": "tsla-stock-dashboard-backend",
  "version": "1.0.0",
  "private": true,
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "axios": "^1.9.0"
  }
};

// Write root package.json
fs.writeFileSync(
  path.join(config.deployDir, 'package.json'),
  JSON.stringify(rootPackageJson, null, 2)
);

// Write backend package.json
fs.writeFileSync(
  path.join(config.deployDir, 'backend', 'package.json'),
  JSON.stringify(backendPackageJson, null, 2)
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
