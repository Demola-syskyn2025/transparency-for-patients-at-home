// src/services/appointments.ts
import { Appointment, ChatMessage } from '../utils/types';

const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export interface AppointmentService {
  // appointments
  listByPatient(patientId: string): Promise<Appointment[]>;
  create(patientId: string, data: Omit<Appointment,'id'|'createdAt'|'updatedAt'>): Promise<Appointment>;
  update(patientId: string, id: string, patch: Partial<Appointment>): Promise<void>;
  remove(patientId: string, id: string): Promise<void>;
  getById?(patientId: string, id: string): Promise<Appointment | undefined>;

  // NEW: chat/messages per appointment
  listMessages(apptId: string): Promise<ChatMessage[]>;
  sendMessage(apptId: string, msg: Omit<ChatMessage,'id'|'at'>): Promise<ChatMessage>;
  subscribeMessages(apptId: string, cb: (msgs: ChatMessage[]) => void): () => void; // unsubscribe
}

export class MockAppointmentService implements AppointmentService {
  private store = new Map<string, Appointment[]>();         // key: patientId
  private threads = new Map<string, ChatMessage[]>();        // key: apptId
  private listeners = new Map<string, Set<(msgs: ChatMessage[]) => void>>(); // apptId -> subs

  // Seed dữ liệu ban đầu (tuỳ chọn)
  constructor(initialData?: Record<string, Appointment[]>, initialThreads?: Record<string, ChatMessage[]>) {
    if (initialData) {
      Object.entries(initialData).forEach(([pid, arr]) => {
        this.store.set(pid, arr.map(x => ({ ...x })));
      });
    }
    if (initialThreads) {
      Object.entries(initialThreads).forEach(([aid, arr]) => {
        this.threads.set(aid, arr.map(x => ({ ...x })));
      });
    }
  }

  // ---------- Appointments ----------
  async listByPatient(patientId: string) {
    const arr = this.store.get(patientId) || [];
    return [...arr].sort((a,b)=>a.startAt.localeCompare(b.startAt));
  }

  async create(patientId: string, data: any) {
    const now = new Date().toISOString();
    const a: Appointment = { id: genId(), patientId, createdAt: now, ...data };
    const arr = this.store.get(patientId) || [];
    arr.push(a); this.store.set(patientId, arr);
    return a;
  }

  async update(patientId: string, id: string, patch: Partial<Appointment>) {
    const arr = this.store.get(patientId) || [];
    const i = arr.findIndex(x=>x.id===id); if (i<0) return;
    arr[i] = { ...arr[i], ...patch, updatedAt: new Date().toISOString() };
  }

  async remove(patientId: string, id: string) {
    const arr = this.store.get(patientId) || [];
    this.store.set(patientId, arr.filter(x=>x.id!==id));
  }

  async getById(patientId: string, id: string) {
    const arr = this.store.get(patientId) || [];
    return arr.find(x => x.id === id);
  }

  // ---------- Messages (mock realtime) ----------
  private emit(apptId: string) {
    const msgs = [...(this.threads.get(apptId) || [])].sort((a,b)=>a.at.localeCompare(b.at));
    const set = this.listeners.get(apptId);
    if (set) set.forEach(fn => fn(msgs));
  }

  async listMessages(apptId: string) {
    return [...(this.threads.get(apptId) || [])].sort((a,b)=>a.at.localeCompare(b.at));
  }

  async sendMessage(apptId: string, msg: Omit<ChatMessage,'id'|'at'>) {
    const full: ChatMessage = {
      id: genId(),
      apptId,
      at: new Date().toISOString(),
      ...msg,
    };
    const arr = this.threads.get(apptId) || [];
    arr.push(full);
    this.threads.set(apptId, arr);
    this.emit(apptId);
    return full;
  }

  subscribeMessages(apptId: string, cb: (msgs: ChatMessage[]) => void) {
    const set = this.listeners.get(apptId) || new Set();
    set.add(cb);
    this.listeners.set(apptId, set);

    // push snapshot lần đầu
    this.emit(apptId);

    return () => {
      const s = this.listeners.get(apptId);
      if (!s) return;
      s.delete(cb);
      if (s.size === 0) this.listeners.delete(apptId);
    };
  }
}
