// src/screens/StaffDashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../config/api';
import { rescheduleApi } from '../services/rescheduleApi';
import type { AppointmentDto, RescheduleRequestDto } from '../utils/apiTypes';

export default function StaffDashboardScreen({ staffId }: { staffId: string }) {
  const navigation = useNavigation<any>();
  const [todayAppts, setTodayAppts] = useState<AppointmentDto[]>([]);
  const [upcomingAppts, setUpcomingAppts] = useState<AppointmentDto[]>([]);
  const [pendingReschedules, setPendingReschedules] = useState<RescheduleRequestDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [apptsRes, reschedules] = await Promise.all([
          api.get(`/appointments/staff/${staffId}`),
          rescheduleApi.getPending(),
        ]);
        const today = new Date().toDateString();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const allAppts: AppointmentDto[] = apptsRes.data;
        setTodayAppts(
          allAppts
            .filter((a) => new Date(a.scheduledAt).toDateString() === today)
            .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        );
        setUpcomingAppts(
          allAppts
            .filter((a) => {
              const apptDate = new Date(a.scheduledAt);
              return apptDate > tomorrow && apptDate <= nextWeek && a.status !== 'CANCELLED';
            })
            .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
            .slice(0, 5)
        );
        setPendingReschedules(reschedules);
      } catch {
        // handle error silently
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [staffId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7FB3D5" />
      </View>
    );
  }

  return (
    <LinearGradient colors={['#6294A1', '#151A23']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} locations={[0, 0.29]} style={{ flex: 1 }}>
      <FlatList
        data={[]}
        renderItem={null}
        contentContainerStyle={{ padding: 20, paddingTop: 60 }}
        ListHeaderComponent={
          <>
            <Text style={styles.greeting}>Staff Dashboard</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>

            {/* Today's Schedule */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Schedule</Text>
              <Text style={styles.badge}>{todayAppts.length}</Text>
            </View>

            {todayAppts.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No appointments today</Text>
              </View>
            ) : (
              todayAppts.map((appt) => (
                <Pressable
                  key={appt.id}
                  style={styles.card}
                  onPress={() => navigation.navigate('AppointmentDetail', { apptId: String(appt.id) })}
                >
                  <View style={styles.cardRow}>
                    <View style={styles.timeBadge}>
                      <Text style={styles.timeText}>
                        {new Date(appt.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.cardTitle}>{appt.patient.firstName} {appt.patient.lastName}</Text>
                      <Text style={styles.cardSub}>{appt.type.replace('_', ' ')} • {appt.estimatedDurationMinutes} min</Text>
                      {appt.location && <Text style={styles.cardSub}>{appt.location}</Text>}
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: appt.status === 'COMPLETED' ? '#22C55E' : appt.status === 'IN_PROGRESS' ? '#F59E0B' : '#7FB3D5' }]} />
                  </View>
                </Pressable>
              ))
            )}

            {/* Upcoming Appointments */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming This Week</Text>
              <Text style={styles.badge}>{upcomingAppts.length}</Text>
            </View>

            {upcomingAppts.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No upcoming appointments</Text>
              </View>
            ) : (
              upcomingAppts.map((appt) => (
                <Pressable
                  key={appt.id}
                  style={styles.card}
                  onPress={() => navigation.navigate('AppointmentDetail', { apptId: String(appt.id) })}
                >
                  <View style={styles.cardRow}>
                    <View style={styles.upcomingDateBadge}>
                      <Text style={styles.upcomingDateText}>
                        {new Date(appt.scheduledAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}
                      </Text>
                      <Text style={styles.upcomingTimeText}>
                        {new Date(appt.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.cardTitle}>{appt.patient.firstName} {appt.patient.lastName}</Text>
                      <Text style={styles.cardSub}>{appt.type.replace('_', ' ')} • {appt.estimatedDurationMinutes} min</Text>
                      {appt.location && <Text style={styles.cardSub}>{appt.location}</Text>}
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: appt.status === 'CONFIRMED' ? '#22C55E' : '#7FB3D5' }]} />
                  </View>
                </Pressable>
              ))
            )}

            {/* Pending Reschedule Requests */}
            <Pressable style={styles.sectionHeader} onPress={() => navigation.navigate('PendingReschedules')}>
              <Text style={styles.sectionTitle}>Pending Reschedules</Text>
              <Text style={[styles.badge, pendingReschedules.length > 0 && styles.badgeAlert]}>{pendingReschedules.length}</Text>
            </Pressable>

            {pendingReschedules.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No pending requests</Text>
              </View>
            ) : (
              pendingReschedules.slice(0, 3).map((req) => (
                <Pressable
                  key={req.id}
                  style={styles.card}
                  onPress={() => navigation.navigate('ReviewReschedule', { requestId: String(req.id) })}
                >
                  <Text style={styles.cardTitle}>{req.patientName}</Text>
                  <Text style={styles.cardSub}>{req.reason || 'No reason given'}</Text>
                  <Text style={styles.cardDate}>
                    Preferred: {req.preferredDate1 ? new Date(req.preferredDate1).toLocaleDateString('en-GB') : 'N/A'}
                  </Text>
                </Pressable>
              ))
            )}

            {/* Quick Actions */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Quick Actions</Text>
            <View style={styles.actionsRow}>
              <Pressable style={styles.actionBtn} onPress={() => navigation.navigate('MyPatients')}>
                <Text style={styles.actionIcon}>👥</Text>
                <Text style={styles.actionText}>My Patients</Text>
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={() => navigation.navigate('Schedule')}>
                <Text style={styles.actionIcon}>📅</Text>
                <Text style={styles.actionText}>All Appointments</Text>
              </Pressable>
            </View>
          </>
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#151A23', justifyContent: 'center', alignItems: 'center' },
  greeting: { color: '#fff', fontSize: 24, fontWeight: '700' },
  date: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 10 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 },
  badge: {
    backgroundColor: 'rgba(127,179,213,0.3)', paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 12, color: '#7FB3D5', fontSize: 13, fontWeight: '700', overflow: 'hidden',
  },
  badgeAlert: { backgroundColor: 'rgba(239,68,68,0.3)', color: '#EF4444' },
  card: {
    backgroundColor: 'rgba(42,54,71,0.6)', borderRadius: 12, padding: 14, marginBottom: 10,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  timeBadge: {
    backgroundColor: 'rgba(127,179,213,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  timeText: { color: '#7FB3D5', fontSize: 14, fontWeight: '700' },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  cardSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  cardDate: { color: '#7FB3D5', fontSize: 12, marginTop: 6 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  upcomingDateBadge: {
    backgroundColor: 'rgba(34,197,94,0.2)', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8,
    alignItems: 'center', minWidth: 60,
  },
  upcomingDateText: { color: '#22C55E', fontSize: 12, fontWeight: '700' },
  upcomingTimeText: { color: 'rgba(34,197,94,0.8)', fontSize: 11, fontWeight: '600', marginTop: 2 },
  emptyCard: {
    backgroundColor: 'rgba(42,54,71,0.3)', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 10,
  },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  actionBtn: {
    flex: 1, backgroundColor: 'rgba(42,54,71,0.6)', borderRadius: 12, padding: 16, alignItems: 'center',
  },
  actionIcon: { fontSize: 28, marginBottom: 6 },
  actionText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
