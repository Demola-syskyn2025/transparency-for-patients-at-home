// src/services/checklistApi.ts
import api from '../config/api';

export interface CareTaskDto {
  id: number;
  patientId: number;
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  status: string;
  frequency: string;
  completedAt: string | null;
}

export class ChecklistApiService {
  async listByPatient(patientId: string): Promise<CareTaskDto[]> {
    const res = await api.get<CareTaskDto[]>(`/care-tasks/patient/${patientId}`);
    return res.data;
  }

  async complete(taskId: string): Promise<CareTaskDto> {
    const res = await api.patch<CareTaskDto>(`/care-tasks/${taskId}`, { status: 'COMPLETED' });
    return res.data;
  }
}
