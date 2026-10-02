import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://leave-lab.pages.dev', // 도메인 구매 후 교체
  integrations: [sitemap()],
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'th'],
    routing: { prefixDefaultLocale: false },
  },
  build: { format: 'directory' },
});
