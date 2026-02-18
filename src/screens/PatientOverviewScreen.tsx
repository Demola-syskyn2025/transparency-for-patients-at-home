// src/screens/PatientOverviewScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../config/api';
import type { AppointmentDto, CareTaskDto, VisitSummaryDto } from '../utils/apiTypes';

export default function PatientOverviewScreen({
  route,
}: {
  route: { params: { patientId: string; patientName: string } };
}) {
  const { patientId, patientName } = route.params;
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [tasks, setTasks] = useState<CareTaskDto[]>([]);
  const [summaries, setSummaries] = useState<VisitSummaryDto[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [apptsRes, tasksRes, summariesRes] = await Promise.all([
          api.get(`/appointments/patient/${patientId}`),
          api.get(`/tasks/patient/${patientId}`),
          api.get(`/visit-summaries/patient/${patientId}`),
        ]);
        setAppointments(
          (apptsRes.data as AppointmentDto[]).sort(
            (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
          )
        );
        setTasks(tasksRes.data);
        setSummaries(summariesRes.data);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [patientId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7FB3D5" />
      </View>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) => t.dueDate === today);
  const doneTasks = todayTasks.filter((t) => t.status === 'COMPLETED');
  const upcomingAppts = appointments.filter((a) => new Date(a.scheduledAt) >= new Date() && a.status !== 'CANCELLED');

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Patient Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{patientName.split(' ').map((n) => n[0]).join('')}</Text>
        </View>
        <Text style={styles.name}>{patientName}</Text>
      </View>

      {/* Task Progress */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>TODAY'S TASKS</Text>
        <Text style={styles.stat}>
          {doneTasks.length} / {todayTasks.length} completed
        </Text>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: todayTasks.length > 0 ? `${(doneTasks.length / todayTasks.length) * 100}%` : '0%' },
            ]}
          />
        </View>
        {todayTasks.map((t) => (
          <View key={t.id} style={styles.taskRow}>
            <Text style={[styles.taskText, t.status === 'COMPLETED' && styles.taskDone]}>
              {t.status === 'COMPLETED' ? '✓ ' : '○ '}
              {t.title}
            </Text>
            <Text style={styles.taskTime}>{t.dueTime || ''}</Text>
          </View>
        ))}
        {todayTasks.length === 0 && <Text style={styles.empty}>No tasks for today</Text>}
      </View>

      {/* Upcoming Appointments */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>UPCOMING APPOINTMENTS</Text>
        {upcomingAppts.slice(0, 5).map((appt) => (
          <Pressable
            key={appt.id}
            style={styles.apptRow}
            onPress={() => navigation.navigate('AppointmentDetail', { apptId: String(appt.id) })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.apptTitle}>{appt.type.replace('_', ' ')}</Text>
              <Text style={styles.apptDate}>
                {new Date(appt.scheduledAt).toLocaleDateString('en-GB')} at{' '}
                {new Date(appt.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </Text>
              {appt.location && <Text style={styles.apptLocation}>{appt.location}</Text>}
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        ))}
        {upcomingAppts.length === 0 && <Text style={styles.empty}>No upcoming appointments</Text>}
      </View>

      {/* Visit Summaries */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>VISIT SUMMARIES</Text>
        {summaries.slice(0, 3).map((s) => (
          <Pressable
            key={s.id}
            style={styles.apptRow}
            onPress={() => navigation.navigate('HomecareVisitSummary', { summaryId: String(s.id) })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.apptTitle}>{s.staffName}</Text>
              <Text style={styles.apptDate}>{new Date(s.createdAt).toLocaleDateString('en-GB')}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        ))}
        {summaries.length === 0 && <Text style={styles.empty}>No visit summaries</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151A23' },
  center: { flex: 1, backgroundColor: '#151A23', justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#7FB3D5',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  name: { color: '#fff', fontSize: 20, fontWeight: '700' },
  card: {
    backgroundColor: 'rgba(42,54,71,0.6)', borderRadius: 14, padding: 16, marginBottom: 14,
  },
  cardLabel: { color: '#7FB3D5', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  stat: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  progressBarBg: {
    height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 12,
  },
  progressBarFill: { height: 8, backgroundColor: '#22C55E', borderRadius: 4 },
  taskRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  taskText: { color: '#fff', fontSize: 14, flex: 1 },
  taskDone: { color: 'rgba(255,255,255,0.4)', textDecorationLine: 'line-through' },
  taskTime: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginLeft: 8 },
  apptRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  apptTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  apptDate: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  apptLocation: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  arrow: { color: '#7FB3D5', fontSize: 20, marginLeft: 8 },
  empty: { color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', paddingVertical: 12 },
});
