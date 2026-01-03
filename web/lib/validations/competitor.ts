import { z } from 'zod';

export const competitorSchema = z.object({
  competitorNaverPlaceId: z
    .string()
    .min(1, '경쟁사 네이버 플레이스 ID를 입력해주세요')
    .max(100, '네이버 플레이스 ID는 최대 100자까지 입력 가능합니다'),

  competitorName: z
    .string()
    .min(1, '경쟁사 이름을 입력해주세요')
    .max(200, '경쟁사 이름은 최대 200자까지 입력 가능합니다'),

  category: z
    .string()
    .max(50, '카테고리는 최대 50자까지 입력 가능합니다')
    .optional(),
});

export type CompetitorFormData = z.infer<typeof competitorSchema>;
