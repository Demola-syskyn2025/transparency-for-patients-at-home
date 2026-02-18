// src/services/checklistApi.ts
import api from '../config/api';
import type { CareTaskDto } from '../utils/apiTypes';
import type { ChecklistItem } from '../utils/checklist';
import type { ChecklistService } from './checklist';

// Convert backend CareTaskDto to frontend ChecklistItem
function toFrontend(dto: CareTaskDto): ChecklistItem {
  // Combine dueDate + dueTime into a single ISO string
  const dueAt = dto.dueTime
    ? `${dto.dueDate}T${dto.dueTime}`
    : `${dto.dueDate}T00:00:00`;

  return {
    id: String(dto.id),
    patientId: String(dto.patientId),
    text: dto.title,
    done: dto.status === 'COMPLETED',
    createdBy: 'system',
    createdAt: dto.createdAt,
    dueAt,
    completedAt: dto.completedAt ?? undefined,
  };
}

export class ChecklistApiService implements ChecklistService {
  async listByPatient(patientId: string): Promise<ChecklistItem[]> {
    const res = await api.get<CareTaskDto[]>(`/tasks/patient/${patientId}`);
    return res.data.map(toFrontend).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  }

  async toggle(patientId: string, id: string, done: boolean): Promise<void> {
    if (done) {
      await api.post(`/tasks/${id}/complete`);
    } else {
      await api.patch(`/tasks/${id}`, { status: 'PENDING' });
    }
  }

  async update(patientId: string, id: string, patch: Partial<ChecklistItem>): Promise<void> {
    const request: Record<string, unknown> = {};
    if (patch.text) request.title = patch.text;
    await api.patch(`/tasks/${id}`, request);
  }
}
