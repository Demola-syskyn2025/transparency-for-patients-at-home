export type VisitSummary = {
  id: string;
  apptId: string;
  patientId: string;
  title: string;
  issuedAt: string;
};

export interface VisitSummaryService {
  has(apptId: string): Promise<boolean>;
  request(apptId: string, patientId: string, startAtISO?: string): Promise<VisitSummary>;
  listByPatient(patientId: string): Promise<VisitSummary[]>;
}

export class MockVisitSummaryService implements VisitSummaryService {
  private store: Map<string, VisitSummary[]> = new Map();
  private byAppt: Set<string> = new Set();

  constructor(initial: Record<string, VisitSummary[]>) {
    Object.keys(initial).forEach((pid) => {
      const arr = [...initial[pid]];
      this.store.set(pid, arr);
      arr.forEach((s) => this.byAppt.add(s.apptId));
    });
  }

  async has(apptId: string): Promise<boolean> {
    return this.byAppt.has(apptId);
  }

  async request(apptId: string, patientId: string, startAtISO?: string): Promise<VisitSummary> {
    if (this.byAppt.has(apptId)) {
      const arr = this.store.get(patientId) || [];
      const found = arr.find((s) => s.apptId === apptId);
      if (found) return found;
    }
    const issuedAt = new Date().toISOString();
    const titleDate = new Date(startAtISO || issuedAt).toLocaleDateString('en-GB');
    const summary: VisitSummary = {
      id: `vs-${Math.random().toString(36).slice(2, 8)}`,
      apptId,
      patientId,
      title: titleDate,
      issuedAt,
    };
    const arr = this.store.get(patientId) || [];
    arr.unshift(summary);
    this.store.set(patientId, arr);
    this.byAppt.add(apptId);
    return summary;
  }

  async listByPatient(patientId: string): Promise<VisitSummary[]> {
    return [...(this.store.get(patientId) || [])];
  }
}
