// src/screens/AppointmentHistoryScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { AppointmentService } from '../services/appointments';
import type { Appointment } from '../utils/types';

export default function AppointmentHistoryScreen({
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
      const past = list
        .filter((a) => a.status === 'completed' || new Date(a.startAt) < new Date())
        .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
      setAppointments(past);
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
      <Text style={styles.status}>{item.status ?? 'completed'}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={appointments}
        keyExtractor={(a) => a.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>No past appointments</Text>}
      />
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
  status: { color: '#7FB3D5', fontSize: 12, marginTop: 6, textTransform: 'capitalize' },
  empty: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 40 },
});
