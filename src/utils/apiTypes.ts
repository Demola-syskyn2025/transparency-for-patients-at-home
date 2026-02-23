// src/utils/apiTypes.ts

// ── Enums ──────────────────────────────────────────
export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULED';

export type AppointmentType = 'HOME_VISIT' | 'HOSPITAL_VISIT' | 'TELECONSULTATION' | 'OFFICE_WORK';

export type PlanStatus = 'DRAFT' | 'CONFIRMED';

export type UserRole = 'PATIENT' | 'DOCTOR' | 'NURSE' | 'FAMILY_MEMBER';

export type RecurringFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export type RescheduleStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// ── User ───────────────────────────────────────────
export interface UserDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: UserDto;
}

// ── Appointment ────────────────────────────────────
export interface AppointmentDto {
  id: number;
  patient: UserDto;
  staff: UserDto;
  scheduledAt: string;
  estimatedDurationMinutes: number;
  type: AppointmentType;
  status: AppointmentStatus;
  notes: string | null;
  location: string | null;
  createdAt: string;
  planId: number | null;
  isGenerated: boolean;
  isLocked: boolean;
}

export interface CreateAppointmentRequest {
  patientId: number;
  staffId: number;
  scheduledAt: string;
  estimatedDurationMinutes: number;
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

// ── Care Assignment ────────────────────────────────
export interface CareAssignmentDto {
  id: number;
  patient: UserDto;
  staff: UserDto;
  isPrimary: boolean;
  createdAt: string;
}

// ── Family Patient Link ───────────────────────────
export interface FamilyPatientLinkDto {
  id: number;
  familyMember: UserDto;
  patient: UserDto;
  relationship: string;
  createdAt: string;
}

// ── Visit Summary ──────────────────────────────────
export interface VisitSummaryDto {
  id: number;
  appointmentId: number;
  summary: string;
  recommendations: string | null;
  medications: string | null;
  nextVisitRecommendation: string | null;
  createdAt: string;
  createdByName: string;
}

// ── Reschedule Request ─────────────────────────────
export interface RescheduleRequestDto {
  id: number;
  appointmentId: number;
  patientName: string;
  reason: string;
  preferredDate1: string | null;
  preferredDate2: string | null;
  preferredDate3: string | null;
  status: RescheduleStatus;
  requestType: 'RESCHEDULE' | 'CANCEL';
  createdAt: string;
}

export interface CreateRescheduleRequest {
  appointmentId: number;
  reason?: string;
  requestType: 'RESCHEDULE' | 'CANCEL';
  preferredDate1?: string;
  preferredDate2?: string;
  preferredDate3?: string;
}

// ── Schedule Suggestion ────────────────────────────
export interface SuggestedAppointment {
  patientId: number;
  patientName: string;
  scheduledAt: string;
  estimatedDurationMinutes: number;
  type: AppointmentType;
  notes: string | null;
  location: string | null;
  reason: string | null;
}

export interface UnscheduledPatient {
  patientId: number;
  patientName: string;
  reason: string;
  lastVisitDate: string | null;
  recommendedFrequency: string | null;
}

export interface ScheduleSuggestionResponse {
  staffId: number;
  startDate: string;
  endDate: string;
  suggestions: SuggestedAppointment[];
  alreadyScheduled: AppointmentDto[];
  unscheduledPatients: UnscheduledPatient[];
}

export interface BatchCreateRequest {
  appointments: CreateAppointmentRequest[];
}

export interface BatchCreateResponse {
  totalCreated: number;
  totalErrors: number;
  created: AppointmentDto[];
  errors: string[];
}

// ── Schedule Plan ────────────────────────────────
export interface SchedulePlanDto {
  id: number;
  weekStartDate: string;
  status: PlanStatus;
  createdBy: UserDto | null;
  createdAt: string;
  confirmedAt: string | null;
  appointments: AppointmentDto[];
  violations: string[];
}

export interface PlanSummaryDto {
  planId: number;
  weekStartDate: string;
  status: PlanStatus;
  staffSummaries: StaffWeekSummaryDto[];
  totalVisits: number;
  totalOfficeBlocks: number;
  violations: string[];
}

export interface StaffWeekSummaryDto {
  staffId: number;
  staffName: string;
  role: string;
  dayOff: string | null;
  totalWorkMinutes: number;
  totalVisits: number;
  totalOfficeBlocks: number;
  dailyBreakdown: DayBreakdownDto[];
}

export interface DayBreakdownDto {
  date: string;
  dayOfWeek: string;
  isDayOff: boolean;
  workMinutes: number;
  visits: number;
  officeMinutes: number;
}
