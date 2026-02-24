// src/screens/MyPatientsScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import api from '../config/api';
import type { CareAssignmentDto } from '../utils/apiTypes';

export default function MyPatientsScreen({ staffId }: { staffId: string }) {
  const navigation = useNavigation<any>();
  const [assignments, setAssignments] = useState<CareAssignmentDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<CareAssignmentDto[]>(`/care-assignments/staff/${staffId}`);
        setAssignments(res.data);
      } catch {
        // handle silently
      } finally {
        setLoading(false);
      }
    })();
  }, [staffId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7FB3D5" />
      </View>
    );
  }

  return (
    <LinearGradient colors={['#6294A1', '#151A23']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} locations={[0, 0.29]} style={{ flex: 1 }}>
      <FlatList
        data={assignments}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 20, paddingTop: 60 }}
        ListHeaderComponent={
          <>
            <Text style={styles.greeting}>My Patients</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={48} color="rgba(255,255,255,0.4)" />
            <Text style={styles.emptyText}>No patients assigned</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate('PatientOverview', {
                patientId: String(item.patient.id),
                patientName: `${item.patient.firstName} ${item.patient.lastName}`,
              })
            }
          >
            <View style={styles.cardRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.patient.firstName[0]}{item.patient.lastName[0]}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.cardTitle}>
                  {item.patient.firstName} {item.patient.lastName}
                </Text>
                <Text style={styles.cardSub}>{item.patient.email}</Text>
                {item.isPrimary && <Text style={[styles.cardSub, { color: '#7FB3D5' }]}>Primary Caregiver</Text>}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#7FB3D5" />
            </View>
          </Pressable>
        )}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#151A23', justifyContent: 'center', alignItems: 'center' },
  greeting: { color: '#fff', fontSize: 24, fontWeight: '700' },
  date: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 24 },
  card: {
    backgroundColor: 'rgba(42,54,71,0.6)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(127,179,213,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#7FB3D5', fontWeight: '700', fontSize: 16 },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  cardSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  emptyCard: { padding: 40, alignItems: 'center', marginTop: 40 },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 16 },
});
