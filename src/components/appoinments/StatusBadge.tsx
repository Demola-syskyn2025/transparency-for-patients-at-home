//src/components/appointments/StatusBadge.tsx
import React from 'react';
import { Text, View } from 'react-native';
import type { AppointmentStatus } from '../../utils/types';

const stylesByStatus: Record<AppointmentStatus, {bg: string; fg: string; label: string}> = {
  scheduled:  { bg: '#E6F4FE', fg: '#093B63', label: 'Scheduled' },
  delayed:    { bg: '#FFF4E5', fg: '#6B3A00', label: 'Delayed' },
  rescheduled:{ bg: '#F3E8FF', fg: '#4B1D95', label: 'Rescheduled' },
  completed:  { bg: '#E7F6EC', fg: '#0B3D2E', label: 'Completed' },
  cancelled:  { bg: '#FDE8E8', fg: '#7A0A0A', label: 'Cancelled' },
};

export default function StatusBadge({ status = 'scheduled' as AppointmentStatus }) {
  const s = stylesByStatus[status];
  return (
    <View style={{
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      alignSelf: 'flex-start',
      backgroundColor: s.bg,
    }}>
      <Text style={{ color: s.fg, fontSize: 12, fontWeight: '600' }}>{s.label}</Text>
    </View>
  );
}
