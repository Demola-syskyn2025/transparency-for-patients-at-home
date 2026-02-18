// src/screens/MyPatientsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { careAssignmentApi } from '../services/careAssignmentApi';
import type { CareAssignmentDto } from '../utils/apiTypes';

export default function MyPatientsScreen({ staffId }: { staffId: string }) {
  const navigation = useNavigation<any>();
  const [assignments, setAssignments] = useState<CareAssignmentDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    careAssignmentApi
      .getByStaff(staffId)
      .then(setAssignments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [staffId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7FB3D5" />
      </View>
    );
  }

  const renderItem = ({ item }: { item: CareAssignmentDto }) => (
    <Pressable
      style={styles.card}
      onPress={() => navigation.navigate('PatientOverview', { patientId: String(item.patient.id), patientName: `${item.patient.firstName} ${item.patient.lastName}` })}
    >
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.patient.firstName[0]}{item.patient.lastName[0]}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.name}>{item.patient.firstName} {item.patient.lastName}</Text>
          <Text style={styles.detail}>{item.patient.email}</Text>
          <Text style={styles.detail}>{item.patient.phoneNumber}</Text>
        </View>
        {item.isPrimary && (
          <View style={styles.primaryBadge}>
            <Text style={styles.primaryText}>Primary</Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={assignments}
        keyExtractor={(a) => String(a.id)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>No patients assigned</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151A23' },
  center: { flex: 1, backgroundColor: '#151A23', justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: 'rgba(42,54,71,0.6)', borderRadius: 12, padding: 14, marginBottom: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#7FB3D5',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  name: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 2 },
  detail: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  primaryBadge: {
    backgroundColor: 'rgba(34,197,94,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  primaryText: { color: '#22C55E', fontSize: 11, fontWeight: '700' },
  empty: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 40 },
});
