import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://example.com', // 도메인 확정 후 교체
  integrations: [sitemap()],
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'th'],
    routing: { prefixDefaultLocale: false },
  },
  build: { format: 'directory' },
});
