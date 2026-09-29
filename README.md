# leave-lab

육아휴직 개발자 수익화 실험 블로그. 자세한 규칙은 CLAUDE.md.

## 처음 한 번
1. 도메인 구매 → `astro.config.mjs`의 `site`, `public/robots.txt`의 Sitemap URL 교체
2. GitHub에 이 폴더를 저장소로 push
3. Cloudflare Pages → Connect to Git → Build `npm run build`, Output `dist`
4. Cloudflare에서 도메인 연결, 네이버 서치어드바이저·구글 서치콘솔에 사이트 등록
5. 애드센스 승인 후 Cloudflare Pages 환경변수에 `PUBLIC_ADSENSE_CLIENT` 추가

## 로컬
```
npm install
npm run dev
```

## blog_bot에서 발행
```python
from blog_bot.publishers.static_site import Post, Source, publish
publish(Post(title=..., description=..., body_md=..., series="검증일지", verdict="GO", sources=[Source(...)]))
```
`LEAVE_LAB_REPO`에 이 저장소의 로컬 클론 경로를 넣는다.
