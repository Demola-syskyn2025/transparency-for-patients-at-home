// src/services/rescheduleApi.ts
import api from '../config/api';
import type { RescheduleRequestDto } from '../utils/apiTypes';

export const rescheduleApi = {
  async getPending(): Promise<RescheduleRequestDto[]> {
    try {
      const res = await api.get<RescheduleRequestDto[]>('/reschedule-requests/pending');
      return res.data;
    } catch {
      return [];
    }
  },

  async approve(id: string): Promise<void> {
    await api.patch(`/reschedule-requests/${id}/approve`);
  },

  async reject(id: string): Promise<void> {
    await api.patch(`/reschedule-requests/${id}/reject`);
  },
};
