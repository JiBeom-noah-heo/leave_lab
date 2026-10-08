import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
// 이 파일이나 astro.config를 고친 뒤 로컬 빌드에서 "The collection log does not exist or is empty"가 나면
// 콘텐츠 캐시가 낡은 것이다. `rm -rf .astro` 뒤 다시 빌드하면 된다(npm run build가 이를 자동으로 한다).
import { CATEGORIES, STATUSES } from './ui';

const log = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/log' }),
  schema: z.object({
    title: z.string().min(4),
    description: z.string().min(20).max(160),
    date: z.coerce.date(),
    lang: z.enum(['ko', 'th']),
    series: z.enum(['검증일지', '실험로그', '가이드']),
    verdict: z.enum(['GO', 'NO-GO', 'HOLD']).optional(),
    tags: z.array(z.string()).default([]),
    sources: z.array(z.object({ title: z.string(), url: z.string().url() })).default([]),
    draft: z.boolean().default(false),
    // 실험 카드 (design/Post.dc.html). 모두 선택 사항이라 기존 글은 그대로 빌드된다.
    expId: z.string().optional(),            // 예: EXP-02
    category: z.enum(CATEGORIES).optional(), // 홈 탭 필터 기준
    status: z.enum(STATUSES).optional(),
    startedOn: z.coerce.date().optional(),   // 실험 시작일. 없으면 발행일을 보여 준다
    hypothesis: z.string().optional(),
    method: z.string().optional(),
    result: z.string().optional(),
  }).refine(p => p.series !== '검증일지' || (p.verdict && p.sources.length > 0), {
    message: '검증일지는 verdict와 sources가 필수',
  }),
});

export const collections = { log };
