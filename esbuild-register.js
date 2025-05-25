// Required for Render.com's Node 22 environment
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { register } from 'module';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use dynamic import to load esbuild in a way that works with ESM
import('esbuild').then(esbuild => {
  esbuild.register({
    loader: 'tsx',
    target: 'es2022'
  });
}).catch(err => {
  console.error('Failed to load esbuild:', err);
  process.exit(1);
});
