import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://leave-lab.com',
  integrations: [sitemap()],
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'th'],
    routing: { prefixDefaultLocale: false },
  },
  build: { format: 'directory' },
});
