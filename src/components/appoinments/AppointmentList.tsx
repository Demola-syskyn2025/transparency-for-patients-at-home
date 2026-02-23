//src/components/appointments/AppointmentList.tsx

import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Appointment } from '../../utils/types';
import StatusBadge from './StatusBadge';

export default function AppointmentList({
  appointments,
  onSelect,
}: {
  appointments: Appointment[];
  onSelect: (a: Appointment) => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Details</Text>
      <FlatList
        data={appointments}
        keyExtractor={(i) => i.id}
        scrollEnabled={false}
        ListEmptyComponent={<Text style={styles.emptyText}>No appointments</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.itemContainer} onPress={() => onSelect(item)}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <StatusBadge status={item.status ?? 'scheduled'} />
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Time:</Text>
              <Text style={styles.value}>
                {new Date(item.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>

            {item.location && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Location:</Text>
                <Text style={styles.value}>{item.location}</Text>
              </View>
            )}

            {(() => {
              const doc = item.assignedStaff?.find(s => s.role === 'doctor');
              return doc ? (
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Doctor:</Text>
                  <Text style={styles.value}>{doc.name}</Text>
                </View>
              ) : null;
            })()}

            {item.notes && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Notes:</Text>
                <Text style={styles.value}>{item.notes}</Text>
              </View>
            )}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 12,
  },
  title: {
    color: '#7FB3D5',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  itemContainer: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingVertical: 4,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
});

