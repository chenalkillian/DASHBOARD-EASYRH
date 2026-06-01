import { defineConfig, loadEnv } from 'vite'
import process from 'node:process'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl =
    env.VITE_API_URL || env.VITE_BACKEND_URL || 'http://localhost:3000';

  return {
    appType: 'spa',
    plugins: [react(), tailwindcss()],
    test: {
      environment: 'node',
      include: ['src/**/*.{test,spec}.js'],
    },
    server: {
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
})
