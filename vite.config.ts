import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  // Relative asset paths, so the same build works from a web server, a subfolder,
  // and from inside the Electron window (which loads it off disk).
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  // Lessons live in /curriculum (outside src) and are imported with ?raw.
  server: { fs: { allow: ['.'] } },
});
