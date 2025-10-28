//src/components/appointments/CalendarGrid.tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const AppointmentIcon = () => (
  <View style={styles.appointmentIconContainer}>
    <View style={styles.appointmentIconDocument}>
      <View style={styles.appointmentIconLine1} />
      <View style={styles.appointmentIconLine2} />
    </View>
    <View style={styles.appointmentIconClock}>
      <View style={styles.appointmentIconClockHand} />
    </View>
  </View>
);

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
      <View>
        <View style={styles.weekdayRow}>
          {dayNames.map(d => <View key={d} style={styles.weekdayCell}><Text style={styles.weekdayText}>{d}</Text></View>)}
        </View>
        <View style={styles.weekRow}>
          {weekDays.map(d => {
            const key = d.toDateString();
            const count = countByDay.get(key) || 0;
            const isToday = sameYMD(d, today);
            return (
              <Pressable key={key} onPress={() => setCursor(d)} style={styles.dayCell}>
                <View style={[styles.dayCircle, isToday && styles.dayCircleToday]}>
                  <Text style={[styles.dayText, isToday && styles.dayTextToday]}>{d.getDate()}</Text>
                </View>
                {count>0 ? <AppointmentIcon /> : null}
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
    <View>
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
            <Pressable key={key} onPress={() => setCursor(d)}
              style={[styles.monthDayCell, !inMonth && styles.monthDayCellOutside]}>
              <View style={[styles.dayCircleMonth, isToday && styles.dayCircleToday]}>
                <Text style={[styles.dayText, isToday && styles.dayTextToday]}>{d.getDate()}</Text>
              </View>
              {count>0 ? <AppointmentIcon /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    opacity: 0.6,
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  dayCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    paddingVertical: 14,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dayCircleToday: {
    backgroundColor: '#7FB3D5',
  },
  dayText: {
    color: '#fff',
  },
  dayTextToday: {
    color: '#161B24',
    fontWeight: '700',
  },
  appointmentIconContainer: {
    marginTop: 6,
    width: 18,
    height: 18,
    position: 'relative',
  },
  appointmentIconDocument: {
    width: 13,
    height: 15,
    backgroundColor: '#fff',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#7FB3D5',
    paddingTop: 4,
    paddingLeft: 2,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  appointmentIconLine1: {
    width: 7,
    height: 1.5,
    backgroundColor: '#7FB3D5',
    marginBottom: 2,
  },
  appointmentIconLine2: {
    width: 7,
    height: 1.5,
    backgroundColor: '#7FB3D5',
  },
  appointmentIconClock: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#161B24',
    borderWidth: 1,
    borderColor: '#7FB3D5',
    position: 'absolute',
    bottom: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentIconClockHand: {
    width: 1.5,
    height: 4,
    backgroundColor: '#7FB3D5',
    position: 'absolute',
    top: 1,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  monthDayCell: {
    width: `${100/7}%`,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  monthDayCellOutside: {
    opacity: 0.4,
  },
  dayCircleMonth: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
