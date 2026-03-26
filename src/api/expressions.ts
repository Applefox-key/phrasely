import apiClient from './client';
import type { ExpressionData, ExpressionUpdate } from '../types';

export interface ExpressionFilters {
  filter?: string;
  labelid?: number | string;
  stage?: number | string;
  status?: string;
  inQueue?: boolean | string;
}

export const expressionsApi = {
  getAll: (params?: ExpressionFilters) =>
    apiClient.get<ExpressionData[]>('/expressions', { params }).then((r) => r.data),

  getByFolders: (params?: ExpressionFilters) =>
    apiClient.get<Record<string, ExpressionData[]>>('/expressions/byfolders', { params }).then((r) => r.data),

  getUnread: (offset_ms?: number) =>
    apiClient.get<ExpressionData[]>('/expressions/unread', { params: { offset_ms } }).then((r) => r.data),

  create: (list: Partial<ExpressionData>[]) =>
    apiClient.post<ExpressionData[]>('/expressions', { list }).then((r) => r.data),

  update: (data: ExpressionUpdate) =>
    apiClient.patch<ExpressionData>('/expressions', data).then((r) => r.data),

  batchUpdate: (list: ExpressionUpdate[]) =>
    apiClient.patch<ExpressionData[]>('/expressions/batch', list).then((r) => r.data),

  updateOneField: (list: number[], field: string, fieldValue: unknown) =>
    apiClient.patch('/expressions/onefield', { list, field, fieldValue }).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/expressions/${id}`).then((r) => r.data),

  deleteSome: (list: number[]) =>
    apiClient.delete('/expressions/some', { data: { list } }).then((r) => r.data),
};
