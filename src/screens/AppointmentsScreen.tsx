//src/screens/AppointmentsScreen.tsx
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { AppointmentService } from '../services/appointments';
import type { Appointment } from '../utils/types';

import AppointmentList from '../components/appoinments/AppointmentList';
import CalendarGrid from '../components/appoinments/CalendarGrid';
import CalendarHeader from '../components/appoinments/CalendarHeader';

type Role = 'patient' | 'family';

function sameYMD(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}


const AppointmentIcon = () => (
  <View style={styles.appointmentIconContainer}>
    <View style={styles.appointmentIconDocument}>
      <View style={styles.appointmentIconLine1} />
      <View style={styles.appointmentIconLine2} />
    </View>
    <View style={styles.appointmentIconClock}>
      <View style={styles.appointmentIconClockHand} />
    </View>
  </View>
);

export default function AppointmentsScreen({
  role,
  patientId,
  service,
}: {
  role: Role;
  patientId: string;
  service: AppointmentService;
  uid: string;
}) {
  const [items, setItems] = useState<Appointment[]>([]);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [cursor, setCursor] = useState<Date>(new Date());     // ng├áy ─æang xem
  const navigation = useNavigation<any>();

  // Load data
  useEffect(() => {
    let alive = true;
    service.listByPatient(patientId).then(rows => { if (alive) setItems(rows); });
    return () => { alive = false; };
  }, [patientId, service]);

  // ─Éß║┐m sß╗æ appointment theo ng├áy (─æß╗â hiß╗ân thß╗ï count tr├¬n calendar)
  const countByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) {
      const k = new Date(it.startAt).toDateString();
      m.set(k, (m.get(k) || 0) + 1);
    }
    return m;
  }, [items]);

  const todaysAppointments = items.filter(it => sameYMD(new Date(it.startAt), cursor));

  if (role !== 'family') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#6294A1', '#151A23']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          locations={[0, 0.29]}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <CalendarHeader viewMode={viewMode} setViewMode={setViewMode} cursor={cursor} setCursor={setCursor} />
            <CalendarGrid viewMode={viewMode} cursor={cursor} setCursor={setCursor} countByDay={countByDay} />
            <AppointmentList
              appointments={todaysAppointments}
              onSelect={(a) => navigation.navigate('AppointmentDetail', { apptId: a.id })}
            />
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6294A1', '#151A23']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 0.29]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <CalendarHeader viewMode={viewMode} setViewMode={setViewMode} cursor={cursor} setCursor={setCursor} />
          <CalendarGrid viewMode={viewMode} cursor={cursor} setCursor={setCursor} countByDay={countByDay} />
          <AppointmentList
            appointments={todaysAppointments}
            onSelect={(a) => navigation.navigate('AppointmentDetail', { apptId: a.id })}
          />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161B24',
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  // Appointment Icon Styles
  appointmentIconContainer: {
    position: 'absolute',
    bottom: -2,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentIconDocument: {
    position: 'absolute',
    width: 13,
    height: 15,
    backgroundColor: '#fff',
    borderRadius: 1.5,
    justifyContent: 'center',
    paddingHorizontal: 2.5,
    paddingVertical: 3,
    borderWidth: 1.5,
    borderColor: '#2C3E50',
  },
  appointmentIconLine1: {
    width: 8,
    height: 1.5,
    backgroundColor: '#7FB3D5',
    marginBottom: 2,
    borderRadius: 0.5,
  },
  appointmentIconLine2: {
    width: 5,
    height: 1.5,
    backgroundColor: '#7FB3D5',
    borderRadius: 0.5,
  },
  appointmentIconClock: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#2C3E50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentIconClockHand: {
    position: 'absolute',
    width: 1.5,
    height: 4,
    backgroundColor: '#7FB3D5',
    top: 2,
    borderRadius: 0.5,
  },
});
