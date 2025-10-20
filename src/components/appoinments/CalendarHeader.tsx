//src/components/appointments/CalendarHeader.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';

export default function CalendarHeader({
  viewMode,
  setViewMode,
  cursor,
  setCursor,
}: {
  viewMode: 'week' | 'month';
  setViewMode: (m: 'week' | 'month') => void;
  cursor: Date;
  setCursor: (d: Date) => void;
}) {
  function shift(days: number) {
    const x = new Date(cursor);
    x.setDate(x.getDate() + days);
    setCursor(x);
  }

  return (
    <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>Appointments</Text>

      {/* Toggle Week/Month */}
      <View style={{ flexDirection: 'row', marginTop: 10 }}>
        <Pressable
          onPress={() => setViewMode('week')}
          style={{
            paddingVertical: 6, paddingHorizontal: 12,
            borderWidth: 1, borderColor: viewMode === 'week' ? '#333' : '#ccc',
            backgroundColor: viewMode === 'week' ? '#eee' : 'transparent',
            borderTopLeftRadius: 8, borderBottomLeftRadius: 8, marginRight: 1
          }}
        >
          <Text>Week</Text>
        </Pressable>
        <Pressable
          onPress={() => setViewMode('month')}
          style={{
            paddingVertical: 6, paddingHorizontal: 12,
            borderWidth: 1, borderColor: viewMode === 'month' ? '#333' : '#ccc',
            backgroundColor: viewMode === 'month' ? '#eee' : 'transparent',
            borderTopRightRadius: 8, borderBottomRightRadius: 8
          }}
        >
          <Text>Month</Text>
        </Pressable>
      </View>

      {/* Prev / Next */}
      <View style={{ flexDirection: 'row', marginTop: 10, alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={() => shift(viewMode === 'week' ? -7 : -30)} style={{ padding: 8 }}>
          <Text>{'‹ Prev'}</Text>
        </Pressable>
        <Text style={{ fontWeight: '600' }}>
          {cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable onPress={() => shift(viewMode === 'week' ? 7 : 30)} style={{ padding: 8 }}>
          <Text>{'Next ›'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
