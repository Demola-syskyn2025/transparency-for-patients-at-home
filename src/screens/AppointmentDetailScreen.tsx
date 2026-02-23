// src/screens/AppointmentDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../config/api';
import type { AppointmentDto, VisitSummaryDto } from '../utils/apiTypes';

type Role = 'patient' | 'family' | 'staff';

// ── Status helpers ──────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  SCHEDULED:   { bg: 'rgba(127,179,213,0.2)', fg: '#7FB3D5' },
  CONFIRMED:   { bg: 'rgba(34,197,94,0.2)',   fg: '#22C55E' },
  IN_PROGRESS: { bg: 'rgba(245,158,11,0.2)',  fg: '#F59E0B' },
  COMPLETED:   { bg: 'rgba(34,197,94,0.2)',    fg: '#22C55E' },
  CANCELLED:   { bg: 'rgba(239,68,68,0.2)',    fg: '#EF4444' },
  RESCHEDULED: { bg: 'rgba(168,85,247,0.2)',   fg: '#A855F7' },
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.SCHEDULED;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.fg }]}>{status.replace('_', ' ')}</Text>
    </View>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
      <Text style={[styles.badgeText, { color: 'rgba(255,255,255,0.7)' }]}>{type.replace('_', ' ')}</Text>
    </View>
  );
}

// ── Main component ──────────────────────────────────────
export default function AppointmentDetailScreen({
  route,
  role,
}: {
  route: { params: { apptId: string } };
  role: Role;
  [key: string]: any;
}) {
  const { apptId } = route.params;
  const navigation = useNavigation<any>();
  const [appt, setAppt] = useState<AppointmentDto | null>(null);
  const [summary, setSummary] = useState<VisitSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<AppointmentDto>(`/appointments/${apptId}`);
        setAppt(res.data);

        // Try to load visit summary for this appointment
        try {
          const sRes = await api.get<VisitSummaryDto>(`/visit-summaries/appointment/${apptId}`);
          setSummary(sRes.data);
        } catch {
          // No summary yet
        }
      } catch {
        // appointment not found
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [apptId]);

  async function updateStatus(newStatus: string) {
    if (!appt) return;
    setUpdating(true);
    try {
      const res = await api.patch(`/appointments/${appt.id}`, { status: newStatus });
      setAppt(res.data);
    } catch {
      const msg = 'Failed to update status';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7FB3D5" />
      </View>
    );
  }

  if (!appt) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Appointment not found</Text>
      </View>
    );
  }

  const scheduledDate = new Date(appt.scheduledAt);
  const isCompleted = appt.status === 'COMPLETED';
  const isCancelled = appt.status === 'CANCELLED';
  const hoursUntilAppt = (scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60);
  const canRequestChange = !isCompleted && !isCancelled && (role === 'patient' || role === 'family') && hoursUntilAppt >= 48;
  const showChangeWarning = !isCompleted && !isCancelled && (role === 'patient' || role === 'family') && hoursUntilAppt < 48 && hoursUntilAppt > 0;
  const canUpdateStatus = role === 'staff' && !isCancelled;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* ── Header Card ── */}
      <View style={styles.headerCard}>
        <View style={styles.badgeRow}>
          <StatusBadge status={appt.status} />
          <TypeBadge type={appt.type} />
        </View>

        <Text style={styles.dateText}>
          {scheduledDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
        <Text style={styles.timeText}>
          {scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          {appt.estimatedDurationMinutes ? ` · ${appt.estimatedDurationMinutes} min` : ''}
        </Text>

        {appt.location && (
          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>{appt.location}</Text>
          </View>
        )}
      </View>

      {/* ── People Card ── */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>
          {role === 'staff' ? 'PATIENT' : 'CARE PROVIDER'}
        </Text>
        {role === 'staff' ? (
          <PersonRow
            name={`${appt.patient.firstName} ${appt.patient.lastName}`}
            detail={appt.patient.email}
            phone={appt.patient.phoneNumber}
            initials={`${appt.patient.firstName[0]}${appt.patient.lastName[0]}`}
          />
        ) : (
          <PersonRow
            name={`${appt.staff.firstName} ${appt.staff.lastName}`}
            detail={appt.staff.role}
            phone={appt.staff.phoneNumber}
            initials={`${appt.staff.firstName[0]}${appt.staff.lastName[0]}`}
          />
        )}
      </View>

      {/* ── Notes ── */}
      {appt.notes && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>NOTES</Text>
          <Text style={styles.notesText}>{appt.notes}</Text>
        </View>
      )}

      {/* ── Visit Summary (if exists) ── */}
      {summary && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>VISIT SUMMARY</Text>
          <Text style={styles.summaryText}>{summary.summary}</Text>
          {summary.recommendations && (
            <>
              <Text style={styles.subLabel}>Recommendations</Text>
              <Text style={styles.summaryDetail}>{summary.recommendations}</Text>
            </>
          )}
          {summary.medications && (
            <>
              <Text style={styles.subLabel}>Medications</Text>
              <Text style={styles.summaryDetail}>{summary.medications}</Text>
            </>
          )}
          {summary.nextVisitRecommendation && (
            <>
              <Text style={styles.subLabel}>Next Visit</Text>
              <Text style={styles.summaryDetail}>
                {new Date(summary.nextVisitRecommendation).toLocaleDateString('en-GB')}
              </Text>
            </>
          )}
          <Text style={styles.summaryMeta}>
            By {summary.staffName} · {new Date(summary.createdAt).toLocaleDateString('en-GB')}
          </Text>
        </View>
      )}

      {/* ── Staff Actions ── */}
      {canUpdateStatus && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>UPDATE STATUS</Text>
          <View style={styles.actionsGrid}>
            {appt.status === 'SCHEDULED' && (
              <ActionButton label="Confirm" color="#22C55E" onPress={() => updateStatus('CONFIRMED')} disabled={updating} />
            )}
            {(appt.status === 'SCHEDULED' || appt.status === 'CONFIRMED') && (
              <ActionButton label="Start Visit" color="#F59E0B" onPress={() => updateStatus('IN_PROGRESS')} disabled={updating} />
            )}
            {appt.status === 'IN_PROGRESS' && (
              <ActionButton label="Complete" color="#22C55E" onPress={() => updateStatus('COMPLETED')} disabled={updating} />
            )}
            {!isCompleted && (
              <ActionButton label="Cancel" color="#EF4444" onPress={() => updateStatus('CANCELLED')} disabled={updating} />
            )}
          </View>

          {isCompleted && !summary && (
            <Pressable
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('WriteSummary', { appointmentId: appt.id })}
            >
              <Text style={styles.primaryBtnText}>Write Visit Summary</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* ── Patient/Family Actions ── */}
      {canRequestChange && (
        <View style={styles.patientActionsCard}>
          <Text style={styles.cardLabel}>REQUEST CHANGES</Text>
          <Text style={styles.actionHint}>You can request to reschedule or cancel this appointment.</Text>
          <Pressable
            style={styles.rescheduleBtn}
            onPress={() => navigation.navigate('RequestReschedule', { appointmentId: appt.id })}
          >
            <Text style={styles.rescheduleBtnText}>Request Change or Cancel</Text>
          </Pressable>
        </View>
      )}

      {showChangeWarning && (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            Changes can only be requested 48+ hours before the appointment.
            Contact your care provider directly for urgent changes.
          </Text>
        </View>
      )}

      {/* View full summary link for completed */}
      {isCompleted && summary && (
        <Pressable
          style={styles.linkBtn}
          onPress={() => navigation.navigate('HomecareVisitSummary', { summaryId: String(summary.id), apptId: String(appt.id) })}
        >
          <Text style={styles.linkBtnText}>View Full Visit Summary →</Text>
        </Pressable>
      )}

      {/* ── Metadata ── */}
      <View style={styles.metaCard}>
        <Text style={styles.metaText}>Appointment ID: {appt.id}</Text>
        <Text style={styles.metaText}>Created: {new Date(appt.createdAt).toLocaleDateString('en-GB')}</Text>
      </View>
    </ScrollView>
  );
}

// ── Sub-components ──────────────────────────────────────
function PersonRow({ name, detail, phone, initials }: { name: string; detail: string; phone?: string; initials: string }) {
  return (
    <View style={styles.personRow}>
      <View style={styles.personAvatar}>
        <Text style={styles.personAvatarText}>{initials}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.personName}>{name}</Text>
        <Text style={styles.personDetail}>{detail}</Text>
        {phone ? <Text style={styles.personPhone}>{phone}</Text> : null}
      </View>
    </View>
  );
}

function ActionButton({ label, color, onPress, disabled }: { label: string; color: string; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable
      style={[styles.actionBtn, { backgroundColor: color + '20', opacity: disabled ? 0.5 : 1 }]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
    </Pressable>
  );
}

// ── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151A23' },
  center: { flex: 1, backgroundColor: '#151A23', justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 16 },

  // Header
  headerCard: {
    backgroundColor: 'rgba(42,54,71,0.6)', margin: 16, marginBottom: 0, borderRadius: 16, padding: 20,
  },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  dateText: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  timeText: { color: 'rgba(255,255,255,0.7)', fontSize: 15 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  locationIcon: { fontSize: 16, marginRight: 6 },
  locationText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },

  // Cards
  card: {
    backgroundColor: 'rgba(42,54,71,0.6)', margin: 16, marginBottom: 0, borderRadius: 14, padding: 18,
  },
  cardLabel: { color: '#7FB3D5', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },

  // Person
  personRow: { flexDirection: 'row', alignItems: 'center' },
  personAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#7FB3D5',
    alignItems: 'center', justifyContent: 'center',
  },
  personAvatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  personName: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 2 },
  personDetail: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textTransform: 'capitalize' },
  personPhone: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 2 },

  // Notes
  notesText: { color: '#fff', fontSize: 14, lineHeight: 22 },

  // Visit Summary
  summaryText: { color: '#fff', fontSize: 14, lineHeight: 22, marginBottom: 10 },
  subLabel: { color: '#7FB3D5', fontSize: 12, fontWeight: '700', marginTop: 10, marginBottom: 4 },
  summaryDetail: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 20 },
  summaryMeta: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 10 },

  // Staff Actions
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
  primaryBtn: {
    backgroundColor: '#7FB3D5', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 14,
  },
  primaryBtnText: { color: '#151A23', fontSize: 15, fontWeight: '700' },

  // Patient Actions
  patientActionsCard: {
    backgroundColor: 'rgba(42,54,71,0.6)', margin: 16, marginBottom: 0, borderRadius: 14, padding: 18,
  },
  actionHint: {
    color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 12, lineHeight: 18,
  },
  rescheduleBtn: {
    padding: 14, borderRadius: 12,
    backgroundColor: 'rgba(127,179,213,0.15)', alignItems: 'center',
  },
  rescheduleBtnText: { color: '#7FB3D5', fontSize: 15, fontWeight: '700' },
  warningCard: {
    backgroundColor: 'rgba(245,158,11,0.1)', margin: 16, marginBottom: 0, borderRadius: 12, padding: 14,
  },
  warningText: {
    color: 'rgba(245,158,11,0.9)', fontSize: 13, lineHeight: 18, textAlign: 'center',
  },

  linkBtn: { margin: 16, marginBottom: 0, alignItems: 'center' },
  linkBtnText: { color: '#7FB3D5', fontSize: 14, fontWeight: '600' },

  // Meta
  metaCard: {
    margin: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  metaText: { color: 'rgba(255,255,255,0.3)', fontSize: 12, marginBottom: 4 },
});
