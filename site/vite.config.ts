import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    proxy: {
      '/proxy/ecb': {
        target: 'https://sdw-wsrest.ecb.europa.eu',
        changeOrigin: true,
        secure: true,
        followRedirects: true,
        rewrite: (path) => path.replace(/^\/proxy\/ecb/, '')
      },
      '/proxy/justetf': {
        target: 'https://justetf.com',
        changeOrigin: true,
        secure: true,
        followRedirects: true,
        rewrite: (path) => path.replace(/^\/proxy\/justetf/, '')
      },
      '/proxy/yahoo_finance_query1': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        secure: true,
        followRedirects: true,
        rewrite: (path) => path.replace(/^\/proxy\/yahoo_finance_query1/, '')
      },
    }
  }
})
