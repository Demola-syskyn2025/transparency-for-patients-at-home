//src/screens/ChecklistScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import type { ChecklistItem } from '../utils/checklist';
import type { ChecklistService } from '../services/checklist';

function sameYMD(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ fontWeight: '700', marginBottom: 8 }}>{title}</Text>
      {children}
    </View>
  );
}

function Row({
  item,
  onToggle,
  canToggle,
}: {
  item: ChecklistItem;
  onToggle: (id: string, next: boolean) => void;
  canToggle: boolean;
}) {
  const due = new Date(item.dueAt);
  const now = new Date();
  const isOverdue = now.getTime() > due.getTime();
  const statusLabel = item.done ? 'Completed' : (isOverdue ? 'Forgotten' : 'In progress');
  const statusStyles = item.done
    ? { bg: '#E7F6EC', border: '#16a34a', text: '#0B3D2E' }       // Completed: greenish
    : isOverdue
    ? { bg: '#FDECEC', border: '#EF4444', text: '#7F1D1D' }       // Forgotten: red
    : { bg: '#F3F4F6', border: '#ddd', text: '#374151' };         // In progress: neutral
  return (
    <View style={{
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <View style={{ flex: 1, paddingRight: 12, opacity: item.done ? 0.6 : 1 }}>
        <Text style={{ fontWeight: '600', textDecorationLine: item.done ? 'line-through' : 'none' }}>
          {item.text}
        </Text>
        <Text style={{ fontSize: 12, opacity: 0.7 }}>
          {due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        {!item.done && item.detail ? (
          <Text style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
            {item.detail}
          </Text>
        ) : null}
      </View>
      {canToggle ? (
        <Pressable
          onPress={() => onToggle(item.id, !item.done)}
          style={{
            paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10,
            borderWidth: 1, borderColor: item.done ? '#16a34a' : '#111',
            backgroundColor: item.done ? '#E7F6EC' : 'transparent'
          }}
        >
          <Text style={{ color: item.done ? '#0B3D2E' : '#111' }}>{item.done ? 'Done' : 'Tick'}</Text>
        </Pressable>
      ) : (
        <View style={{
          paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10,
          backgroundColor: statusStyles.bg,
          borderWidth: 1, borderColor: statusStyles.border
        }}>
          <Text style={{ color: statusStyles.text }}>{statusLabel}</Text>
        </View>
      )}
    </View>
  );
}

export default function ChecklistScreen({
  patientId,
  uid,         // không dùng nhiều, giữ để đồng bộ props
  service,
  role,
}: {
  patientId: string;
  uid: string;
  service: ChecklistService;
  role: 'patient' | 'family';
}) {

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const today = new Date();

  async function load() {
    const rows = await service.listByPatient(patientId);
    setItems(rows);
  }
  useEffect(() => { load(); }, [patientId]);

  // lọc task chỉ của hôm nay
  const { pending, done } = useMemo(() => {
    const p: ChecklistItem[] = [];
    const d: ChecklistItem[] = [];
    for (const it of items) {
      const due = new Date(it.dueAt);
      if (!sameYMD(due, today)) continue; // chỉ hôm nay
      if (it.done) d.push(it); else p.push(it);
    }
    // pending: theo dueAt ↑ ; done: theo completedAt ↓
    p.sort((a,b) => a.dueAt.localeCompare(b.dueAt));
    d.sort((a,b) => (b.completedAt ?? b.dueAt).localeCompare(a.completedAt ?? a.dueAt));
    return { pending: p, done: d };
  }, [items]);

  const onToggle = async (id: string, next: boolean) => {
    if (role !== 'patient') return; // read-only for family
    await service.toggle(patientId, id, next);
    load();
  };

  return (
    <View style={{ flex:1, padding:12 }}>
      <Text style={{ fontSize:18, fontWeight:'700' }}>Today’s Checklist</Text>
      <Text style={{ opacity:0.6, marginBottom:8 }}>{today.toDateString()}</Text>

      <Section title="To do">
        <FlatList
          data={pending}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <Row item={item} onToggle={onToggle} canToggle={role === 'patient'} />}
          ListEmptyComponent={<Text style={{ opacity:0.6 }}>All done 🎉</Text>}
          ItemSeparatorComponent={() => <View style={{ height:1, backgroundColor:'#eee' }} />}
        />
      </Section>

      <Section title="Completed today">
        <FlatList
          data={done}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <Row item={item} onToggle={onToggle} canToggle={role === 'patient'} />}
          ListEmptyComponent={<Text style={{ opacity:0.6 }}>No completed items yet</Text>}
          ItemSeparatorComponent={() => <View style={{ height:1, backgroundColor:'#eee' }} />}
        />
      </Section>
    </View>
  );
}