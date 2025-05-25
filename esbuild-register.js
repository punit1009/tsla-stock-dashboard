// Required for Render.com's Node 22 environment
require('esbuild').register({
  loader: 'tsx',
  target: 'es2022'
})
