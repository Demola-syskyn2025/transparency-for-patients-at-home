// src/services/appointmentApi.ts
import api from '../config/api';
import type { AppointmentDto, CreateAppointmentRequest, UpdateAppointmentRequest } from '../utils/apiTypes';
import type { Appointment, ChatMessage } from '../utils/types';
import type { AppointmentService } from './appointments';

// Convert backend AppointmentDto to frontend Appointment shape
function toFrontend(dto: AppointmentDto): Appointment {
  const endAt = new Date(dto.scheduledAt);
  endAt.setMinutes(endAt.getMinutes() + dto.estimatedDurationMinutes);

  return {
    id: String(dto.id),
    patientId: String(dto.patient.id),
    title: formatType(dto.type),
    startAt: dto.scheduledAt,
    endAt: endAt.toISOString(),
    location: dto.location ?? undefined,
    status: dto.status.toLowerCase() as Appointment['status'],
    notes: dto.notes ?? undefined,
    assignedStaff: [
      {
        id: String(dto.staff.id),
        name: `${dto.staff.firstName} ${dto.staff.lastName}`,
        role: dto.staff.role.toLowerCase() as 'doctor' | 'nurse',
        phone: dto.staff.phoneNumber || undefined,
      },
    ],
    createdBy: String(dto.staff.id),
    createdAt: dto.createdAt,
  };
}

function formatType(type: string): string {
  switch (type) {
    case 'HOME_VISIT': return 'Home Visit';
    case 'HOSPITAL_VISIT': return 'Hospital Visit';
    case 'TELECONSULTATION': return 'Teleconsultation';
    default: return type;
  }
}

export class AppointmentApiService implements AppointmentService {
  // Chat messages are still local — backend doesn't have chat per appointment yet
  private threads = new Map<string, ChatMessage[]>();
  private listeners = new Map<string, Set<(msgs: ChatMessage[]) => void>>();

  async listByPatient(patientId: string): Promise<Appointment[]> {
    const res = await api.get<AppointmentDto[]>(`/appointments/patient/${patientId}`);
    return res.data.map(toFrontend);
  }

  async create(patientId: string, data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
    const request: CreateAppointmentRequest = {
      patientId: Number(patientId),
      staffId: Number(data.assignedStaff?.[0]?.id ?? 0),
      scheduledAt: data.startAt,
      estimatedDurationMinutes: 30,
      type: 'HOME_VISIT',
      notes: data.notes,
      location: data.location,
    };
    const res = await api.post<AppointmentDto>('/appointments', request);
    return toFrontend(res.data);
  }

  async update(patientId: string, id: string, patch: Partial<Appointment>): Promise<void> {
    const request: UpdateAppointmentRequest = {};
    if (patch.startAt) request.scheduledAt = patch.startAt;
    if (patch.notes) request.notes = patch.notes;
    if (patch.location) request.location = patch.location;
    await api.patch(`/appointments/${id}`, request);
  }

  async remove(patientId: string, id: string): Promise<void> {
    await api.delete(`/appointments/${id}`);
  }

  async getById(patientId: string, id: string): Promise<Appointment | undefined> {
    try {
      const res = await api.get<AppointmentDto>(`/appointments/${id}`);
      return toFrontend(res.data);
    } catch {
      return undefined;
    }
  }

  // ---------- Messages (local, same as mock) ----------
  private emit(apptId: string) {
    const msgs = [...(this.threads.get(apptId) || [])].sort((a, b) => a.at.localeCompare(b.at));
    const set = this.listeners.get(apptId);
    if (set) set.forEach(fn => fn(msgs));
  }

  async listMessages(apptId: string): Promise<ChatMessage[]> {
    return [...(this.threads.get(apptId) || [])].sort((a, b) => a.at.localeCompare(b.at));
  }

  async sendMessage(apptId: string, msg: Omit<ChatMessage, 'id' | 'at'>): Promise<ChatMessage> {
    const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
    const full: ChatMessage = {
      id: genId(),
      at: new Date().toISOString(),
      ...msg,
      apptId,
    };
    const arr = this.threads.get(apptId) || [];
    arr.push(full);
    this.threads.set(apptId, arr);
    this.emit(apptId);
    return full;
  }

  subscribeMessages(apptId: string, cb: (msgs: ChatMessage[]) => void): () => void {
    const set = this.listeners.get(apptId) || new Set();
    set.add(cb);
    this.listeners.set(apptId, set);
    this.emit(apptId);
    return () => {
      const s = this.listeners.get(apptId);
      if (!s) return;
      s.delete(cb);
      if (s.size === 0) this.listeners.delete(apptId);
    };
  }
}
