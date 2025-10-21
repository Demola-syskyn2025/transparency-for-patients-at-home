// src/screens/PatientAppointmentScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import type { Appointment } from '../utils/types';
import type { AppointmentService } from '../services/appointments';
import AppointmentDetailScreen from './AppointmentDetailScreen';

export default function PatientAppointmentScreen({
  patientId,
  service,
}: {
  patientId: string;
  service: AppointmentService;
}) {
  const [items, setItems] = useState<Appointment[] | null>(null);

  useEffect(() => {
    let alive = true;
    service.listByPatient(patientId).then(rows => { if (alive) setItems(rows); });
    return () => { alive = false; };
  }, [patientId, service]);

  const nextAppt = useMemo(() => {
    if (!items) return null;
    const now = new Date();
    return [...items]
      .filter(a => new Date(a.startAt) >= now)
      .sort((a,b)=> new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0] || null;
  }, [items]);

  if (items === null) {
    return (
      <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading appointments…</Text>
      </View>
    );
  }

  if (!nextAppt) {
    return (
      <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding: 16 }}>
        <Text style={{ fontSize: 16 }}>No upcoming appointments</Text>
      </View>
    );
  }

  return (
    <AppointmentDetailScreen
      route={{ params: { apptId: nextAppt.id } }}
      service={service}
      patientId={patientId}
    />
  );
}
