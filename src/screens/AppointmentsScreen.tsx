//src/screens/AppointmentsScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import type { Appointment } from '../utils/types';
import type { AppointmentService } from '../services/appointments';
import { useNavigation } from '@react-navigation/native';

import CalendarHeader from '../components/appoinments/CalendarHeader';
import CalendarGrid from '../components/appoinments/CalendarGrid';
import AppointmentList from '../components/appoinments/AppointmentList';
// Bottom sheet replaced with full-screen detail navigation

type Role = 'patient' | 'family';

function sameYMD(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

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
  const [cursor, setCursor] = useState<Date>(new Date());     // ngày đang xem
  const navigation = useNavigation<any>();

  // Load data
  useEffect(() => {
    let alive = true;
    service.listByPatient(patientId).then(rows => { if (alive) setItems(rows); });
    return () => { alive = false; };
  }, [patientId, service]);

  // Đếm số appointment theo ngày (để hiển thị count trên calendar)
  const countByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) {
      const k = new Date(it.startAt).toDateString();
      m.set(k, (m.get(k) || 0) + 1);
    }
    return m;
  }, [items]);

  if (role !== 'family') {
    return (
      <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
        <Text>Patient appointments (placeholder)</Text>
      </View>
    );
  }

  const todaysAppointments = items.filter(it => sameYMD(new Date(it.startAt), cursor));

  return (
    <View style={{ flex: 1 }}>
      <CalendarHeader viewMode={viewMode} setViewMode={setViewMode} cursor={cursor} setCursor={setCursor} />
      <CalendarGrid viewMode={viewMode} cursor={cursor} setCursor={setCursor} countByDay={countByDay} />
      <AppointmentList
        appointments={todaysAppointments}
        onSelect={(a) => navigation.navigate('AppointmentDetail', { apptId: a.id })}
      />
    </View>
  );
}
