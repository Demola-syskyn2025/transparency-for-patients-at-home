// src/services/appointmentApi.ts
import api from '../config/api';
import type { AppointmentDto, CreateAppointmentRequest } from '../utils/apiTypes';

export class AppointmentApiService {
  async listByPatient(patientId: string): Promise<AppointmentDto[]> {
    const res = await api.get<AppointmentDto[]>(`/appointments/patient/${patientId}`);
    return res.data;
  }

  async listByStaff(staffId: string): Promise<AppointmentDto[]> {
    const res = await api.get<AppointmentDto[]>(`/appointments/staff/${staffId}`);
    return res.data;
  }

  async getById(id: string): Promise<AppointmentDto> {
    const res = await api.get<AppointmentDto>(`/appointments/${id}`);
    return res.data;
  }

  async create(request: CreateAppointmentRequest): Promise<AppointmentDto> {
    const res = await api.post<AppointmentDto>('/appointments', request);
    return res.data;
  }

  async cancel(id: string): Promise<AppointmentDto> {
    const res = await api.delete<AppointmentDto>(`/appointments/${id}`);
    return res.data;
  }
}
