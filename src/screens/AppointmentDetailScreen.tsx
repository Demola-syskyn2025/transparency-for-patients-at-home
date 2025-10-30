// src/screens/AppointmentDetailScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Dimensions, TextInput, FlatList, Pressable } from 'react-native';
import type { Appointment, ChatMessage } from '../utils/types';
import type { AppointmentService } from '../services/appointments';
import StatusBadge from '../components/appoinments/StatusBadge';

const { height } = Dimensions.get('window');

export default function AppointmentDetailScreen({
  route,
  service,
  patientId,
}: {
  route: { params: { apptId: string } };
  service: AppointmentService;
  patientId: string;
}) {
  const { apptId } = route.params;
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const unsubRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    let alive = true;
    // load appointment by id
    (async () => {
      const found = await (service.getById ? service.getById(patientId, apptId) : undefined);
      if (alive) setAppt(found ?? null);
    })();
    return () => { alive = false; };
  }, [apptId, patientId, service]);

  useEffect(() => {
    unsubRef.current?.();
    unsubRef.current = service.subscribeMessages(apptId, (arr) => setMsgs(arr));
    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [apptId, service]);

  async function send() {
    if (!text.trim()) return;
    await service.sendMessage(apptId, { apptId, author: 'family', text: text.trim() });
    setText('');
  }

  if (!appt) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Loading appointment…</Text>
      </View>
    );
  }

  const etaStart = appt.etaStart ? new Date(appt.etaStart) : null;
  const etaEnd = appt.etaEnd ? new Date(appt.etaEnd) : null;
  const etaUpdatedAt = appt.etaUpdatedAt ? new Date(appt.etaUpdatedAt) : null;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ padding: 16, minHeight: height * 0.25 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 6, flex: 1, marginRight: 12 }}>
            {appt.title}
          </Text>
        </View>
        <StatusBadge status={appt.status ?? 'scheduled'} />

        <Text style={{ marginTop: 6, marginBottom: 4 }}>
          {new Date(appt.startAt).toLocaleString()}
          {appt.endAt ? ` - ${new Date(appt.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
        </Text>
        {appt.location ? <Text style={{ marginBottom: 8 }}>📍 {appt.location}</Text> : null}

        {etaStart && etaEnd ? (
          <Text style={{ marginBottom: 8 }}>
            ETA: {etaStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            –
            {etaEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {etaUpdatedAt ? `  (updated ${etaUpdatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}
          </Text>
        ) : null}

        {appt.reasonForChange ? (
          <View style={{ backgroundColor: '#FFF4E5', borderRadius: 8, padding: 8, marginBottom: 8 }}>
            <Text style={{ color: '#6B3A00' }}>Reason: {appt.reasonForChange}</Text>
          </View>
        ) : null}

        {appt.assignedStaff?.length ? (
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontWeight: '600', marginBottom: 4 }}>Responsible staff</Text>
            {appt.assignedStaff.map(s => (
              <Text key={s.id} style={{ opacity: 0.85 }}>
                • {s.name} ({s.role}){s.phone ? `  ·  ${s.phone}` : ''}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <Text style={{ fontWeight: '600', marginBottom: 6 }}>Notes / Requests</Text>
        <FlatList
          data={msgs}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingBottom: 8 }}
          renderItem={({ item }) => (
            <View style={{
              alignSelf: item.author === 'family' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              backgroundColor: item.author === 'family' ? '#E6F4FE' : '#F3F4F6',
              paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, marginBottom: 6
            }}>
              <Text style={{ fontSize: 12, opacity: 0.65, marginBottom: 2 }}>
                {item.author === 'family' ? 'You' : item.author === 'staff' ? 'Staff' : 'System'}
              </Text>
              <Text>{item.text}</Text>
              <Text style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>
                {new Date(item.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )}
        />

        <View style={{ flexDirection: 'row', marginTop: 6 }}>
          <TextInput
            placeholder="Type a note/request…"
            value={text}
            onChangeText={setText}
            style={{ flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginRight: 8 }}
          />
          <Pressable onPress={send} style={{ paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#111', borderRadius: 10 }}>
            <Text style={{ color: '#fff' }}>Send</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
