// src/screens/PatientAppointmentScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { AppointmentService } from '../services/appointments';
import type { Appointment } from '../utils/types';

export default function PatientAppointmentScreen({
  patientId,
  service,
}: {
  patientId: string;
  service: AppointmentService;
}) {
  const navigation = useNavigation<any>();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    service.listByPatient(patientId).then((list) => {
      const upcoming = list
        .filter((a) => a.status !== 'completed' && a.status !== 'cancelled')
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
      setAppointments(upcoming);
    }).catch(() => {});
  }, [patientId]);

  const renderItem = ({ item }: { item: Appointment }) => (
    <Pressable
      style={styles.card}
      onPress={() => navigation.navigate('AppointmentDetail', { apptId: item.id })}
    >
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.detail}>
        {new Date(item.startAt).toLocaleDateString('en-GB')} –{' '}
        {new Date(item.startAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
      </Text>
      {item.location && <Text style={styles.location}>{item.location}</Text>}
      <Text style={styles.status}>{item.status ?? 'scheduled'}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={appointments}
        keyExtractor={(a) => a.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>No upcoming appointments</Text>}
      />

      <Pressable
        style={styles.historyBtn}
        onPress={() => navigation.navigate('AppointmentHistory')}
      >
        <Text style={styles.historyText}>View Appointment History</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151A23' },
  card: {
    backgroundColor: 'rgba(42,54,71,0.6)', borderRadius: 12, padding: 16, marginBottom: 12,
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  detail: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  location: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 },
  status: { color: '#7FB3D5', fontSize: 12, marginTop: 6, textTransform: 'capitalize' },
  empty: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 40 },
  historyBtn: {
    margin: 16, padding: 14, borderRadius: 12,
    backgroundColor: 'rgba(42,54,71,0.6)', alignItems: 'center',
  },
  historyText: { color: '#7FB3D5', fontSize: 15, fontWeight: '600' },
});
