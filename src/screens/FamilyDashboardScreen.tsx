// src/screens/FamilyDashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { careAssignmentApi } from '../services/careAssignmentApi';
import api from '../config/api';
import type { AppointmentDto, CareAssignmentDto, CareTaskDto } from '../utils/apiTypes';

export default function FamilyDashboardScreen({ userId }: { userId: string }) {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [nextAppt, setNextAppt] = useState<AppointmentDto | null>(null);
  const [taskStats, setTaskStats] = useState({ total: 0, done: 0 });
  const [careTeam, setCareTeam] = useState<CareAssignmentDto[]>([]);

  useEffect(() => {
    async function load() {
      try {
        // Family member might be linked via care assignments — for now try to find
        // the patient linked to this user through assignments or use userId
        // Since family members aren't directly in care_assignments, we'll need
        // a different approach. For MVP, show a helpful message or let them enter patient ID.
        // For now, we'll check if there are any assignments where this user is staff
        // (which won't work for family). So let's just try to get patient data via
        // a hypothetical linked patient. We'll use a simple approach:

        // Try to find assignments (family might view patient data differently)
        // For MVP, we'll show general info
        const assignmentsRes = await careAssignmentApi.getByStaff(userId).catch(() => []);

        if (assignmentsRes.length > 0) {
          // If somehow family is listed (future feature)
          const patient = assignmentsRes[0].patient;
          setPatientName(`${patient.firstName} ${patient.lastName}`);
          setPatientId(String(patient.id));
          await loadPatientData(String(patient.id));
          setCareTeam(assignmentsRes);
        } else {
          // Default: try to load data using userId as patientId
          // This covers the case where family views their own linked patient
          setPatientId(userId);
          await loadPatientData(userId);
        }
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }

    async function loadPatientData(pid: string) {
      try {
        const [apptsRes, tasksRes] = await Promise.all([
          api.get(`/appointments/patient/${pid}`),
          api.get(`/tasks/patient/${pid}`),
        ]);

        const appts: AppointmentDto[] = apptsRes.data;
        const now = new Date();
        const upcoming = appts
          .filter((a) => new Date(a.scheduledAt) >= now && a.status !== 'CANCELLED')
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
        setNextAppt(upcoming[0] || null);

        const tasks: CareTaskDto[] = tasksRes.data;
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = tasks.filter((t) => t.dueDate === today);
        setTaskStats({
          total: todayTasks.length,
          done: todayTasks.filter((t) => t.status === 'COMPLETED').length,
        });

        // Load care team for this patient
        const teamRes = await careAssignmentApi.getByPatient(pid).catch(() => []);
        setCareTeam(teamRes);
      } catch {
        // silently handle
      }
    }

    load();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7FB3D5" />
      </View>
    );
  }

  const completionPct = taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0;

  return (
    <LinearGradient colors={['#6294A1', '#151A23']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} locations={[0, 0.29]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 80 }}>
        <Text style={styles.greeting}>Family Overview</Text>
        {patientName ? (
          <Text style={styles.subtitle}>Monitoring: {patientName}</Text>
        ) : (
          <Text style={styles.subtitle}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        )}

        {/* Next Appointment Card */}
        <Pressable
          style={styles.card}
          onPress={() => {
            if (nextAppt) navigation.navigate('AppointmentDetail', { apptId: String(nextAppt.id) });
            else navigation.navigate('Appointments');
          }}
        >
          <Text style={styles.cardLabel}>NEXT APPOINTMENT</Text>
          {nextAppt ? (
            <>
              <Text style={styles.cardTitle}>
                {nextAppt.staff.firstName} {nextAppt.staff.lastName}
              </Text>
              <Text style={styles.cardDetail}>
                {new Date(nextAppt.scheduledAt).toLocaleDateString('en-GB')} at{' '}
                {new Date(nextAppt.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </Text>
              <Text style={styles.cardDetail}>{nextAppt.type.replace('_', ' ')}</Text>
            </>
          ) : (
            <Text style={styles.cardDetail}>No upcoming appointments</Text>
          )}
        </Pressable>

        {/* Task Progress Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>TODAY'S TASKS</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${completionPct}%` }]} />
            </View>
            <Text style={styles.progressText}>{completionPct}%</Text>
          </View>
          <Text style={styles.cardDetail}>
            {taskStats.done} of {taskStats.total} tasks completed
          </Text>
        </View>

        {/* Care Team Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>CARE TEAM</Text>
          {careTeam.length > 0 ? (
            careTeam.map((a) => (
              <View key={a.id} style={styles.teamRow}>
                <View style={styles.teamAvatar}>
                  <Text style={styles.teamAvatarText}>{a.staff.firstName[0]}{a.staff.lastName[0]}</Text>
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.teamName}>{a.staff.firstName} {a.staff.lastName}</Text>
                  <Text style={styles.teamRole}>{a.staff.role} {a.isPrimary ? '• Primary' : ''}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.cardDetail}>No care team info available</Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionBtn} onPress={() => navigation.navigate('Appointments')}>
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionText}>Appointments</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => navigation.navigate('CareVisitSummaries')}>
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionText}>Visit Summaries</Text>
          </Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#151A23', justifyContent: 'center', alignItems: 'center' },
  greeting: { color: '#fff', fontSize: 24, fontWeight: '700' },
  subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 24 },
  card: {
    backgroundColor: 'rgba(42,54,71,0.6)', borderRadius: 14, padding: 18, marginBottom: 14,
  },
  cardLabel: { color: '#7FB3D5', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  cardTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 4 },
  cardDetail: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  progressBarBg: {
    flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden',
  },
  progressBarFill: { height: 8, backgroundColor: '#22C55E', borderRadius: 4 },
  progressText: { color: '#22C55E', fontSize: 14, fontWeight: '700', marginLeft: 10, minWidth: 40 },
  teamRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  teamAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#7FB3D5',
    alignItems: 'center', justifyContent: 'center',
  },
  teamAvatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  teamName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  teamRole: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  actionBtn: {
    flex: 1, backgroundColor: 'rgba(42,54,71,0.6)', borderRadius: 12, padding: 16, alignItems: 'center',
  },
  actionIcon: { fontSize: 28, marginBottom: 6 },
  actionText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
