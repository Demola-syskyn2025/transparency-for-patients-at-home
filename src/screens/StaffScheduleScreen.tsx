// src/screens/StaffScheduleScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FlatList } from 'react-native';
import api from '../config/api';
import type { AppointmentDto } from '../utils/apiTypes';

import CalendarHeader from '../components/appoinments/CalendarHeader';
import CalendarGrid from '../components/appoinments/CalendarGrid';

// ── Status colours ─────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  SCHEDULED:   { bg: 'rgba(127,179,213,0.2)', fg: '#7FB3D5' },
  CONFIRMED:   { bg: 'rgba(34,197,94,0.2)',   fg: '#22C55E' },
  IN_PROGRESS: { bg: 'rgba(245,158,11,0.2)',  fg: '#F59E0B' },
  COMPLETED:   { bg: 'rgba(34,197,94,0.2)',    fg: '#22C55E' },
  CANCELLED:   { bg: 'rgba(239,68,68,0.2)',    fg: '#EF4444' },
  RESCHEDULED: { bg: 'rgba(168,85,247,0.2)',   fg: '#A855F7' },
};
const FALLBACK_COLOR = { bg: 'rgba(255,255,255,0.1)', fg: 'rgba(255,255,255,0.6)' };

function sameYMD(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

// ── Main component ─────────────────────────────────────
export default function StaffScheduleScreen({ staffId }: { staffId: string }) {
  const navigation = useNavigation<any>();
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [cursor, setCursor] = useState<Date>(new Date());

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get<AppointmentDto[]>(`/appointments/staff/${staffId}`)
      .then(res => { if (alive) setAppointments(res.data); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [staffId]);

  // Count appointments per day for the calendar dots
  const countByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of appointments) {
      const k = new Date(a.scheduledAt).toDateString();
      m.set(k, (m.get(k) || 0) + 1);
    }
    return m;
  }, [appointments]);

  // Appointments for the selected day
  const dayAppointments = useMemo(
    () => appointments
      .filter(a => sameYMD(new Date(a.scheduledAt), cursor))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [appointments, cursor],
  );

  // ── Render ───────────────────────────────────────────
  return (
    <View style={s.container}>
      <CalendarHeader viewMode={viewMode} setViewMode={setViewMode} cursor={cursor} setCursor={setCursor} />
      <CalendarGrid viewMode={viewMode} cursor={cursor} setCursor={setCursor} countByDay={countByDay} />

      {/* Day label */}
      <View style={s.dayLabelRow}>
        <Text style={s.dayLabel}>
          {cursor.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        <Text style={s.dayCount}>{dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''}</Text>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#7FB3D5" /></View>
      ) : (
        <FlatList
          data={dayAppointments}
          keyExtractor={a => String(a.id)}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Text style={s.emptyText}>No appointments scheduled</Text>
            </View>
          }
          renderItem={({ item }) => {
            const time = new Date(item.scheduledAt);
            const sc = STATUS_COLORS[item.status] ?? FALLBACK_COLOR;
            return (
              <Pressable
                style={s.card}
                onPress={() => navigation.navigate('AppointmentDetail', { apptId: String(item.id) })}
              >
                {/* Top row: time + status */}
                <View style={s.cardTopRow}>
                  <Text style={s.cardTime}>
                    {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    {item.estimatedDurationMinutes ? ` · ${item.estimatedDurationMinutes} min` : ''}
                  </Text>
                  <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[s.statusText, { color: sc.fg }]}>{item.status.replace('_', ' ')}</Text>
                  </View>
                </View>

                {/* Patient info */}
                <View style={s.patientRow}>
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>
                      {item.patient.firstName[0]}{item.patient.lastName[0]}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={s.patientName}>{item.patient.firstName} {item.patient.lastName}</Text>
                    <Text style={s.patientDetail}>{item.patient.email}</Text>
                  </View>
                </View>

                {/* Type + Location */}
                <View style={s.metaRow}>
                  <View style={s.typeBadge}>
                    <Text style={s.typeText}>{item.type.replace(/_/g, ' ')}</Text>
                  </View>
                  {item.location && <Text style={s.locationText}>📍 {item.location}</Text>}
                </View>

                {/* Notes preview */}
                {item.notes && (
                  <Text style={s.notesPreview} numberOfLines={1}>{item.notes}</Text>
                )}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151A23' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  dayLabelRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  dayLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },
  dayCount: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },

  emptyBox: { padding: 30, alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.35)', fontSize: 14 },

  card: {
    backgroundColor: 'rgba(42,54,71,0.6)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },

  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTime: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },

  patientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(127,179,213,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#7FB3D5', fontSize: 14, fontWeight: '700' },
  patientName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  patientDetail: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 1 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeBadge: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  locationText: { color: 'rgba(255,255,255,0.45)', fontSize: 12 },

  notesPreview: { color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 8, fontStyle: 'italic' },
});
