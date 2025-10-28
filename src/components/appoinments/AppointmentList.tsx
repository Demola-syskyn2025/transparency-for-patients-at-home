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
      <Text style={styles.title}>Appointments</Text>
      <FlatList
        data={appointments}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No appointments</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.appointmentItem} onPress={() => onSelect(item)}>
            <View style={styles.appointmentHeader}>
              <Text style={styles.appointmentTitle}>{item.title}</Text>
              <StatusBadge status={item.status ?? 'scheduled'} />
            </View>
            <Text style={styles.appointmentTime}>
              {new Date(item.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {item.location ? `  ·  ${item.location}` : ''}
            </Text>
            {(() => {
              const doc = item.assignedStaff?.find(s => s.role === 'doctor');
              return doc ? (
                <Text style={styles.appointmentDoctor}>Doctor: {doc.name}{doc.phone ? `  ·  ${doc.phone}` : ''}</Text>
              ) : null;
            })()}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flex: 1,
  },
  title: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#7FB3D5',
    fontSize: 16,
  },
  emptyText: {
    opacity: 0.6,
    color: '#fff',
  },
  appointmentItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  appointmentTitle: {
    fontWeight: '700',
    color: '#fff',
    fontSize: 16,
  },
  appointmentTime: {
    color: '#fff',
    opacity: 0.8,
    fontSize: 14,
  },
  appointmentDoctor: {
    opacity: 0.8,
    color: '#fff',
    fontSize: 14,
    marginTop: 2,
  },
});
