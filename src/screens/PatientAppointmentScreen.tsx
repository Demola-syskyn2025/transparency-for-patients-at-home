// src/screens/PatientAppointmentScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import type { Appointment } from '../utils/types';
import type { AppointmentService } from '../services/appointments';
import AppointmentDetailScreen from './AppointmentDetailScreen';

export default function PatientAppointmentScreen({
  service,
  patientId,
}: {
  service: AppointmentService;
  patientId: string;
}) {
  const [items, setItems] = useState<Appointment[] | null>(null);

  useEffect(() => {
    let alive = true;
    service.listByPatient(patientId).then(rows => { if (alive) setItems(rows); });
    return () => { alive = false; };
  }, [patientId, service]);

  const nextAppt = useMemo(() => {
    if (!items) return undefined;
    const now = new Date();
    return [...items]
      .filter(a => new Date(a.startAt) >= now)
      .sort((a,b)=> new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];
  }, [items]);

  if (items === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Loading appointments…</Text>
      </View>
    );
  }

  if (!nextAppt) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>No upcoming appointments</Text>
      </View>
    );
  }

  // Reuse the detail screen by providing the same props it expects
  return (
    <AppointmentDetailScreen
      // @ts-ignore reuse component by providing a compatible route prop
      route={{ params: { apptId: nextAppt.id } }}
      service={service}
      patientId={patientId}
    />
  );
}
