//src/components/appointments/CalendarGrid.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

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
  const isSelected = (d: Date) => sameYMD(d, cursor);

  function DayCell({ d, inMonth = true }: { d: Date; inMonth?: boolean }) {
    const key = d.toDateString();
    const count = countByDay.get(key) || 0;
    const isTodayCell = sameYMD(d, today);
    const sel = isSelected(d);
    return (
      <Pressable key={key} onPress={() => setCursor(d)} style={[s.cell, !inMonth && { opacity: 0.3 }]}>
        <View style={[
          s.circle,
          isTodayCell && s.circleToday,
          sel && !isTodayCell && s.circleSelected,
        ]}>
          <Text style={[s.dateText, (isTodayCell || sel) && s.dateTextActive]}>{d.getDate()}</Text>
        </View>
        {count > 0 && <View style={s.dot} />}
      </Pressable>
    );
  }

  if (viewMode === 'week') {
    const weekStart = startOfWeek(cursor);
    const weekDays = Array.from({length:7}, (_,i)=>addDays(weekStart,i));
    return (
      <View style={s.grid}>
        <View style={s.headerRow}>
          {dayNames.map(d => <View key={d} style={s.headerCell}><Text style={s.headerText}>{d}</Text></View>)}
        </View>
        <View style={s.row}>
          {weekDays.map(d => <DayCell key={d.toDateString()} d={d} />)}
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
    <View style={s.grid}>
      <View style={s.headerRow}>
        {dayNames.map(d => <View key={d} style={s.headerCell}><Text style={s.headerText}>{d}</Text></View>)}
      </View>
      <View style={s.monthWrap}>
        {monthDays.map(d => (
          <DayCell key={d.toDateString()} d={d} inMonth={d.getMonth() === cursor.getMonth()} />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  grid: { paddingHorizontal: 12 },
  headerRow: { flexDirection: 'row', marginBottom: 4 },
  headerCell: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  headerText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row' },
  monthWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100/7}%`, alignItems: 'center', paddingVertical: 8 },
  circle: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  circleToday: { backgroundColor: '#7FB3D5' },
  circleSelected: { backgroundColor: 'rgba(127,179,213,0.25)' },
  dateText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  dateTextActive: { color: '#fff', fontWeight: '700' },
  dot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: '#7FB3D5', marginTop: 4,
  },
});
