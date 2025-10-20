//src/screens/HomeScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { Appointment } from '../utils/types';
import type { AppointmentService } from '../services/appointments';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen({ role, patientId, service }: { role: 'patient'|'family', patientId: string, service: AppointmentService }) {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<Appointment[]>([]);

  useEffect(() => {
    let alive = true;
    service.listByPatient(patientId).then(rows => { if (alive) setItems(rows); });
    return () => { alive = false; };
  }, [patientId, service]);

  const nextAppt = useMemo(() => {
    const now = new Date();
    return [...items]
      .filter(a => new Date(a.startAt) >= now)
      .sort((a,b)=> new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];
  }, [items]);

  function openNext() {
    if (!nextAppt) return;
    navigation.navigate('AppointmentDetail', { apptId: nextAppt.id });
  }

  return (
    <View style={{flex:1, alignItems:'center', justifyContent:'center', padding: 16}}>
      <Text style={{ marginBottom: 8 }}>Role: {role}</Text>
      <Text style={{ marginBottom: 16 }}>Patient: {patientId}</Text>

      {role === 'patient' ? (
        nextAppt ? (
          <Pressable onPress={openNext} style={{ backgroundColor: '#111', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 }}>
            <Text style={{ color:'#fff', fontWeight:'600' }}>View next appointment</Text>
          </Pressable>
        ) : (
          <Text style={{ opacity: 0.8 }}>No upcoming appointments</Text>
        )
      ) : null}
    </View>
  );
}
