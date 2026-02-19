// src/screens/PlanScheduleScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import type { SchedulePlanDto, AppointmentDto } from '../utils/apiTypes';
import { generatePlan, confirmPlan, getPlanByWeek } from '../services/schedulePlanApi';

// ── Helpers ──────────────────────────────────────────
function getMonday(d: Date): Date {
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  let diff;
  if (day === 0) {
    // If Sunday, go to next Monday (add 1 day)
    diff = d.getDate() + 1;
  } else {
    // Otherwise, go back to Monday of this week
    diff = d.getDate() - day + 1;
  }
  const mon = new Date(d);
  mon.setDate(diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmtDate(d: Date): string {
  // Use local date components to avoid timezone issues
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function fmtHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  HOME_VISIT:       { bg: 'rgba(127,179,213,0.15)', border: '#7FB3D5', text: '#7FB3D5' },
  TELECONSULTATION: { bg: 'rgba(168,85,247,0.15)',  border: '#A855F7', text: '#A855F7' },
  HOSPITAL_VISIT:   { bg: 'rgba(245,158,11,0.15)',  border: '#F59E0B', text: '#F59E0B' },
  OFFICE_WORK:      { bg: 'rgba(100,116,139,0.12)', border: '#64748B', text: '#94A3B8' },
};

const TYPE_LABELS: Record<string, string> = {
  HOME_VISIT: 'Home Visit',
  TELECONSULTATION: 'Teleconsult',
  HOSPITAL_VISIT: 'Hospital',
  OFFICE_WORK: 'Office Work',
};

const ROLE_COLORS: Record<string, string> = {
  DOCTOR: '#3B82F6',
  NURSE: '#22C55E',
};

// ── Main Component ───────────────────────────────────
export default function PlanScheduleScreen({ staffId }: { staffId: string }) {
  const [weekOffset, setWeekOffset] = useState(1);
  const [plan, setPlan] = useState<SchedulePlanDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);

  // Always ensure we're looking at a future week (at least next Monday)
  const today = new Date();
  const currentMonday = getMonday(today);
  // Calculate target Monday: add weekOffset weeks to current Monday, then ensure it's future
  const targetMonday = addDays(currentMonday, weekOffset * 7);
  const monday = targetMonday <= currentMonday ? addDays(currentMonday, 7) : targetMonday;
  const friday = addDays(monday, 4);
  const weekDates = [0, 1, 2, 3, 4].map(i => addDays(monday, i));
  const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  // Fetch existing plan for the selected week
  const fetchPlan = useCallback(async () => {
    setLoading(true);
    try {
      const existing = await getPlanByWeek(fmtDate(monday));
      setPlan(existing);
      setSelectedStaff(null);
    } catch {
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  // Generate new plan
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const weekStart = fmtDate(monday);
      console.log('Generating plan for date:', weekStart, 'day:', monday.getDay());
      const newPlan = await generatePlan(weekStart);
      setPlan(newPlan);
      setSelectedStaff(null);
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Failed to generate plan';
      console.error('Generate plan error:', e?.response?.data);
      Alert.alert('Error', msg);
    } finally {
      setGenerating(false);
    }
  };

  // Confirm plan
  const handleConfirm = async () => {
    if (!plan) return;
    setConfirming(true);
    try {
      const confirmed = await confirmPlan(plan.id);
      setPlan(confirmed);
      Alert.alert('Plan Confirmed', 'All appointments are now locked.');
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Failed to confirm plan';
      Alert.alert('Error', msg);
    } finally {
      setConfirming(false);
    }
  };

  // ── Derive staff list from plan appointments ──────
  const staffMap = new Map<number, { name: string; role: string }>();
  plan?.appointments.forEach(a => {
    if (!staffMap.has(a.staff.id)) {
      staffMap.set(a.staff.id, {
        name: `${a.staff.firstName} ${a.staff.lastName}`,
        role: a.staff.role,
      });
    }
  });
  const staffList = [...staffMap.entries()].map(([id, info]) => ({ id, ...info }));

  // ── Filter appointments for selected staff ────────
  const filteredAppts = plan?.appointments.filter(
    a => selectedStaff === null || a.staff.id === selectedStaff
  ) ?? [];

  // ── Group by staff → date → sorted appointments ───
  const staffDayAppts = new Map<number, Map<string, AppointmentDto[]>>();
  filteredAppts.forEach(a => {
    const sid = a.staff.id;
    if (!staffDayAppts.has(sid)) staffDayAppts.set(sid, new Map());
    const dateStr = a.scheduledAt.slice(0, 10);
    const dayMap = staffDayAppts.get(sid)!;
    if (!dayMap.has(dateStr)) dayMap.set(dateStr, []);
    dayMap.get(dateStr)!.push(a);
  });
  // Sort each day's appointments by time
  staffDayAppts.forEach(dayMap => {
    dayMap.forEach((appts, date) => {
      appts.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    });
  });

  // ── Compute summary stats per staff ───────────────
  const staffStats = staffList.map(staff => {
    const allAppts = plan?.appointments.filter(a => a.staff.id === staff.id) ?? [];
    const visits = allAppts.filter(a => a.type !== 'OFFICE_WORK');
    const office = allAppts.filter(a => a.type === 'OFFICE_WORK');
    const totalMin = allAppts.reduce((sum, a) => sum + a.estimatedDurationMinutes, 0);

    // Find day off (weekday with no appointments)
    const workingDates = new Set(allAppts.map(a => a.scheduledAt.slice(0, 10)));
    const dayOff = weekDates.find(d => !workingDates.has(fmtDate(d)));

    return {
      ...staff,
      visits: visits.length,
      officeBlocks: office.length,
      totalMinutes: totalMin,
      dayOff: dayOff ? DAY_NAMES[dayOff.getDay() - 1] : null,
    };
  });

  // ── Total summary ─────────────────────────────────
  const totalVisits = plan?.appointments.filter(a => a.type !== 'OFFICE_WORK').length ?? 0;
  const totalOffice = plan?.appointments.filter(a => a.type === 'OFFICE_WORK').length ?? 0;

  // ── Render ─────────────────────────────────────────
  return (
    <View style={s.container}>
      {/* Week selector */}
      <View style={s.periodRow}>
        <Pressable style={s.arrowBtn} onPress={() => setWeekOffset(w => w - 1)}>
          <Text style={s.arrowText}>◀</Text>
        </Pressable>
        <View style={s.periodCenter}>
          <Text style={s.periodLabel}>
            {fmtDate(monday)} — {fmtDate(friday)}
          </Text>
          <Text style={s.periodSub}>
            {weekOffset === 0 ? 'This week' : weekOffset === 1 ? 'Next week' : `${weekOffset} weeks ahead`}
          </Text>
        </View>
        <Pressable style={s.arrowBtn} onPress={() => setWeekOffset(w => w + 1)}>
          <Text style={s.arrowText}>▶</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#7FB3D5" />
          <Text style={s.loadingText}>Loading plan…</Text>
        </View>
      ) : !plan ? (
        <View style={s.center}>
          <Text style={s.emptyText}>No plan for this week</Text>
          <Pressable style={s.generateBtn} onPress={handleGenerate} disabled={generating}>
            {generating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={s.generateBtnText}>Generate Weekly Plan</Text>
            )}
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>
          {/* Plan status badge */}
          <View style={s.planStatusRow}>
            <View style={[s.statusBadge, plan.status === 'CONFIRMED' ? s.statusConfirmed : s.statusDraft]}>
              <Text style={s.statusBadgeText}>{plan.status}</Text>
            </View>
            <Text style={s.planIdText}>Plan #{plan.id}</Text>
            {plan.status === 'DRAFT' && (
              <View style={{ flexDirection: 'row', gap: 8, marginLeft: 'auto' }}>
                <Pressable style={s.regenBtn} onPress={handleGenerate} disabled={generating}>
                  <Text style={s.regenBtnText}>{generating ? '...' : 'Regenerate'}</Text>
                </Pressable>
                <Pressable style={s.confirmBtn} onPress={handleConfirm} disabled={confirming}>
                  <Text style={s.confirmBtnText}>{confirming ? '...' : 'Confirm Plan'}</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Global summary */}
          <View style={s.summaryRow}>
            <View style={s.summaryItem}>
              <Text style={s.summaryNum}>{totalVisits}</Text>
              <Text style={s.summaryLabel}>Patient{'\n'}Visits</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={[s.summaryNum, { color: '#64748B' }]}>{totalOffice}</Text>
              <Text style={s.summaryLabel}>Office{'\n'}Blocks</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={[s.summaryNum, { color: '#22C55E' }]}>{staffList.length}</Text>
              <Text style={s.summaryLabel}>Staff{'\n'}Members</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={[s.summaryNum, { color: plan.violations.length > 0 ? '#F59E0B' : '#22C55E' }]}>
                {plan.violations.length}
              </Text>
              <Text style={s.summaryLabel}>Violations</Text>
            </View>
          </View>

          {/* Staff filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
            <Pressable
              style={[s.chip, selectedStaff === null && s.chipActive]}
              onPress={() => setSelectedStaff(null)}
            >
              <Text style={[s.chipText, selectedStaff === null && s.chipTextActive]}>All Staff</Text>
            </Pressable>
            {staffStats.map(st => (
              <Pressable
                key={st.id}
                style={[s.chip, selectedStaff === st.id && s.chipActive]}
                onPress={() => setSelectedStaff(st.id)}
              >
                <View style={[s.chipDot, { backgroundColor: ROLE_COLORS[st.role] || '#7FB3D5' }]} />
                <Text style={[s.chipText, selectedStaff === st.id && s.chipTextActive]}>
                  {st.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Staff summary cards */}
          {(selectedStaff === null ? staffStats : staffStats.filter(s => s.id === selectedStaff)).map(st => (
            <View key={st.id} style={s.staffCard}>
              <View style={s.staffCardHeader}>
                <View style={[s.roleBadge, { backgroundColor: ROLE_COLORS[st.role] || '#7FB3D5' }]}>
                  <Text style={s.roleBadgeText}>{st.role}</Text>
                </View>
                <Text style={s.staffCardName}>{st.name}</Text>
                {st.dayOff && (
                  <View style={s.dayOffBadge}>
                    <Text style={s.dayOffText}>OFF: {st.dayOff}</Text>
                  </View>
                )}
              </View>
              <View style={s.staffStatsRow}>
                <Text style={s.staffStat}>{st.visits} visits</Text>
                <Text style={s.staffStatDivider}>|</Text>
                <Text style={s.staffStat}>{st.officeBlocks} office</Text>
                <Text style={s.staffStatDivider}>|</Text>
                <Text style={s.staffStat}>{fmtHours(st.totalMinutes)}</Text>
              </View>
            </View>
          ))}

          {/* Daily schedule per staff */}
          {[...staffDayAppts.entries()].map(([sid, dayMap]) => {
            const info = staffMap.get(sid);
            if (!info) return null;
            return (
              <View key={sid} style={s.staffSection}>
                <Text style={s.staffSectionTitle}>{info.name}</Text>
                {weekDates.map((date, di) => {
                  const dateStr = fmtDate(date);
                  const dayAppts = dayMap.get(dateStr);
                  const isDayOff = !dayAppts || dayAppts.length === 0;

                  return (
                    <View key={dateStr} style={s.dayRow}>
                      <View style={[s.dayLabel, isDayOff && s.dayLabelOff]}>
                        <Text style={[s.dayLabelText, isDayOff && s.dayLabelTextOff]}>
                          {DAY_NAMES[di]}
                        </Text>
                        <Text style={[s.dayDateText, isDayOff && s.dayLabelTextOff]}>
                          {dateStr.slice(5)}
                        </Text>
                        {isDayOff && <Text style={s.dayOffLabel}>DAY OFF</Text>}
                      </View>
                      <View style={s.dayAppts}>
                        {isDayOff ? (
                          <View style={s.dayOffCard}>
                            <Text style={s.dayOffCardText}>No appointments scheduled</Text>
                          </View>
                        ) : (
                          dayAppts!.map(a => {
                            const colors = TYPE_COLORS[a.type] || TYPE_COLORS.HOME_VISIT;
                            const endTime = new Date(new Date(a.scheduledAt).getTime() + a.estimatedDurationMinutes * 60000);
                            return (
                              <View
                                key={a.id}
                                style={[s.apptCard, { backgroundColor: colors.bg, borderLeftColor: colors.border }]}
                              >
                                <View style={s.apptCardTop}>
                                  <Text style={[s.apptTime, { color: colors.text }]}>
                                    {fmtTime(a.scheduledAt)} — {fmtTime(endTime.toISOString())}
                                  </Text>
                                  <Text style={[s.apptDuration, { color: colors.text }]}>
                                    {a.estimatedDurationMinutes}m
                                  </Text>
                                </View>
                                <Text style={s.apptType}>{TYPE_LABELS[a.type] || a.type}</Text>
                                {a.type !== 'OFFICE_WORK' && (
                                  <Text style={s.apptPatient}>
                                    {a.patient.firstName} {a.patient.lastName}
                                  </Text>
                                )}
                                {a.location && a.type !== 'OFFICE_WORK' && (
                                  <Text style={s.apptLocation}>{a.location}</Text>
                                )}
                                {a.notes && a.type !== 'OFFICE_WORK' && (
                                  <Text style={s.apptNotes}>{a.notes}</Text>
                                )}
                              </View>
                            );
                          })
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })}

          {/* Violations */}
          {plan.violations.length > 0 && (
            <View style={s.violationSection}>
              <Text style={s.violationTitle}>Scheduling Notes ({plan.violations.length})</Text>
              {plan.violations.map((v, i) => (
                <View key={i} style={s.violationCard}>
                  <Text style={s.violationText}>{v}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151A23' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  scroll: { padding: 16, paddingBottom: 40 },

  // Period selector
  periodRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
  arrowBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  arrowText: { color: '#7FB3D5', fontSize: 16 },
  periodCenter: { flex: 1, alignItems: 'center' },
  periodLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },
  periodSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },

  // Plan status
  planStatusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusDraft: { backgroundColor: 'rgba(245,158,11,0.2)' },
  statusConfirmed: { backgroundColor: 'rgba(34,197,94,0.2)' },
  statusBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  planIdText: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },

  // Generate / confirm buttons
  generateBtn: { backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28, marginTop: 20 },
  generateBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  regenBtn: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  regenBtnText: { color: '#7FB3D5', fontSize: 12, fontWeight: '600' },
  confirmBtn: { backgroundColor: '#22C55E', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  confirmBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Summary
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16 },
  summaryItem: { alignItems: 'center' },
  summaryNum: { color: '#7FB3D5', fontSize: 24, fontWeight: '800' },
  summaryLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, textAlign: 'center', marginTop: 4 },

  // Chip filter
  chipScroll: { marginBottom: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, gap: 6 },
  chipActive: { backgroundColor: 'rgba(127,179,213,0.2)', borderWidth: 1, borderColor: '#7FB3D5' },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  // Staff summary card
  staffCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, marginBottom: 8 },
  staffCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  staffCardName: { color: '#fff', fontSize: 14, fontWeight: '700', flex: 1 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  roleBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  dayOffBadge: { backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  dayOffText: { color: '#EF4444', fontSize: 10, fontWeight: '700' },
  staffStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  staffStat: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  staffStatDivider: { color: 'rgba(255,255,255,0.15)', fontSize: 12 },

  // Staff daily section
  staffSection: { marginTop: 16, marginBottom: 8 },
  staffSectionTitle: { color: '#7FB3D5', fontSize: 16, fontWeight: '700', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(127,179,213,0.2)' },

  // Day row
  dayRow: { flexDirection: 'row', marginBottom: 8, minHeight: 50 },
  dayLabel: { width: 60, paddingTop: 4, alignItems: 'center' },
  dayLabelOff: { opacity: 0.4 },
  dayLabelText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  dayLabelTextOff: { color: 'rgba(255,255,255,0.4)' },
  dayDateText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
  dayOffLabel: { color: '#EF4444', fontSize: 9, fontWeight: '800', marginTop: 4 },
  dayAppts: { flex: 1, paddingLeft: 8 },
  dayOffCard: { backgroundColor: 'rgba(239,68,68,0.06)', borderRadius: 8, padding: 10, borderLeftWidth: 3, borderLeftColor: 'rgba(239,68,68,0.3)' },
  dayOffCardText: { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontStyle: 'italic' },

  // Appointment card
  apptCard: { borderRadius: 8, padding: 10, marginBottom: 6, borderLeftWidth: 3 },
  apptCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  apptTime: { fontSize: 12, fontWeight: '700' },
  apptDuration: { fontSize: 11, fontWeight: '600' },
  apptType: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', marginBottom: 2 },
  apptPatient: { color: '#fff', fontSize: 13, fontWeight: '600' },
  apptLocation: { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 },
  apptNotes: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2, fontStyle: 'italic' },

  // Violations
  violationSection: { marginTop: 16 },
  violationTitle: { color: '#F59E0B', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  violationCard: { backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 8, padding: 10, marginBottom: 6, borderLeftWidth: 3, borderLeftColor: '#F59E0B' },
  violationText: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },

  // Loading / empty
  loadingText: { color: 'rgba(255,255,255,0.5)', marginTop: 12, fontSize: 14 },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 16, textAlign: 'center', marginBottom: 8 },
});
