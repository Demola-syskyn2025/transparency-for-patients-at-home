// src/services/careAssignmentApi.ts
import api from '../config/api';
import type { CareAssignmentDto } from '../utils/apiTypes';

export const careAssignmentApi = {
  /** Get all care assignments for a patient */
  async getByPatient(patientId: string): Promise<CareAssignmentDto[]> {
    const res = await api.get(`/care-assignments/patient/${patientId}`);
    return res.data;
  },

  /** Get all care assignments for a staff member */
  async getByStaff(staffId: string): Promise<CareAssignmentDto[]> {
    const res = await api.get(`/care-assignments/staff/${staffId}`);
    return res.data;
  },

  /** Create a new care assignment */
  async create(patientId: number, staffId: number, isPrimary = true): Promise<CareAssignmentDto> {
    const res = await api.post('/care-assignments', { patientId, staffId, isPrimary });
    return res.data;
  },

  /** Remove a care assignment */
  async remove(id: number): Promise<void> {
    await api.delete(`/care-assignments/${id}`);
  },
};
