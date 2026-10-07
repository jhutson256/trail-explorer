import { defineConfig } from 'vite';

export default defineConfig({
  base: '/', // Use '/' for Netlify, or '/trail-explorer/' for GitHub Pages
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: {
        chrome: 100,
        firefox: 100,
        safari: 15,
      },
    },
  },
  build: {
    cssMinify: 'lightningcss',
  },
});