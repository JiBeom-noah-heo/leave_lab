import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeSummary from './src/lib/rehypeSummary.mjs';

export default defineConfig({
  site: 'https://leave-lab.com',
  integrations: [sitemap()],
  markdown: { rehypePlugins: [rehypeSummary] },
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'th'],
    routing: { prefixDefaultLocale: false },
  },
  build: { format: 'directory' },
});
