//src/components/appointments/AppointmentList.tsx
import React from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
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
      <Text style={styles.heading}>Appointments</Text>
      <FlatList
        data={appointments}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 12 }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No appointments for this day</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => onSelect(item)}>
            <View style={styles.cardTop}>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              <StatusBadge status={item.status ?? 'SCHEDULED'} />
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.time}>
                {new Date(item.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {item.location ? (
                <Text style={styles.location}>📍 {item.location}</Text>
              ) : null}
            </View>
            {(() => {
              const staff = item.assignedStaff?.[0];
              return staff ? (
                <Text style={styles.staffText}>{staff.name} · {staff.role}</Text>
              ) : null;
            })()}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 12, paddingTop: 12 },
  heading: { color: '#7FB3D5', fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' },
  emptyBox: { padding: 20, alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  card: {
    backgroundColor: 'rgba(42,54,71,0.6)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1, marginRight: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  time: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  location: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  staffText: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 4, textTransform: 'capitalize' },
});
