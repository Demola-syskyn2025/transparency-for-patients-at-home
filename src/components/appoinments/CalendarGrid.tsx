//src/components/appointments/CalendarGrid.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';

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
        <View style={{ flexDirection:'row', paddingHorizontal:8, paddingVertical:6 }}>
          {dayNames.map(d => <View key={d} style={{ flex:1, alignItems:'center' }}><Text style={{ opacity:0.6 }}>{d}</Text></View>)}
        </View>
        <View style={{ flexDirection:'row', paddingHorizontal:8 }}>
          {weekDays.map(d => {
            const key = d.toDateString();
            const count = countByDay.get(key) || 0;
            const isToday = sameYMD(d, today);
            return (
              <Pressable key={key} onPress={() => setCursor(d)} style={{ flex:1, borderWidth:1, borderColor:'#eee', alignItems:'center', paddingVertical:14 }}>
                <View style={{ width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center', backgroundColor: isToday ? '#222' : 'transparent' }}>
                  <Text style={{ color: isToday ? '#fff' : '#000' }}>{d.getDate()}</Text>
                </View>
                {count>0 ? <Text style={{ marginTop:6, fontSize:12 }}>{count} appt</Text> : null}
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
      <View style={{ flexDirection:'row', paddingHorizontal:8, paddingVertical:6 }}>
        {dayNames.map(d => <View key={d} style={{ flex:1, alignItems:'center' }}><Text style={{ opacity:0.6 }}>{d}</Text></View>)}
      </View>
      <View style={{ flexDirection:'row', flexWrap:'wrap', paddingHorizontal:8 }}>
        {monthDays.map(d => {
          const key = d.toDateString();
          const inMonth = d.getMonth() === cursor.getMonth();
          const count = countByDay.get(key) || 0;
          const isToday = sameYMD(d, today);
          return (
            <Pressable key={key} onPress={() => setCursor(d)}
              style={{ width:`${100/7}%`, borderWidth:1, borderColor:'#eee', paddingVertical:12, alignItems:'center', opacity: inMonth ? 1 : 0.4 }}>
              <View style={{ width:32, height:32, borderRadius:16, alignItems:'center', justifyContent:'center', backgroundColor: isToday ? '#222' : 'transparent' }}>
                <Text style={{ color: isToday ? '#fff' : '#000' }}>{d.getDate()}</Text>
              </View>
              {count>0 ? <Text style={{ marginTop:6, fontSize:11 }}>{count} appt</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
