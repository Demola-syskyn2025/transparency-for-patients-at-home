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

          {/* Day-by-day schedule */}
          {sortedDays.map(day => {
            const existing = existingByDay.get(day) ?? [];
            const suggested = suggestionsByDay.get(day) ?? [];

            return (
              <View key={day} style={s.daySection}>
                <Text style={s.daySectionTitle}>{day}</Text>

                {/* Existing appointments */}
                {existing.map(a => (
                  <View key={`e-${a.id}`} style={s.existingCard}>
                    <View style={s.cardRow}>
                      <Text style={s.cardTime}>{fmtTime(a.scheduledAt)}</Text>
                      <Text style={s.cardDuration}>{a.estimatedDurationMinutes}m</Text>
                      <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[a.status]?.bg ?? 'rgba(255,255,255,0.1)' }]}>
                        <Text style={[s.statusText, { color: STATUS_COLORS[a.status]?.fg ?? '#fff' }]}>{a.status}</Text>
                      </View>
                    </View>
                    <View style={s.cardRow}>
                      <Text style={s.typeIcon}>{TYPE_ICONS[a.type] ?? '📋'}</Text>
                      <Text style={s.cardPatient}>{a.patient.firstName} {a.patient.lastName}</Text>
                    </View>
                    {a.notes && <Text style={s.cardNotes} numberOfLines={1}>{a.notes}</Text>}
                  </View>
                ))}

                {/* Suggested appointments */}
                {suggested.map(({ index, item: sg }) => (
                  <View key={`s-${index}`} style={s.suggestedCard}>
                    <View style={s.newBadge}>
                      <Text style={s.newBadgeText}>SUGGESTED</Text>
                    </View>
                    <View style={s.cardRow}>
                      <Text style={s.cardTime}>{fmtTime(sg.scheduledAt)}</Text>
                      <Text style={s.cardDuration}>{sg.estimatedDurationMinutes}m</Text>
                      <Text style={s.typeIcon}>{TYPE_ICONS[sg.type] ?? '📋'}</Text>
                    </View>
                    <Text style={s.cardPatient}>{sg.patientName}</Text>
                    <Text style={s.cardReason}>{sg.reason}</Text>
                    {sg.location && <Text style={s.cardLocation}>📍 {sg.location}</Text>}
                    <Pressable style={s.removeBtn} onPress={() => removeSuggestion(index)}>
                      <Text style={s.removeBtnText}>✕ Remove</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            );
          })}

          {sortedDays.length === 0 && (
            <View style={s.emptyBox}>
              <Text style={s.emptyText}>No appointments for this period</Text>
            </View>
          )}

          {/* Unscheduled patients */}
          {data.unscheduledPatients.length > 0 && (
            <View style={s.warningSection}>
              <Text style={s.warnTitle}>⚠️ Needs Manual Scheduling</Text>
              {data.unscheduledPatients.map((p: UnscheduledPatient) => (
                <View key={p.patientId} style={s.warnCard}>
                  <Text style={s.warnPatient}>{p.patientName}</Text>
                  <Text style={s.warnReason}>{p.reason}</Text>
                  {p.lastVisitDate && (
                    <Text style={s.warnDetail}>Last visit: {fmtDay(p.lastVisitDate)}</Text>
                  )}
                  {p.recommendedFrequency && (
                    <Text style={s.warnDetail}>Recommended: {p.recommendedFrequency.toLowerCase()}</Text>
                  )}
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
  warnTitle: { color: '#F59E0B', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  warnCard: { backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 10, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#F59E0B' },
  warnPatient: { color: '#fff', fontSize: 14, fontWeight: '600' },
  warnReason: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 },
  warnDetail: { color: 'rgba(245,158,11,0.7)', fontSize: 12, marginTop: 2 },

  // Confirm button
  confirmBtn: { backgroundColor: '#22C55E', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Loading / empty
  loadingText: { color: 'rgba(255,255,255,0.5)', marginTop: 12, fontSize: 14 },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center' },
  emptyBox: { padding: 40, alignItems: 'center' },
});
