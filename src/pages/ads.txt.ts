// AdSense 승인 후 PUBLIC_ADSENSE_CLIENT(ca-pub-…)를 넣으면 /ads.txt가 자동으로 채워진다.
export function GET() {
  const client = import.meta.env.PUBLIC_ADSENSE_CLIENT ?? '';
  const pub = client.replace(/^ca-/, '');
  const body = pub.startsWith('pub-')
    ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`
    : '# AdSense 승인 후 PUBLIC_ADSENSE_CLIENT를 설정하면 이 파일이 채워집니다.\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
