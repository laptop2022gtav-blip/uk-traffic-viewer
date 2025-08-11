import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// If deploying to GitHub Pages project site, set VITE_BASE to `/<repo>/`
// e.g. VITE_BASE='/uk-traffic-viewer/'
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
})
