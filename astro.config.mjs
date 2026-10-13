import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';
import rehypeSummary from './src/lib/rehypeSummary.mjs';
import remarkGfm from 'remark-gfm';

const site = 'https://leave-lab.com';

// 태국어 글이 없으면 /th/는 사이트맵에서 뺀다 (빈 페이지를 검색엔진에 내지 않는다)
const thPosts = (() => {
  try { return readdirSync('./src/content/log/th').filter(f => f.endsWith('.md')).length; } catch { return 0; }
})();

// public/tools/*.html 계산기는 Astro 라우트가 아니라서 사이트맵에 자동으로 들어가지 않는다. 레지스트리에서 넣는다.
// Cloudflare Pages가 .html 주소를 확장자 없는 주소로 308 리다이렉트하므로 확장자 없는 주소를 쓴다.
const registry = JSON.parse(readFileSync('./public/tools/_registry.json', 'utf-8'));
const toolPages = registry.filter(t => !t.file.endsWith('/')).map(t => `${site}/tools/${t.file}`);

export default defineConfig({
  site,
  integrations: [
    sitemap({
      customPages: toolPages,
      filter: page => thPosts > 0 || !page.includes('/th/'),
      // 글 주소에 든 날짜(/log/YYYY-MM-DD-…)를 lastmod로 쓴다
      serialize(item) {
        const m = item.url.match(/\/log\/(\d{4}-\d{2}-\d{2})-/);
        if (m) item.lastmod = m[1];
        return item;
      },
    }),
  ],
  // GFM은 직접 넣는다. 기본값은 물결표 하나(~)도 취소선으로 바꿔서 "1~3개월"처럼 범위를 적은 글이 깨진다.
  // singleTilde: false → ~~두 개~~만 취소선.
  markdown: { gfm: false, remarkPlugins: [[remarkGfm, { singleTilde: false }]], rehypePlugins: [rehypeSummary] },
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'th'],
    routing: { prefixDefaultLocale: false },
  },
  build: { format: 'directory' },
});
