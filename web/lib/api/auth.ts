import apiClient from './client';
import { ApiResponse, LoginResponse, RegisterResponse, User } from '@/types/api';

export const authApi = {
  // 회원가입
  register: async (data: {
    email: string;
    password: string;
    name: string;
  }): Promise<ApiResponse<RegisterResponse>> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  // 로그인
  login: async (data: {
    email: string;
    password: string;
  }): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  // 토큰 갱신
  refreshToken: async (refreshToken: string): Promise<ApiResponse<{ accessToken: string }>> => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  // 프로필 조회
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  // 로그아웃
  logout: async (refreshToken?: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.post('/auth/logout', { refreshToken });
    return response.data;
  },

  // 프로필 수정
  updateProfile: async (data: {
    email?: string;
    name?: string;
  }): Promise<ApiResponse<User>> => {
    const response = await apiClient.patch('/auth/profile', data);
    return response.data;
  },

  // 비밀번호 변경
  changePassword: async (data: {
    oldPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<void>> => {
    const response = await apiClient.patch('/auth/password', data);
    return response.data;
  },
};

export default authApi;
