import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/COMP4010_Project_2/',
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
