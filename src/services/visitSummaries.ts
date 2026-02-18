// src/services/visitSummaries.ts

export interface VisitSummary {
  id: string;
  apptId: string;
  patientId: string;
  title: string;
  issuedAt: string;
}

export interface VisitSummaryService {
  hasForAppointment(apptId: string): Promise<boolean>;
  requestSummary(apptId: string): Promise<void>;
  listByPatient(patientId: string): Promise<VisitSummary[]>;
}
