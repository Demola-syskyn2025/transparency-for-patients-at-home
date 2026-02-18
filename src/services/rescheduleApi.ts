// src/services/rescheduleApi.ts
import api from '../config/api';
import type {
  CreateRescheduleRequest,
  RescheduleRequestDto,
  ReviewRescheduleRequest,
} from '../utils/apiTypes';

export const rescheduleApi = {
  async getByAppointment(appointmentId: number): Promise<RescheduleRequestDto[]> {
    const res = await api.get<RescheduleRequestDto[]>(`/reschedule/appointment/${appointmentId}`);
    return res.data;
  },

  async getMyRequests(): Promise<RescheduleRequestDto[]> {
    const res = await api.get<RescheduleRequestDto[]>('/reschedule/my-requests');
    return res.data;
  },

  async getPending(): Promise<RescheduleRequestDto[]> {
    const res = await api.get<RescheduleRequestDto[]>('/reschedule/pending');
    return res.data;
  },

  async create(request: CreateRescheduleRequest): Promise<RescheduleRequestDto> {
    const res = await api.post<RescheduleRequestDto>('/reschedule', request);
    return res.data;
  },

  async review(id: number, request: ReviewRescheduleRequest): Promise<RescheduleRequestDto> {
    const res = await api.put<RescheduleRequestDto>(`/reschedule/${id}/review`, request);
    return res.data;
  },
};
