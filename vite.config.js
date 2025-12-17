
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    // Bind to 0.0.0.0 and the PORT Render provides
    host: true, // equivalent to 0.0.0.0
    port: Number(process.env.PORT) || 4173,

    // Allow your Render hostname(s)
    allowedHosts: [
      'frontend-ljg7.onrender.com',
      'admin.vidhyapat.com',
      'frontend-csp9.onrender.com',
      // add any other domains you will use (custom domain, etc.)
    ],
  },
})


