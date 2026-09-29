import { getCollection } from 'astro:content';
export async function GET(context) {
  const posts = (await getCollection('log', p => p.data.lang === 'ko' && !p.data.draft))
    .sort((a, b) => b.data.date - a.data.date);
  const items = posts.map(p => `<item><title><![CDATA[${p.data.title}]]></title><link>${context.site}log/${p.id.replace(/^ko\//,'')}/</link><description><![CDATA[${p.data.description}]]></description><pubDate>${p.data.date.toUTCString()}</pubDate></item>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>육아휴직 개발자 수익화 실험</title><link>${context.site}</link><description>검증 일지와 실험 로그</description>${items}</channel></rss>`, { headers: { 'Content-Type': 'application/xml' } });
}
