import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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
  }).refine(p => p.series !== '검증일지' || (p.verdict && p.sources.length > 0), {
    message: '검증일지는 verdict와 sources가 필수',
  }),
});

export const collections = { log };
