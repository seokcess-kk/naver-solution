import { z } from 'zod';

export const placeSchema = z.object({
  naverPlaceId: z
    .string()
    .min(1, '네이버 플레이스 ID를 입력해주세요')
    .max(100, '네이버 플레이스 ID는 최대 100자까지 입력 가능합니다'),

  name: z
    .string()
    .min(1, '장소 이름을 입력해주세요')
    .max(200, '장소 이름은 최대 200자까지 입력 가능합니다'),

  category: z
    .string()
    .max(50, '카테고리는 최대 50자까지 입력 가능합니다')
    .optional(),

  address: z.string().optional(),

  naverPlaceUrl: z
    .string()
    .url('올바른 URL 형식을 입력해주세요')
    .min(1, '네이버 플레이스 URL을 입력해주세요'),
});

export const updatePlaceSchema = z.object({
  naverPlaceId: z
    .string()
    .min(1, '네이버 플레이스 ID를 입력해주세요')
    .max(100, '네이버 플레이스 ID는 최대 100자까지 입력 가능합니다')
    .optional(),

  name: z
    .string()
    .min(1, '장소 이름을 입력해주세요')
    .max(200, '장소 이름은 최대 200자까지 입력 가능합니다')
    .optional(),

  category: z
    .string()
    .max(50, '카테고리는 최대 50자까지 입력 가능합니다')
    .optional(),

  address: z.string().optional(),

  naverPlaceUrl: z
    .string()
    .url('올바른 URL 형식을 입력해주세요')
    .optional(),
});

export type PlaceFormData = z.infer<typeof placeSchema>;
export type UpdatePlaceFormData = z.infer<typeof updatePlaceSchema>;
