import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import type { Appointment } from '../utils/types';
import type { AppointmentService } from '../services/appointments';
import StatusBadge from '../components/appoinments/StatusBadge';

export default function AppointmentHistoryScreen({
  patientId,
  service,
}: {
  patientId: string;
  service: AppointmentService;
}) {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<Appointment[]>([]);

  useEffect(() => {
    let alive = true;
    service.listByPatient(patientId).then(rows => { if (alive) setItems(rows); });
    return () => { alive = false; };
  }, [patientId, service]);

  const historyItems = useMemo(() => {
    const now = new Date();
    return [...items]
      .filter(it => new Date(it.startAt) < now || it.status === 'cancelled')
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }, [items]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{"<"}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>APPOINTMENT HISTORY</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        <FlatList
          data={historyItems}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 12 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No past appointments</Text>}
          renderItem={({ item }) => (
            <Pressable style={styles.item} onPress={() => navigation.navigate('AppointmentDetail', { apptId: item.id })}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <StatusBadge status={item.status ?? 'scheduled'} />
              </View>
              <Text style={styles.itemSub}>
                {new Date(item.startAt).toLocaleDateString('en-GB')}  ·  {new Date(item.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {item.location ? `  ·  ${item.location}` : ''}
              </Text>
              {(() => {
                const doc = item.assignedStaff?.find(s => s.role === 'doctor');
                return doc ? (
                  <Text style={styles.itemDoc}>Doctor: {doc.name}{doc.phone ? `  ·  ${doc.phone}` : ''}</Text>
                ) : null;
              })()}
            </Pressable>
          )}
        />
      </View>
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
  content: {
    flex: 1,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 24,
  },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  itemSub: {
    color: '#fff',
    opacity: 0.85,
    fontSize: 14,
  },
  itemDoc: {
    color: '#fff',
    opacity: 0.8,
    fontSize: 14,
    marginTop: 2,
  },
});
