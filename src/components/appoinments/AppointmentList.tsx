//src/components/appointments/AppointmentList.tsx
import React from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
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
    <View style={{ padding: 12, borderTopWidth: 1, borderColor: '#eee', flex: 1 }}>
      <Text style={{ fontWeight: '600', marginBottom: 8 }}>Appointments</Text>
      <FlatList
        data={appointments}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={<Text style={{ opacity: 0.6 }}>No appointments</Text>}
        renderItem={({ item }) => (
          <Pressable style={{ paddingVertical: 10 }} onPress={() => onSelect(item)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontWeight: '700' }}>{item.title}</Text>
              <StatusBadge status={item.status ?? 'scheduled'} />
            </View>
            <Text>
              {new Date(item.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {item.location ? `  ·  ${item.location}` : ''}
            </Text>
            {(() => {
              const doc = item.assignedStaff?.find(s => s.role === 'doctor');
              return doc ? (
                <Text style={{ opacity: 0.8 }}>Doctor: {doc.name}{doc.phone ? `  ·  ${doc.phone}` : ''}</Text>
              ) : null;
            })()}
          </Pressable>
        )}
      />
    </View>
  );
}
