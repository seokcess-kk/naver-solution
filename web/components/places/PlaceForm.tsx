'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { placeSchema, type PlaceFormData } from '@/lib/validations/place';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface PlaceFormProps {
  defaultValues?: Partial<PlaceFormData>;
  onSubmit: (data: PlaceFormData) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function PlaceForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = '저장',
}: PlaceFormProps) {
  const form = useForm<PlaceFormData>({
    resolver: zodResolver(placeSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      naverPlaceId: defaultValues?.naverPlaceId || '',
      category: defaultValues?.category || '',
      address: defaultValues?.address || '',
      naverPlaceUrl: defaultValues?.naverPlaceUrl || '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>장소명 *</FormLabel>
              <FormControl>
                <Input placeholder="예: 강남 카페" {...field} />
              </FormControl>
              <FormDescription>
                네이버 플레이스에 표시되는 장소명을 입력하세요 (1-200자)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="naverPlaceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>네이버 플레이스 ID *</FormLabel>
              <FormControl>
                <Input placeholder="예: 1234567890" {...field} />
              </FormControl>
              <FormDescription>
                네이버 플레이스 URL에서 확인할 수 있는 ID (1-100자)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="naverPlaceUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>네이버 플레이스 URL *</FormLabel>
              <FormControl>
                <Input
                  placeholder="예: https://pcmap.place.naver.com/restaurant/1234567890"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                네이버 플레이스 페이지의 전체 URL을 입력하세요
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>카테고리</FormLabel>
              <FormControl>
                <Input placeholder="예: 카페, 음식점, 병원" {...field} />
              </FormControl>
              <FormDescription>
                장소의 카테고리를 입력하세요 (선택, 최대 50자)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>주소</FormLabel>
              <FormControl>
                <Input placeholder="예: 서울특별시 강남구 ..." {...field} />
              </FormControl>
              <FormDescription>
                장소의 주소를 입력하세요 (선택)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '저장 중...' : submitLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={isSubmitting}
          >
            취소
          </Button>
        </div>
      </form>
    </Form>
  );
}
