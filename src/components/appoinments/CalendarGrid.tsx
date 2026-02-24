//src/components/appointments/CalendarGrid.tsx

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Mon=0
  x.setHours(0,0,0,0);
  x.setDate(x.getDate() - day);
  return x;
}
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function sameYMD(a: Date, b: Date) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

export default function CalendarGrid({
  viewMode,
  cursor,
  setCursor,
  countByDay,
}: {
  viewMode: 'week' | 'month';
  cursor: Date;
  setCursor: (d: Date) => void;
  countByDay: Map<string, number>;
}) {
  const today = new Date();
  const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  if (viewMode === 'week') {
    const weekStart = startOfWeek(cursor);
    const weekDays = Array.from({length:7}, (_,i)=>addDays(weekStart,i));
    return (
      <View style={styles.container}>
        <View style={styles.weekdayRow}>
          {dayNames.map(d => <View key={d} style={styles.weekdayCell}><Text style={styles.weekdayText}>{d}</Text></View>)}
        </View>
        <View style={styles.weekRow}>
          {weekDays.map(d => {
            const key = d.toDateString();
            const count = countByDay.get(key) || 0;
            const isToday = sameYMD(d, today);
            return (
              <Pressable key={key} onPress={() => setCursor(d)} style={[styles.dayCell, styles.weekDayCell]}>
                <View style={[styles.dayCircle, isToday && styles.dayCircleToday]}>
                  <Text style={[styles.dayNumber, isToday && styles.dayNumberToday]}>{d.getDate()}</Text>
                </View>
                {count>0 && <View style={styles.appointmentIndicator} />}
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  // Month view
  const monthFirst = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const monthLast  = new Date(cursor.getFullYear(), cursor.getMonth()+1, 0);
  const monthGridStart = startOfWeek(monthFirst);
  const totalCells = Math.ceil((monthLast.getDate() + ((monthFirst.getDay()+6)%7)) / 7) * 7;
  const monthDays = Array.from({length: totalCells}, (_,i)=>addDays(monthGridStart,i));

  return (
    <View style={styles.container}>
      <View style={styles.weekdayRow}>
        {dayNames.map(d => <View key={d} style={styles.weekdayCell}><Text style={styles.weekdayText}>{d}</Text></View>)}
      </View>
      <View style={styles.monthGrid}>
        {monthDays.map(d => {
          const key = d.toDateString();
          const inMonth = d.getMonth() === cursor.getMonth();
          const count = countByDay.get(key) || 0;
          const isToday = sameYMD(d, today);
          return (
            <Pressable key={key} onPress={() => setCursor(d)} style={[styles.dayCell, !inMonth && styles.dayOutOfMonth]}>
              <View style={[styles.dayCircle, isToday && styles.dayCircleToday]}>
                <Text style={[styles.dayNumber, isToday && styles.dayNumberToday]}>{d.getDate()}</Text>
              </View>
              {count>0 && <View style={styles.appointmentIndicator} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 0,
    marginVertical: 0,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayCell: {
    flex: 1,
    minWidth: '13%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  weekDayCell: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  dayOutOfMonth: {
    opacity: 0.3,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    backgroundColor: '#7FB3D5',
  },
  dayNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dayNumberToday: {
    color: '#161B24',
    fontWeight: '700',
  },
  appointmentIndicator: {
    position: 'absolute',
    bottom: 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7FB3D5',
  },
});

