//src/screens/HomeScreen.tsx
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import type { AppointmentService } from '../services/appointments';
import type { ChecklistService } from '../services/checklist';
import type { ChecklistItem } from '../utils/checklist';
import type { Appointment } from '../utils/types';

export default function HomeScreen({
  role,
  patientId,
  appointmentService,
  checklistService,
}: {
  role: 'patient' | 'family';
  patientId: string;
  appointmentService: AppointmentService;
  checklistService: ChecklistService;
}) {
  const navigation = useNavigation<any>();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    appointmentService.listByPatient(patientId).then(setAppointments).catch(() => {});
    checklistService.listByPatient(patientId).then(setChecklistItems).catch(() => {});
  }, [patientId]);

  const nextAppointment = useMemo(() => {
    const now = new Date();
    return [...appointments]
      .filter(a => new Date(a.startAt) >= now)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];
  }, [appointments]);

  const todaysTasks = useMemo(() => {
    const today = new Date();
    return checklistItems.filter(item => {
      const dueDate = new Date(item.dueAt);
      return dueDate.toDateString() === today.toDateString() && !item.done;
    }).slice(0, 3);
  }, [checklistItems]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#6294A1', '#151A23']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 0.29]}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
          {/* Reminder Card */}
          <View style={styles.reminderCard}>
            <View style={styles.reminderHeader}>
              <Text style={styles.reminderHeaderTitle}>REMINDER</Text>
            </View>
            <View style={styles.reminderContent}>
              {nextAppointment ? (
                <Text style={styles.reminderTitle}>
                  Appointment with {nextAppointment.assignedStaff?.[0]?.name || 'Staff'}{' '}
                  {new Date(nextAppointment.startAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </Text>
              ) : todaysTasks.length > 0 ? (
                <View style={styles.reminderTasks}>
                  <Text style={styles.reminderTitle}>Today's Tasks</Text>
                  {todaysTasks.map((task) => (
                    <Text key={task.id} style={styles.reminderTask}>{task.text}</Text>
                  ))}
                </View>
              ) : (
                <Text style={styles.reminderTitle}>No reminders for today</Text>
              )}
            </View>
          </View>

          {/* Appointment Card */}
          <Pressable style={styles.card} onPress={() => {
            if (role === 'patient') navigation.navigate('PatientAppointment');
            else navigation.navigate('Appointments');
          }}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Appointment</Text>
              {nextAppointment ? (
                <>
                  <Text style={styles.cardDetail}>
                    Doctor: <Text style={styles.cardDetailBold}>{nextAppointment.assignedStaff?.[0]?.name || 'N/A'}</Text>
                  </Text>
                  <Text style={styles.cardDetail}>
                    Date: <Text style={styles.cardDetailBold}>{new Date(nextAppointment.startAt).toLocaleDateString('en-GB')}</Text>
                  </Text>
                  <Text style={styles.cardDetail}>
                    Time: <Text style={styles.cardDetailBold}>{new Date(nextAppointment.startAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</Text>
                  </Text>
                </>
              ) : (
                <Text style={styles.cardDetail}>No upcoming appointments</Text>
              )}
            </View>
            <Text style={styles.arrowText}>››</Text>
          </Pressable>

          {/* Checklist Card */}
          <Pressable style={styles.card} onPress={() => navigation.navigate('Checklist')}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Checklist</Text>
              {todaysTasks.length > 0 ? (
                todaysTasks.map((task) => (
                  <Text key={task.id} style={styles.cardDetail}>• {task.text}</Text>
                ))
              ) : (
                <Text style={styles.cardDetail}>All tasks completed!</Text>
              )}
            </View>
            <Text style={styles.arrowText}>››</Text>
          </Pressable>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollView: { flex: 1 },
  reminderCard: {
    marginHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 40,
    marginBottom: 30,
    backgroundColor: 'rgba(42, 54, 71, 0.8)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  reminderHeader: {
    backgroundColor: '#141F33',
    paddingVertical: 12,
    alignItems: 'center',
  },
  reminderHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 2 },
  reminderContent: { padding: 20, alignItems: 'center' },
  reminderTitle: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 12, textAlign: 'center' },
  reminderTasks: { marginTop: 8, width: '100%', alignItems: 'center' },
  reminderTask: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', marginBottom: 6, textAlign: 'center' },
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(42, 54, 71, 0.6)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  cardDetail: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 4 },
  cardDetailBold: { fontWeight: '600', color: '#fff' },
  arrowText: { fontSize: 24, color: '#7FB3D5', fontWeight: '600', marginLeft: 12 },
});
