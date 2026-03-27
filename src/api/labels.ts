import apiClient from './client';
import type { Label } from '../types';

export const labelsApi = {
  getAll: () =>
    apiClient.get<{ data: Label[] }>('/labels').then((r) => r.data.data ?? r.data),

  create: (name: string) =>
    apiClient.post<Label>('/labels', { name }).then((r) => r.data),

  update: (id: number, name: string) =>
    apiClient.patch<Label>(`/labels/${id}`, { name }).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/labels/${id}`).then((r) => r.data),
};
