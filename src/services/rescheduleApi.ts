// src/services/rescheduleApi.ts
import api from '../config/api';
import type { CreateRescheduleRequest, RescheduleRequestDto } from '../utils/apiTypes';

export const rescheduleApi = {
  async getPending(): Promise<RescheduleRequestDto[]> {
    try {
      const res = await api.get<RescheduleRequestDto[]>('/reschedule/pending');
      return res.data;
    } catch {
      return [];
    }
  },

  async getMyRequests(): Promise<RescheduleRequestDto[]> {
    try {
      const res = await api.get<RescheduleRequestDto[]>('/reschedule/my-requests');
      return res.data;
    } catch {
      return [];
    }
  },

  async create(request: CreateRescheduleRequest): Promise<RescheduleRequestDto> {
    const res = await api.post<RescheduleRequestDto>('/reschedule', request);
    return res.data;
  },

  async approve(id: string): Promise<void> {
    await api.patch(`/reschedule/${id}/review`, { status: 'APPROVED' });
  },

  async reject(id: string): Promise<void> {
    await api.patch(`/reschedule/${id}/review`, { status: 'REJECTED' });
  },
};
