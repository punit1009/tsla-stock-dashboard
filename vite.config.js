const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const { resolve } = require('path');

// https://vitejs.dev/config/
module.exports = defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production';
  
  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    build: {
      outDir: 'dist',
      sourcemap: !isProduction,
      minify: isProduction,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'lightweight-charts'],
            ui: ['lucide-react', 'react-tabs'],
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
