// src/services/visitSummaryApi.ts
import api from '../config/api';
import type { VisitSummaryDto } from '../utils/apiTypes';

export class VisitSummaryApiService {
  private patientId: string;

  constructor(patientId: string) {
    this.patientId = patientId;
  }

  async list(): Promise<VisitSummaryDto[]> {
    const res = await api.get<VisitSummaryDto[]>(`/visit-summaries/patient/${this.patientId}`);
    return res.data;
  }

  async getById(id: string): Promise<VisitSummaryDto> {
    const res = await api.get<VisitSummaryDto>(`/visit-summaries/${id}`);
    return res.data;
  }
}
