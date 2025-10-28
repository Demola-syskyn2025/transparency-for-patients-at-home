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

  return (
    <View style={styles.container}>
      {/* Toggle Week/Month */}
      <View style={styles.toggleContainer}>
        <Pressable
          onPress={() => setViewMode('week')}
          style={[
            styles.toggleButton,
            styles.toggleButtonLeft,
            viewMode === 'week' && styles.toggleButtonActive
          ]}
        >
          <Text style={[styles.toggleText, viewMode === 'week' && styles.toggleTextActive]}>Week</Text>
        </Pressable>
        <Pressable
          onPress={() => setViewMode('month')}
          style={[
            styles.toggleButton,
            styles.toggleButtonRight,
            viewMode === 'month' && styles.toggleButtonActive
          ]}
        >
          <Text style={[styles.toggleText, viewMode === 'month' && styles.toggleTextActive]}>Month</Text>
        </Pressable>
      </View>

      {/* Prev / Next */}
      <View style={styles.navContainer}>
        <Pressable onPress={() => shift(viewMode === 'week' ? -7 : -30)} style={styles.navButton}>
          <Text style={styles.navButtonText}>{'< Prev'}</Text>
        </Pressable>
        <Text style={styles.monthText}>
          {cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable onPress={() => shift(viewMode === 'week' ? 7 : 30)} style={styles.navButton}>
          <Text style={styles.navButtonText}>{'Next >'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  toggleButtonLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    marginRight: 1,
  },
  toggleButtonRight: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#7FB3D5',
    borderColor: '#7FB3D5',
  },
  toggleText: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#161B24',
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    padding: 8,
  },
  navButtonText: {
    color: '#7FB3D5',
    fontSize: 14,
    fontWeight: '600',
  },
  monthText: {
    fontWeight: '600',
    color: '#fff',
    fontSize: 16,
  },
});
