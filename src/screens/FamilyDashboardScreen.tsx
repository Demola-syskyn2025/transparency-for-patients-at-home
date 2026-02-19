// src/screens/FamilyDashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../config/api';
import type { CareAssignmentDto, AppointmentDto } from '../utils/apiTypes';

export default function FamilyDashboardScreen({ userId }: { userId: string }) {
  const navigation = useNavigation<any>();
  const [patients, setPatients] = useState<CareAssignmentDto[]>([]);
  const [upcomingAppts, setUpcomingAppts] = useState<AppointmentDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<CareAssignmentDto[]>(`/care-assignments/patient/${userId}`);
        setPatients(res.data);
      } catch {
        // handle silently
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

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
        data={[]}
        renderItem={null}
        contentContainerStyle={{ padding: 20, paddingTop: 60 }}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Family Dashboard</Text>
            <Text style={styles.subtitle}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>

            <Text style={styles.sectionTitle}>Linked Patients</Text>
            {patients.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No linked patients</Text>
              </View>
            ) : (
              patients.map((a) => (
                <Pressable
                  key={a.id}
                  style={styles.card}
                  onPress={() =>
                    navigation.navigate('PatientOverview', {
                      patientId: String(a.patient.id),
                      patientName: `${a.patient.firstName} ${a.patient.lastName}`,
                    })
                  }
                >
                  <Text style={styles.cardTitle}>
                    {a.patient.firstName} {a.patient.lastName}
                  </Text>
                  <Text style={styles.cardSub}>{a.patient.email}</Text>
                </Pressable>
              ))
            )}
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151A23' },
  center: { flex: 1, backgroundColor: '#151A23', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 24 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  card: {
    backgroundColor: 'rgba(42,54,71,0.6)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cardSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 },
  emptyCard: {
    backgroundColor: 'rgba(42,54,71,0.3)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
});
