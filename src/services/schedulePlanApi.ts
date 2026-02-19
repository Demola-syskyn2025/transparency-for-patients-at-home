import api from '../config/api';
import type { SchedulePlanDto, PlanSummaryDto } from '../utils/apiTypes';

export async function generatePlan(weekStartDate: string): Promise<SchedulePlanDto> {
  const res = await api.post<SchedulePlanDto>('/schedule-plans/generate', { weekStartDate });
  return res.data;
}

export async function confirmPlan(planId: number): Promise<SchedulePlanDto> {
  const res = await api.post<SchedulePlanDto>(`/schedule-plans/${planId}/confirm`);
  return res.data;
}

export async function getPlan(planId: number): Promise<SchedulePlanDto> {
  const res = await api.get<SchedulePlanDto>(`/schedule-plans/${planId}`);
  return res.data;
}

export async function getPlanByWeek(weekStartDate: string): Promise<SchedulePlanDto | null> {
  try {
    const res = await api.get<SchedulePlanDto>(`/schedule-plans/week/${weekStartDate}`);
    if (res.data && res.data.id) return res.data;
    return null;
  } catch {
    return null;
  }
}

export async function getPlanSummary(planId: number): Promise<PlanSummaryDto> {
  const res = await api.get<PlanSummaryDto>(`/schedule-plans/${planId}/summary`);
  return res.data;
}
