import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBase = env.VITE_API_BASE_URL || 'http://localhost:8000'

  return {
  plugins: [
    react(),
    // Gzip compression for production
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // Brotli compression for production
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      // Proxy API requests to backend during development
      '/api': {
        target: apiBase,
        changeOrigin: true,
      },
    },
    // Add security headers for Plaid Link integration
    headers: {
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), accelerometer=(self), encrypted-media=(self)',
    },
  },
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Generate sourcemaps for debugging
    sourcemap: false,
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'chart-vendor': ['recharts', 'd3'],
          // UI chunks
          'utils': ['axios', 'zustand', 'uuid', 'date-fns'],
        },
      },
      plugins: [
        // Bundle analyzer - only in analyze mode
        process.env.ANALYZE === 'true' && visualizer({
          filename: './dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
          template: 'treemap', // or 'sunburst', 'network'
        }),
      ].filter(Boolean),
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 500, // 500KB warning threshold
  },
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      'axios',
      'zustand',
      'recharts',
      'd3',
    ],
  },
}
})
