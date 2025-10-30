import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import type { VisitSummary } from '../services/visitSummaries';
import type { VisitSummaryService } from '../services/visitSummaries';

export default function CareVisitSummariesScreen({
  patientId,
  service,
}: {
  patientId: string;
  service: VisitSummaryService;
}) {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<VisitSummary[]>([]);

  useEffect(() => {
    let alive = true;
    service.listByPatient(patientId).then((rows) => { if (alive) setItems(rows); });
    return () => { alive = false; };
  }, [patientId, service]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>HOMECARE VISIT SUMMARIES</Text>
        <View style={styles.backButton} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No summaries</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => navigation.navigate('HomecareVisitSummary', { apptId: item.apptId })}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.sub}>{new Date(item.issuedAt).toLocaleString()}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161B24',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  item: {
    backgroundColor: 'rgba(42, 54, 71, 0.6)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  sub: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 20,
  },
});
