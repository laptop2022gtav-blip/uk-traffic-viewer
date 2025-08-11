import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/uk-traffic-viewer/', // 👈 Add this for GitHub Pages
});
