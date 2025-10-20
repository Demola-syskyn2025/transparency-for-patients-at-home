// src/utils/types.ts
export type ISODate = string;

export type StaffRole = 'nurse' | 'doctor' | 'paramedic' | 'other';

export interface StaffRef {
  id: string;
  name: string;
  role: StaffRole;
  phone?: string;
}

export interface ChatMessage {
  id: string;
  apptId: string;
  author: 'family' | 'staff' | 'system';
  text: string;
  at: ISODate;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'delayed'
  | 'rescheduled'
  | 'completed'
  | 'cancelled';

export interface Appointment {
  id: string;
  patientId: string;
  title: string;
  startAt: ISODate;
  endAt?: ISODate;
  location?: string;
  notes?: string;
  createdBy: string;     // uid
  createdAt: ISODate;
  updatedAt?: ISODate;

  // NEW
  status?: AppointmentStatus;          // default: 'scheduled'
  reasonForChange?: string | null;     // vì sao delayed/rescheduled/cancelled

  // NEW: nhân sự phụ trách
  assignedStaff?: StaffRef[];
}

