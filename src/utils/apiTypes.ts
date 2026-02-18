// src/utils/apiTypes.ts
// TypeScript types aligned with backend DTOs

// ========== Enums ==========

export type UserRole = 'PATIENT' | 'FAMILY_MEMBER' | 'DOCTOR' | 'NURSE';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULED';

export type AppointmentType = 'HOME_VISIT' | 'HOSPITAL_VISIT' | 'TELECONSULTATION';

export type TaskStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED';

export type TaskFrequency = 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type RescheduleStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALTERNATIVE_OFFERED';

// ========== User ==========

export interface UserDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: UserRole;
}

// ========== Auth ==========

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: UserDto;
}

// ========== Appointment ==========

export interface AppointmentDto {
  id: number;
  patient: UserDto;
  staff: UserDto;
  scheduledAt: string; // ISO datetime from backend LocalDateTime
  estimatedDurationMinutes: number;
  type: AppointmentType;
  status: AppointmentStatus;
  notes: string | null;
  location: string | null;
  createdAt: string;
}

export interface CreateAppointmentRequest {
  patientId: number;
  staffId: number;
  scheduledAt: string;
  estimatedDurationMinutes?: number;
  type: AppointmentType;
  notes?: string;
  location?: string;
}

export interface UpdateAppointmentRequest {
  scheduledAt?: string;
  status?: AppointmentStatus;
  notes?: string;
  location?: string;
}

// ========== Care Task (Checklist) ==========

export interface CareTaskDto {
  id: number;
  patientId: number;
  title: string;
  description: string | null;
  dueDate: string; // ISO date (YYYY-MM-DD)
  dueTime: string | null;
  status: TaskStatus;
  frequency: TaskFrequency;
  createdAt: string;
  completedAt: string | null;
}

export interface CreateCareTaskRequest {
  patientId: number;
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  frequency?: TaskFrequency;
}

export interface UpdateCareTaskRequest {
  title?: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  status?: TaskStatus;
}

// ========== Visit Summary ==========

export interface VisitSummaryDto {
  id: number;
  appointmentId: number;
  patientName: string;
  staffName: string;
  summary: string;
  recommendations: string | null;
  medications: string | null;
  nextVisitRecommendation: string | null;
  createdBy: UserDto;
  createdAt: string;
}

export interface CreateVisitSummaryRequest {
  appointmentId: number;
  summary: string;
  recommendations?: string;
  medications?: string;
  nextVisitRecommendation?: string;
}

// ========== Reschedule ==========

export interface RescheduleRequestDto {
  id: number;
  appointmentId: number;
  patientName: string;
  requestedBy: UserDto;
  reason: string | null;
  preferredDate1: string | null;
  preferredDate2: string | null;
  preferredDate3: string | null;
  status: RescheduleStatus;
  staffResponse: string | null;
  newScheduledAt: string | null;
  requestedAt: string;
  reviewedAt: string | null;
}

export interface CreateRescheduleRequest {
  appointmentId: number;
  reason?: string;
  preferredDate1?: string;
  preferredDate2?: string;
  preferredDate3?: string;
}

export interface ReviewRescheduleRequest {
  status: RescheduleStatus;
  staffResponse?: string;
  newScheduledAt?: string;
}
