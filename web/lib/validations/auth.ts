import { z } from 'zod';

// 로그인 스키마
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('유효한 이메일 주소를 입력해주세요'),
  password: z
    .string()
    .min(1, '비밀번호를 입력해주세요')
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// 회원가입 스키마
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('유효한 이메일 주소를 입력해주세요'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .max(128, '비밀번호는 최대 128자까지 가능합니다')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      '비밀번호는 대문자, 소문자, 숫자, 특수문자(@$!%*?&)를 포함해야 합니다'
    ),
  name: z
    .string()
    .min(1, '이름을 입력해주세요')
    .min(2, '이름은 최소 2자 이상이어야 합니다')
    .max(50, '이름은 최대 50자까지 가능합니다'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// 프로필 수정 스키마
export const updateProfileSchema = z.object({
  email: z
    .string()
    .email('유효한 이메일 주소를 입력해주세요')
    .optional()
    .or(z.literal('')),
  name: z
    .string()
    .min(2, '이름은 최소 2자 이상이어야 합니다')
    .max(50, '이름은 최대 50자까지 가능합니다')
    .optional()
    .or(z.literal('')),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

// 비밀번호 변경 스키마
export const changePasswordSchema = z
  .object({
    oldPassword: z
      .string()
      .min(1, '현재 비밀번호를 입력해주세요'),
    newPassword: z
      .string()
      .min(8, '새 비밀번호는 최소 8자 이상이어야 합니다')
      .max(128, '새 비밀번호는 최대 128자까지 가능합니다')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        '새 비밀번호는 대문자, 소문자, 숫자, 특수문자(@$!%*?&)를 포함해야 합니다'
      ),
    confirmPassword: z
      .string()
      .min(1, '비밀번호 확인을 입력해주세요'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
