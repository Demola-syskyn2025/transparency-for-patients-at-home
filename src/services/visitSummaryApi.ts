// src/services/visitSummaryApi.ts
import api from '../config/api';
import type { VisitSummaryDto } from '../utils/apiTypes';
import type { VisitSummary, VisitSummaryService } from './visitSummaries';

// Convert backend VisitSummaryDto to frontend VisitSummary shape
function toFrontend(dto: VisitSummaryDto): VisitSummary {
  return {
    id: String(dto.id),
    apptId: String(dto.appointmentId),
    patientId: '0', // not directly in DTO, filled by context
    title: `${dto.staffName} – ${new Date(dto.createdAt).toLocaleDateString('en-GB')}`,
    issuedAt: dto.createdAt,
  };
}

export class VisitSummaryApiService implements VisitSummaryService {
  private patientId: string;

  constructor(patientId: string) {
    this.patientId = patientId;
  }

  async has(apptId: string): Promise<boolean> {
    try {
      const res = await api.get<VisitSummaryDto>(`/visit-summaries/appointment/${apptId}`);
      return !!res.data;
    } catch {
      return false;
    }
  }

  async request(apptId: string, patientId: string, startAtISO?: string): Promise<VisitSummary> {
    // Check if summary already exists
    try {
      const res = await api.get<VisitSummaryDto>(`/visit-summaries/appointment/${apptId}`);
      return { ...toFrontend(res.data), patientId };
    } catch {
      // No existing summary — this would need staff to create it
      // For now, return a placeholder
      return {
        id: `pending-${apptId}`,
        apptId,
        patientId,
        title: startAtISO
          ? new Date(startAtISO).toLocaleDateString('en-GB')
          : 'Pending',
        issuedAt: new Date().toISOString(),
      };
    }
  }

  async listByPatient(patientId: string): Promise<VisitSummary[]> {
    const res = await api.get<VisitSummaryDto[]>(`/visit-summaries/patient/${patientId}`);
    return res.data.map(dto => ({ ...toFrontend(dto), patientId }));
  }
}
