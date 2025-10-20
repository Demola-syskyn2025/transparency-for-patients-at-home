// src/utils/checklist.ts
import { ChecklistItem } from '../utils/checklist';

export interface ChecklistService {
  listByPatient(patientId: string): Promise<ChecklistItem[]>;
  toggle(patientId: string, id: string, done: boolean): Promise<void>;
  update(patientId: string, id: string, patch: Partial<ChecklistItem>): Promise<void>;
}

export class MockChecklistService implements ChecklistService {
  private store = new Map<string, ChecklistItem[]>();

  constructor(initialData?: Record<string, ChecklistItem[]>) {
    if (initialData) {
      Object.entries(initialData).forEach(([pid, arr]) => {
        this.store.set(pid, arr.map(x => ({ ...x })));
      });
    }
  }

  async listByPatient(patientId: string) {
    const arr = this.store.get(patientId) || [];
    // sort theo dueAt tăng dần
    return [...arr].sort((a,b) => a.dueAt.localeCompare(b.dueAt));
  }

  async toggle(patientId: string, id: string, done: boolean) {
    const arr = this.store.get(patientId) || [];
    const i = arr.findIndex(x => x.id === id); if (i < 0) return;
    arr[i] = {
      ...arr[i],
      done,
      completedAt: done ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString()
    };
  }

  async update(patientId: string, id: string, patch: Partial<ChecklistItem>) {
    const arr = this.store.get(patientId) || [];
    const i = arr.findIndex(x => x.id === id); if (i < 0) return;
    arr[i] = { ...arr[i], ...patch, updatedAt: new Date().toISOString() };
  }
}