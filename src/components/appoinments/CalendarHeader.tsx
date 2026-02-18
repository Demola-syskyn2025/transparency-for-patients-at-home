//src/components/appointments/CalendarHeader.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

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
    <View style={styles.container}>
      {/* Toggle Week/Month */}
      <View style={styles.toggleRow}>
        {(['week', 'month'] as const).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => setViewMode(mode)}
            style={[styles.toggleBtn, viewMode === mode && styles.toggleActive]}
          >
            <Text style={[styles.toggleText, viewMode === mode && styles.toggleTextActive]}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Prev / Current / Next */}
      <View style={styles.navRow}>
        <Pressable onPress={() => shift(viewMode === 'week' ? -7 : -30)} style={styles.navBtn}>
          <Text style={styles.navArrow}>‹</Text>
        </Pressable>
        <Text style={styles.navLabel}>
          {cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable onPress={() => shift(viewMode === 'week' ? 7 : 30)} style={styles.navBtn}>
          <Text style={styles.navArrow}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  toggleRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 3 },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  toggleActive: { backgroundColor: '#7FB3D5' },
  toggleText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },
  toggleTextActive: { color: '#151A23' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  navArrow: { color: '#fff', fontSize: 20, fontWeight: '700' },
  navLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
