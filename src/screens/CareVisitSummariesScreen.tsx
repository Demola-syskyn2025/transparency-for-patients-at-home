// src/screens/CareVisitSummariesScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { VisitSummary, VisitSummaryService } from '../services/visitSummaries';

export default function CareVisitSummariesScreen({
  patientId,
  service,
}: {
  patientId: string;
  service: VisitSummaryService;
}) {
  const navigation = useNavigation<any>();
  const [summaries, setSummaries] = useState<VisitSummary[]>([]);

  useEffect(() => {
    service.listByPatient(patientId).then(setSummaries).catch(() => {});
  }, [patientId]);

  const renderItem = ({ item }: { item: VisitSummary }) => (
    <Pressable
      style={styles.card}
      onPress={() => navigation.navigate('HomecareVisitSummary', { summaryId: item.id, apptId: item.apptId })}
    >
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.date}>{new Date(item.issuedAt).toLocaleDateString('en-GB')}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={summaries}
        keyExtractor={(s) => s.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>No visit summaries yet</Text>}
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
  date: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  empty: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 40 },
});
