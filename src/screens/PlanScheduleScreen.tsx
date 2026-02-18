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
import api from '../config/api';
import type {
  ScheduleSuggestionResponse,
  SuggestedAppointment,
  AppointmentDto,
  UnscheduledPatient,
  CreateAppointmentRequest,
} from '../utils/apiTypes';

// ── Helpers ──────────────────────────────────────────
function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
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
  return d.toISOString().slice(0, 10);
}

function fmtDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const TYPE_ICONS: Record<string, string> = {
  HOME_VISIT: '🏠',
  TELECONSULTATION: '📹',
  HOSPITAL_VISIT: '🏥',
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  SCHEDULED:   { bg: 'rgba(127,179,213,0.15)', fg: '#7FB3D5' },
  CONFIRMED:   { bg: 'rgba(34,197,94,0.15)',   fg: '#22C55E' },
  IN_PROGRESS: { bg: 'rgba(245,158,11,0.15)',  fg: '#F59E0B' },
  COMPLETED:   { bg: 'rgba(34,197,94,0.15)',   fg: '#22C55E' },
  CANCELLED:   { bg: 'rgba(239,68,68,0.15)',   fg: '#EF4444' },
};

// ── Main Component ───────────────────────────────────
export default function PlanScheduleScreen({ staffId }: { staffId: string }) {
  const [weekOffset, setWeekOffset] = useState(1); // default: next week
  const [data, setData] = useState<ScheduleSuggestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [removedSuggestions, setRemovedSuggestions] = useState<Set<number>>(new Set());

  const monday = getMonday(addDays(new Date(), weekOffset * 7));
  const sunday = addDays(monday, 6);

  const fetchSuggestion = useCallback(async () => {
    setLoading(true);
    setRemovedSuggestions(new Set());
    try {
      const res = await api.get<ScheduleSuggestionResponse>('/appointments/suggest', {
        params: {
          staffId,
          startDate: fmtDate(monday),
          endDate: fmtDate(sunday),
        },
      });
      setData(res.data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load schedule suggestion');
    } finally {
      setLoading(false);
    }
  }, [staffId, weekOffset]);

  useEffect(() => { fetchSuggestion(); }, [fetchSuggestion]);

  // Remove a suggestion from the list
  const removeSuggestion = (index: number) => {
    setRemovedSuggestions(prev => new Set(prev).add(index));
  };

  // Confirm: batch-create the accepted suggestions
  const confirmSchedule = async () => {
    if (!data) return;
    const accepted = data.suggestions.filter((_, i) => !removedSuggestions.has(i));
    if (accepted.length === 0) {
      Alert.alert('Nothing to confirm', 'All suggestions have been removed.');
      return;
    }

    setConfirming(true);
    try {
      const appointments: CreateAppointmentRequest[] = accepted.map(s => ({
        patientId: s.patientId,
        staffId: Number(staffId),
        scheduledAt: s.scheduledAt,
        estimatedDurationMinutes: s.estimatedDurationMinutes,
        type: s.type,
        notes: s.notes || undefined,
        location: s.location || undefined,
      }));

      const res = await api.post('/appointments/batch', { appointments });
      const { totalCreated, totalErrors } = res.data;

      if (totalErrors > 0) {
        Alert.alert('Partially Created', `${totalCreated} created, ${totalErrors} had conflicts.`);
      } else {
        Alert.alert('Schedule Confirmed', `${totalCreated} appointments created successfully.`);
      }

      // Refresh to show updated state
      fetchSuggestion();
    } catch {
      Alert.alert('Error', 'Failed to create appointments.');
    } finally {
      setConfirming(false);
    }
  };

  // ── Generate time slots for timetable ─────────────────────
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // ── Check staff availability for time slot ─────────────────────
  const isTimeSlotAvailable = (dayName: string, timeSlot: string): boolean => {
    // Convert day name to day of week (0=Sunday, 1=Monday, etc.)
    const dayMap: { [key: string]: number } = {
      'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 0
    };
    const dayOfWeek = dayMap[dayName.split(' ')[1]] || 1;
    
    // Convert time slot to LocalTime
    const [hour, minute] = timeSlot.split(':').map(Number);
    const slotTime = { hour, minute };
    
    // For demo purposes, we'll simulate availability based on realistic schedule
    // In real app, this would call the backend API
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday-Friday
      if (hour >= 8 && hour < 10) return false; // Hospital rounds
      if (hour >= 10 && hour < 12) return true;  // Clinic appointments
      if (hour >= 12 && hour < 13) return false; // Lunch
      if (hour >= 13 && hour < 14) return false; // Admin work
      if (hour >= 14 && hour < 17) return true;  // Home visits
      if (hour >= 17) return false; // After hours
    } else if (dayOfWeek === 6) { // Saturday
      return hour >= 8 && hour < 18; // Emergency on-call
    } else { // Sunday
      return false; // Off
    }
    
    return false;
  };
  const generateWeekDays = () => {
    const days = [];
    const startOfWeek = getMonday(monday);
    for (let i = 0; i < 7; i++) {
      const day = addDays(startOfWeek, i);
      days.push(fmtDay(day.toISOString()));
    }
    return days;
  };

  const weekDays = generateWeekDays();

  // ── Group suggestions by day ───────────────────────
  const activeSuggestions = data?.suggestions.filter((_, i) => !removedSuggestions.has(i)) ?? [];
  const suggestionsByDay = new Map<string, { index: number; item: SuggestedAppointment }[]>();
  data?.suggestions.forEach((s, i) => {
    if (removedSuggestions.has(i)) return;
    const day = fmtDay(s.scheduledAt);
    if (!suggestionsByDay.has(day)) suggestionsByDay.set(day, []);
    suggestionsByDay.get(day)!.push({ index: i, item: s });
  });

  // Group existing appointments by day
  const existingByDay = new Map<string, AppointmentDto[]>();
  data?.alreadyScheduled.forEach(a => {
    const day = fmtDay(a.scheduledAt);
    if (!existingByDay.has(day)) existingByDay.set(day, []);
    existingByDay.get(day)!.push(a);
  });

  // Merge all days and sort
  const allDays = new Set([...suggestionsByDay.keys(), ...existingByDay.keys()]);
  const sortedDays = [...allDays].sort((a, b) => {
    const da = suggestionsByDay.get(a)?.[0]?.item.scheduledAt || existingByDay.get(a)?.[0]?.scheduledAt || '';
    const db = suggestionsByDay.get(b)?.[0]?.item.scheduledAt || existingByDay.get(b)?.[0]?.scheduledAt || '';
    return da.localeCompare(db);
  });

  // ── Group appointments by day and time slot ─────────────────
  const timetableData = new Map<string, Map<string, any[]>>();
  
  // Initialize all 7 days with empty time slots
  weekDays.forEach(day => {
    const daySlots = new Map();
    timeSlots.forEach(slot => {
      daySlots.set(slot, []);
    });
    timetableData.set(day, daySlots);
  });

  // Fill in existing appointments
  existingByDay.forEach((appointments, day) => {
    const daySlots = timetableData.get(day);
    if (daySlots) {
      appointments.forEach(appt => {
        const time = fmtTime(appt.scheduledAt);
        if (daySlots.has(time)) {
          daySlots.get(time)!.push({
            type: 'existing',
            data: appt
          });
        }
      });
    }
  });

  // Fill in suggested appointments
  suggestionsByDay.forEach((suggestions, day) => {
    const daySlots = timetableData.get(day);
    if (daySlots) {
      suggestions.forEach(({ item: sg }) => {
        const time = fmtTime(sg.scheduledAt);
        if (daySlots.has(time)) {
          daySlots.get(time)!.push({
            type: 'suggested',
            index: suggestions.findIndex(s => s.item === sg),
            data: sg
          });
        }
      });
    }
  });

  // ── Render ─────────────────────────────────────────
  return (
    <View style={s.container}>
      {/* Period selector */}
      <View style={s.periodRow}>
        <Pressable style={s.arrowBtn} onPress={() => setWeekOffset(w => w - 1)}>
          <Text style={s.arrowText}>◀</Text>
        </Pressable>
        <View style={s.periodCenter}>
          <Text style={s.periodLabel}>
            {fmtDate(monday)} — {fmtDate(sunday)}
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
          <Text style={s.loadingText}>Generating schedule…</Text>
        </View>
      ) : !data ? (
        <View style={s.center}>
          <Text style={s.emptyText}>No data available</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>
          {/* Summary bar */}
          <View style={s.summaryRow}>
            <View style={s.summaryItem}>
              <Text style={s.summaryNum}>{data.alreadyScheduled.length}</Text>
              <Text style={s.summaryLabel}>Already{'\n'}Scheduled</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={[s.summaryNum, { color: '#22C55E' }]}>{activeSuggestions.length}</Text>
              <Text style={s.summaryLabel}>New{'\n'}Suggestions</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={[s.summaryNum, { color: '#F59E0B' }]}>{data.unscheduledPatients.length}</Text>
              <Text style={s.summaryLabel}>Needs{'\n'}Attention</Text>
            </View>
          </View>

          {/* Timetable View */}
          <View style={s.timetableContainer}>
            {/* Timetable Header - Fixed */}
            <View style={s.timetableHeader}>
              <View style={s.timeColumnHeader}>
                <Text style={s.columnHeaderText}>Time</Text>
              </View>
              {weekDays.map(day => (
                <View key={day} style={s.dayColumnHeader}>
                  <Text style={s.columnHeaderText}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Timetable Body - Scrollable */}
            <ScrollView 
              showsVerticalScrollIndicator={true}
              style={s.timetableScrollContainer}
              contentContainerStyle={s.timetableScrollContent}
            >
              <View style={s.timetableBody}>
                {timeSlots.map(slot => (
                  <View key={slot} style={s.timetableRow}>
                    {/* Time column - Fixed width */}
                    <View style={s.timeColumn}>
                      <Text style={s.timeText}>{slot}</Text>
                    </View>
                    
                    {/* Day columns - All 7 days with fixed width */}
                    {weekDays.map(day => {
                      const daySlots = timetableData.get(day);
                      const slotAppointments = daySlots?.get(slot) || [];
                      const isAvailable = isTimeSlotAvailable(day, slot);
                      
                      return (
                        <View key={`${day}-${slot}`} style={[s.dayColumn, !isAvailable && s.unavailableColumn]}>
                          {slotAppointments.map((appt, index) => {
                            if (appt.type === 'existing') {
                              const existing = appt.data as AppointmentDto;
                              return (
                                <View key={index} style={s.existingSlot}>
                                  <Text style={s.slotPatient}>{existing.patient.firstName} {existing.patient.lastName}</Text>
                                  <Text style={s.slotType}>{existing.type.replace(/_/g, ' ')}</Text>
                                </View>
                              );
                            } else if (appt.type === 'suggested') {
                              const suggested = appt.data as SuggestedAppointment;
                              return (
                                <View key={index} style={s.suggestedSlot}>
                                  <View style={s.suggestedBadge}>
                                    <Text style={s.suggestedBadgeText}>NEW</Text>
                                  </View>
                                  <Text style={s.slotPatient}>{suggested.patientName}</Text>
                                  <Text style={s.slotType}>{suggested.type.replace(/_/g, ' ')}</Text>
                                  <Pressable 
                                    style={s.removeSlotBtn} 
                                    onPress={() => removeSuggestion(appt.index)}
                                  >
                                    <Text style={s.removeSlotBtnText}>✕</Text>
                                  </Pressable>
                                </View>
                              );
                            }
                            return null;
                          })}
                          
                          {/* Show unavailable indicator if no appointments and slot is unavailable */}
                          {slotAppointments.length === 0 && !isAvailable && (
                            <View style={s.unavailableSlot}>
                              <Text style={s.unavailableText}>Unavailable</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Unscheduled patients */}
          {data.unscheduledPatients.length > 0 && (
            <View style={s.warningSection}>
              <View style={s.warnHeader}>
                <Text style={s.warnTitle}>📋 Patients Needing Appointments</Text>
                <Text style={s.warnCount}>{data.unscheduledPatients.length} patient{data.unscheduledPatients.length !== 1 ? 's' : ''}</Text>
              </View>
              {data.unscheduledPatients.map((p: UnscheduledPatient) => (
                <View key={p.patientId} style={s.warnCard}>
                  <View style={s.warnCardHeader}>
                    <Text style={s.warnPatient}>{p.patientName}</Text>
                    <Pressable style={s.scheduleNowBtn} onPress={() => {
                      // TODO: Navigate to manual appointment creation for this patient
                      Alert.alert('Schedule Now', `Would navigate to manual scheduling for ${p.patientName}`);
                    }}>
                      <Text style={s.scheduleNowBtnText}>Schedule Now</Text>
                    </Pressable>
                  </View>
                  <Text style={s.warnReason}>{p.reason}</Text>
                  <View style={s.warnDetails}>
                    {p.lastVisitDate && (
                      <Text style={s.warnDetail}>📅 Last visit: {fmtDay(p.lastVisitDate)}</Text>
                    )}
                    {p.recommendedFrequency && (
                      <Text style={s.warnDetail}>🔄 Recommended: {p.recommendedFrequency.toLowerCase()}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Confirm button */}
          {activeSuggestions.length > 0 && (
            <Pressable
              style={[s.confirmBtn, confirming && s.confirmBtnDisabled]}
              onPress={confirmSchedule}
              disabled={confirming}
            >
              {confirming ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.confirmBtnText}>
                  Confirm {activeSuggestions.length} New Appointment{activeSuggestions.length !== 1 ? 's' : ''}
                </Text>
              )}
            </Pressable>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151A23' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },

  // Period selector
  periodRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
  arrowBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  arrowText: { color: '#7FB3D5', fontSize: 16 },
  periodCenter: { flex: 1, alignItems: 'center' },
  periodLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },
  periodSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },

  // Summary
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16 },
  summaryItem: { alignItems: 'center' },
  summaryNum: { color: '#7FB3D5', fontSize: 28, fontWeight: '800' },
  summaryLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, textAlign: 'center', marginTop: 4 },

  // Day sections
  daySection: { marginBottom: 20 },
  daySectionTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 8, paddingLeft: 4 },

  // Cards shared
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTime: { color: '#7FB3D5', fontSize: 14, fontWeight: '700', width: 46 },
  cardDuration: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  cardPatient: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 2 },
  cardNotes: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 },
  cardLocation: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
  cardReason: { color: 'rgba(127,179,213,0.7)', fontSize: 12, marginTop: 2 },
  typeIcon: { fontSize: 14 },

  // Existing appointment card
  existingCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#7FB3D5' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 'auto' },
  statusText: { fontSize: 10, fontWeight: '700' },

  // Suggested appointment card
  suggestedCard: { backgroundColor: 'rgba(34,197,94,0.06)', borderRadius: 10, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#22C55E', borderStyle: 'dashed' },
  newBadge: { backgroundColor: 'rgba(34,197,94,0.2)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 6 },
  newBadgeText: { color: '#22C55E', fontSize: 10, fontWeight: '800' },
  removeBtn: { alignSelf: 'flex-end', marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(239,68,68,0.15)' },
  removeBtnText: { color: '#EF4444', fontSize: 12, fontWeight: '600' },

  // Warning section
  warningSection: { marginTop: 8, marginBottom: 20 },
  warnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  warnTitle: { color: '#F59E0B', fontSize: 15, fontWeight: '700' },
  warnCount: { color: 'rgba(245,158,11,0.7)', fontSize: 12, fontWeight: '600' },
  warnCard: { backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 10, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#F59E0B' },
  warnCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  warnPatient: { color: '#fff', fontSize: 14, fontWeight: '700' },
  warnReason: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 },
  warnDetails: { marginTop: 8 },
  warnDetail: { color: 'rgba(245,158,11,0.7)', fontSize: 12, marginTop: 2 },
  scheduleNowBtn: { backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  scheduleNowBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Confirm button
  confirmBtn: { backgroundColor: '#22C55E', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Loading / empty
  loadingText: { color: 'rgba(255,255,255,0.5)', marginTop: 12, fontSize: 14 },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center' },
  emptyBox: { padding: 40, alignItems: 'center' },

  // Timetable styles
  timetableContainer: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, marginVertical: 16, overflow: 'hidden' },
  timetableScrollContainer: { maxHeight: 450, flex: 1 },
  timetableScrollContent: { paddingBottom: 20 },
  timetableHeader: { flexDirection: 'row', backgroundColor: 'rgba(127,179,213,0.1)', borderBottomWidth: 1, borderBottomColor: 'rgba(127,179,213,0.2)', position: 'sticky', top: 0, zIndex: 1 },
  timeColumnHeader: { width: 70, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: 'rgba(127,179,213,0.2)' },
  dayColumnHeader: { width: 120, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: 'rgba(127,179,213,0.2)' },
  columnHeaderText: { color: '#7FB3D5', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  timetableBody: { flexDirection: 'column' },
  timetableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', minHeight: 60 },
  timeColumn: { width: 70, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.05)' },
  timeText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  dayColumn: { width: 120, padding: 4, backgroundColor: 'rgba(255,255,255,0.01)', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.05)' },
  unavailableColumn: { backgroundColor: 'rgba(239,68,68,0.15)', borderRightWidth: 1, borderRightColor: 'rgba(239,68,68,0.3)' },
  existingSlot: { backgroundColor: 'rgba(127,179,213,0.15)', borderRadius: 6, padding: 6, marginBottom: 4, borderLeftWidth: 2, borderLeftColor: '#7FB3D5' },
  suggestedSlot: { backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 6, padding: 6, marginBottom: 4, borderLeftWidth: 2, borderLeftColor: '#22C55E', position: 'relative' },
  unavailableSlot: { backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: 6, padding: 6, marginBottom: 4, borderLeftWidth: 2, borderLeftColor: 'rgba(239,68,68,0.5)', alignItems: 'center', justifyContent: 'center' },
  unavailableText: { color: 'rgba(239,68,68,0.8)', fontSize: 9, fontWeight: '600', textAlign: 'center' },
  suggestedBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(34,197,94,0.3)', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  suggestedBadgeText: { color: '#22C55E', fontSize: 8, fontWeight: '800' },
  slotPatient: { color: '#fff', fontSize: 11, fontWeight: '600', marginBottom: 2 },
  slotType: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
  removeSlotBtn: { position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.2)', alignItems: 'center', justifyContent: 'center' },
  removeSlotBtnText: { color: '#EF4444', fontSize: 10, fontWeight: '700' },
});
