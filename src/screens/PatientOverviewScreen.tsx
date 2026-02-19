// src/screens/PatientOverviewScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../config/api';
import type { AppointmentDto } from '../utils/apiTypes';

export default function PatientOverviewScreen({ route }: { route: any }) {
  const { patientId } = route.params;
  const navigation = useNavigation<any>();
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<AppointmentDto[]>(`/appointments/patient/${patientId}`);
        setAppointments(
          res.data.sort(
            (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
          )
        );
      } catch {
        // handle silently
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7FB3D5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={appointments}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>Appointments</Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No appointments found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('AppointmentDetail', { apptId: String(item.id) })}
          >
            <View style={styles.row}>
              <View style={styles.dateBadge}>
                <Text style={styles.dateText}>
                  {new Date(item.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </Text>
                <Text style={styles.timeText}>
                  {new Date(item.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.cardTitle}>{item.type.replace(/_/g, ' ')}</Text>
                <Text style={styles.cardSub}>
                  {item.estimatedDurationMinutes} min • {item.staff.firstName} {item.staff.lastName}
                </Text>
                {item.notes && <Text style={styles.cardNotes}>{item.notes}</Text>}
              </View>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      item.status === 'COMPLETED'
                        ? '#22C55E'
                        : item.status === 'CANCELLED'
                        ? '#EF4444'
                        : '#7FB3D5',
                  },
                ]}
              />
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151A23' },
  center: { flex: 1, backgroundColor: '#151A23', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  card: {
    backgroundColor: 'rgba(42,54,71,0.6)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  dateBadge: {
    backgroundColor: 'rgba(127,179,213,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  dateText: { color: '#7FB3D5', fontSize: 12, fontWeight: '700' },
  timeText: { color: 'rgba(127,179,213,0.8)', fontSize: 11, marginTop: 2 },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cardSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 },
  cardNotes: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
});
