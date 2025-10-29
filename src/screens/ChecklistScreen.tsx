//src/screens/ChecklistScreen.tsx
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import type { ChecklistService } from '../services/checklist';
import type { ChecklistItem } from '../utils/checklist';

function sameYMD(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ fontWeight: '700', marginBottom: 8, color: '#7FB3D5', fontSize: 16 }}>{title}</Text>
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
    ? { bg: 'rgba(34, 197, 94, 0.2)', border: '#22c55e', text: '#22c55e' }       // Completed: green
    : isOverdue
    ? { bg: 'rgba(239, 68, 68, 0.2)', border: '#EF4444', text: '#EF4444' }       // Forgotten: red
    : { bg: 'rgba(127, 179, 213, 0.2)', border: '#7FB3D5', text: '#7FB3D5' };    // In progress: blue
  return (
    <View style={{
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <View style={{ flex: 1, paddingRight: 12, opacity: item.done ? 0.6 : 1 }}>
        <Text style={{ fontWeight: '600', textDecorationLine: item.done ? 'line-through' : 'none', color: '#fff' }}>
          {item.text}
        </Text>
        <Text style={{ fontSize: 12, opacity: 0.7, color: '#fff' }}>
          {due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        {!item.done && item.detail ? (
          <Text style={{ fontSize: 12, opacity: 0.8, marginTop: 2, color: '#fff' }}>
            {item.detail}
          </Text>
        ) : null}
      </View>
      {canToggle ? (
        <Pressable
          onPress={() => onToggle(item.id, !item.done)}
          style={{
            paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10,
            borderWidth: 1, borderColor: item.done ? '#22c55e' : '#7FB3D5',
            backgroundColor: item.done ? 'rgba(34, 197, 94, 0.2)' : 'rgba(127, 179, 213, 0.2)'
          }}
        >
          <Text style={{ color: item.done ? '#22c55e' : '#7FB3D5' }}>{item.done ? 'Done' : 'Tick'}</Text>
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
  const navigation = useNavigation<any>();
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
    <View style={styles.container}>
      {/* Header with back button and safe area padding */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{"<"}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>CHECKLIST</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        <Text style={styles.dateText}>{today.toDateString()}</Text>

        <Section title="To do">
        <FlatList
          data={pending}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <Row item={item} onToggle={onToggle} canToggle={role === 'patient'} />}
            ListEmptyComponent={<Text style={styles.emptyText}>All done 🎉</Text>}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </Section>

      <Section title="Completed today">
        <FlatList
          data={done}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <Row item={item} onToggle={onToggle} canToggle={role === 'patient'} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No completed items yet</Text>}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </Section>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161B24',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  dateText: {
    opacity: 0.6,
    marginBottom: 8,
    color: '#fff',
    fontSize: 14,
  },
  emptyText: {
    opacity: 0.6,
    color: '#fff',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});