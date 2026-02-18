//src/components/appointments/StatusBadge.tsx
import React from 'react';
import { Text, View } from 'react-native';

const STATUS_MAP: Record<string, { bg: string; fg: string; label: string }> = {
  SCHEDULED:   { bg: 'rgba(127,179,213,0.2)', fg: '#7FB3D5', label: 'Scheduled' },
  CONFIRMED:   { bg: 'rgba(34,197,94,0.2)',   fg: '#22C55E', label: 'Confirmed' },
  IN_PROGRESS: { bg: 'rgba(245,158,11,0.2)',  fg: '#F59E0B', label: 'In Progress' },
  COMPLETED:   { bg: 'rgba(34,197,94,0.2)',    fg: '#22C55E', label: 'Completed' },
  CANCELLED:   { bg: 'rgba(239,68,68,0.2)',    fg: '#EF4444', label: 'Cancelled' },
  RESCHEDULED: { bg: 'rgba(168,85,247,0.2)',   fg: '#A855F7', label: 'Rescheduled' },
  DELAYED:     { bg: 'rgba(245,158,11,0.2)',   fg: '#F59E0B', label: 'Delayed' },
};

const FALLBACK = { bg: 'rgba(255,255,255,0.1)', fg: 'rgba(255,255,255,0.6)', label: 'Unknown' };

export default function StatusBadge({ status = 'SCHEDULED' }: { status?: string }) {
  const key = (status ?? 'SCHEDULED').toUpperCase().replace(/[- ]/g, '_');
  const s = STATUS_MAP[key] ?? FALLBACK;
  return (
    <View style={{
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      alignSelf: 'flex-start',
      backgroundColor: s.bg,
    }}>
      <Text style={{ color: s.fg, fontSize: 11, fontWeight: '700' }}>{s.label}</Text>
    </View>
  );
}
