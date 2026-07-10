import apiClient from '../../shared/api/client';
import type { User, Credentials, RegisterData } from '../../shared/types';

export const usersApi = {
  getMe: () =>
    apiClient.get<{ data: User }>('/users').then((r) => r.data.data ?? r.data),

  login: (credentials: Credentials) =>
    apiClient.post('/users/login', credentials).then((r) => r.data),

  register: (data: RegisterData) =>
    apiClient.post<User>('/users', data).then((r) => r.data),

  logout: () =>
    apiClient.delete('/users/logout').then((r) => r.data),

  update: (formData: FormData) =>
    apiClient.patch<User>('/users', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  requestReset: (email: string) =>
    apiClient.post('/resetpassword', { email }).then((r) => r.data),

  validateResetToken: (resetToken: string) =>
    apiClient.get('/resetpassword', { params: { resetToken } }).then((r) => r.data),

  resetPassword: (password: string, resetToken: string) =>
    apiClient.patch('/resetpassword', { password, resetToken }).then((r) => r.data),

  updateSettings: async (settings: Record<string, unknown>) => {
    const current = await usersApi.getMe();
    const existing: Record<string, unknown> = current.settings ? JSON.parse(current.settings as string) : {};
    const merged: Record<string, unknown> = { ...existing };
    for (const [key, value] of Object.entries(settings)) {
      const existingVal = existing[key];
      if (
        value !== null && typeof value === 'object' && !Array.isArray(value) &&
        existingVal !== null && typeof existingVal === 'object' && !Array.isArray(existingVal)
      ) {
        merged[key] = { ...(existingVal as Record<string, unknown>), ...(value as Record<string, unknown>) };
      } else {
        merged[key] = value;
      }
    }
    const fd = new FormData();
    fd.append('settings', JSON.stringify(merged));
    return apiClient.patch('/users', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data ?? r.data);
  },
};
