import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  output: 'hybrid', // 支持SSR和静态生成
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    }
  }),
  image: {
    service: {
      entrypoint: 'astro/assets/services/noop'
    }
  },
  integrations: [
    tailwind(),
    react()
  ],
  build: {
    assets: '_astro'
  },
  server: {
    port: 4321,
    host: true
  },
  vite: {
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    }
  }
});