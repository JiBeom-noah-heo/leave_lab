import { getCollection } from 'astro:content';

// 네이버 서치어드바이저 가이드(검색엔진 최적화의 목적 5번): 최신글은 본문 전체를 RSS에 담는다.
// Astro 5 glob 로더가 빌드 때 만든 rendered.html을 content:encoded로 넣는다.
// 가이드 10번: 피드 안 링크는 절대 URL이어야 수집한다. 본문의 "/..." 경로를 site 기준 절대 URL로 바꾼다.

const cdata = (s) => `<![CDATA[${String(s ?? '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;

function absolutize(html, site) {
  const base = String(site).replace(/\/$/, '');
  return html.replace(/(\s(?:href|src)=")\/(?!\/)/g, `$1${base}/`);
}

export async function GET(context) {
  const posts = (await getCollection('log', p => p.data.lang === 'ko' && !p.data.draft))
    .sort((a, b) => b.data.date - a.data.date);
  const items = posts.map(p => {
    const url = `${context.site}log/${p.id.replace(/^ko\//, '')}/`;
    const html = p.rendered?.html ? absolutize(p.rendered.html, context.site) : '';
    return `<item>` +
      `<title>${cdata(p.data.title)}</title>` +
      `<link>${url}</link>` +
      `<guid isPermaLink="true">${url}</guid>` +
      `<description>${cdata(p.data.description)}</description>` +
      (html ? `<content:encoded>${cdata(html)}</content:encoded>` : '') +
      `<pubDate>${p.data.date.toUTCString()}</pubDate>` +
      `</item>`;
  }).join('');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">` +
    `<channel><title>육아휴직 개발자 수익화 실험</title><link>${context.site}</link>` +
    `<atom:link href="${context.site}rss.xml" rel="self" type="application/rss+xml"/>` +
    `<description>검증 일지와 실험 로그</description><language>ko</language>${items}</channel></rss>`,
    { headers: { 'Content-Type': 'application/xml' } });
}
