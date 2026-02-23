//src/components/appointments/CalendarHeader.tsx

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

  const monthYear = cursor.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={styles.container}>
      {/* View Mode Toggle */}
      <View style={styles.toggleContainer}>
        <Pressable
          style={[styles.toggleButton, viewMode === 'week' && styles.toggleButtonActive]}
          onPress={() => setViewMode('week')}
        >
          <Text style={[styles.toggleText, viewMode === 'week' && styles.toggleTextActive]}>Week</Text>
        </Pressable>
        <Pressable
          style={[styles.toggleButton, viewMode === 'month' && styles.toggleButtonActive]}
          onPress={() => setViewMode('month')}
        >
          <Text style={[styles.toggleText, viewMode === 'month' && styles.toggleTextActive]}>Month</Text>
        </Pressable>
      </View>

      {/* Date Navigation */}
      <View style={styles.navContainer}>
        <Pressable onPress={() => shift(viewMode === 'week' ? -7 : -30)}>
          <Text style={styles.navButton}>{'< Prev'}</Text>
        </Pressable>
        <Text style={styles.monthText}>{monthYear}</Text>
        <Pressable onPress={() => shift(viewMode === 'week' ? 7 : 30)}>
          <Text style={styles.navButton}>{'Next >'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'transparent',
  },
  toggleButtonActive: {
    backgroundColor: '#7FB3D5',
    borderColor: '#7FB3D5',
  },
  toggleText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    color: '#7FB3D5',
    fontSize: 14,
    fontWeight: '600',
  },
  monthText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

