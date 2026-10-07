import { defineConfig } from 'vite';

export default defineConfig({
  base: '/', // or '/trail-explorer/' for GitHub Pages
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      drafts: {
        customMedia: true, // <-- ENABLES @custom-media TRANSPILATION
      },
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