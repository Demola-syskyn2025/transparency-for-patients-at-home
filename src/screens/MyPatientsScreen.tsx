// src/screens/MyPatientsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
    <View style={styles.container}>
      <FlatList
        data={assignments}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.empty}>
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
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.patient.firstName[0]}{item.patient.lastName[0]}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.name}>
                  {item.patient.firstName} {item.patient.lastName}
                </Text>
                <Text style={styles.sub}>{item.patient.email}</Text>
                {item.isPrimary && <Text style={styles.primary}>Primary</Text>}
              </View>
              <Text style={styles.arrow}>›</Text>
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
  card: {
    backgroundColor: 'rgba(42,54,71,0.6)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(127,179,213,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#7FB3D5', fontWeight: '700', fontSize: 16 },
  name: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sub: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  primary: { color: '#22C55E', fontSize: 11, fontWeight: '700', marginTop: 2 },
  arrow: { color: 'rgba(255,255,255,0.3)', fontSize: 24 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
});
