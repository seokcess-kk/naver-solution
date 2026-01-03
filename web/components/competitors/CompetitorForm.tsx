'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  competitorSchema,
  type CompetitorFormData,
} from '@/lib/validations/competitor';
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

interface CompetitorFormProps {
  defaultValues?: Partial<CompetitorFormData>;
  onSubmit: (data: CompetitorFormData) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

export function CompetitorForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = '등록',
  onCancel,
}: CompetitorFormProps) {
  const form = useForm<CompetitorFormData>({
    resolver: zodResolver(competitorSchema),
    defaultValues: {
      competitorNaverPlaceId: defaultValues?.competitorNaverPlaceId || '',
      competitorName: defaultValues?.competitorName || '',
      category: defaultValues?.category || '',
    },
  });

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      window.history.back();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="competitorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>경쟁사 이름 *</FormLabel>
              <FormControl>
                <Input placeholder="예: 스타벅스 강남점" {...field} />
              </FormControl>
              <FormDescription>
                경쟁사의 네이버 플레이스에 표시되는 이름을 입력하세요 (1-200자)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="competitorNaverPlaceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>네이버 플레이스 ID *</FormLabel>
              <FormControl>
                <Input placeholder="예: 1234567890" {...field} />
              </FormControl>
              <FormDescription>
                경쟁사의 네이버 플레이스 URL에서 확인할 수 있는 ID (1-100자)
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
                경쟁사의 카테고리를 입력하세요 (선택, 최대 50자)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '등록 중...' : submitLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            취소
          </Button>
        </div>
      </form>
    </Form>
  );
}
