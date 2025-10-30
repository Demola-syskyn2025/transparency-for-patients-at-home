// src/screens/AppointmentDetailScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Dimensions, TextInput, FlatList, Pressable, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { Appointment, ChatMessage } from '../utils/types';
import type { VisitSummaryService } from '../services/visitSummaries';
import type { AppointmentService } from '../services/appointments';
import StatusBadge from '../components/appoinments/StatusBadge';

const { height } = Dimensions.get('window');

export default function AppointmentDetailScreen({
  route,
  service,
  patientId,
  role,
  visitSummaryService,
}: {
  route: { params: { apptId: string } };
  service: AppointmentService;
  patientId: string;
  role: 'patient' | 'family';
  visitSummaryService: VisitSummaryService;
}) {
  const { apptId } = route.params;
  const navigation = useNavigation<any>();
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [changeVisible, setChangeVisible] = useState(false);
  const [prefDate, setPrefDate] = useState('');
  const [prefFrom, setPrefFrom] = useState('');
  const [prefTo, setPrefTo] = useState('');
  const [reason, setReason] = useState('');
  const [hasSummary, setHasSummary] = useState<boolean>(false);
  const [requestingSummary, setRequestingSummary] = useState<boolean>(false);
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
    let alive = true;
    (async () => {
      const val = await visitSummaryService.has(apptId);
      if (alive) setHasSummary(val);
    })();
    return () => { alive = false; };
  }, [apptId, visitSummaryService]);

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

  async function submitChange() {
    if (!canRequestChange) {
      setChangeVisible(false);
      return;
    }
    const payload = {
      preferredDate: prefDate.trim() || null,
      preferredTimeFrom: prefFrom.trim() || null,
      preferredTimeTo: prefTo.trim() || null,
      reason: reason.trim() || null,
    };
    const tagged = `[REQUEST_CHANGE]${JSON.stringify(payload)}`;
    await service.sendMessage(apptId, { apptId, author: 'family', text: tagged });
    setPrefDate('');
    setPrefFrom('');
    setPrefTo('');
    setReason('');
    setChangeVisible(false);
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

  const apptEndRef = appt.endAt ? new Date(appt.endAt) : new Date(appt.startAt);
  const isPast = apptEndRef.getTime() < Date.now();
  const showCompleted = isPast && (appt.status === 'scheduled' || appt.status === 'rescheduled');

  const DAY_MS = 24 * 60 * 60 * 1000;
  const canRequestChange = new Date(appt.startAt).getTime() - Date.now() >= DAY_MS;

  async function requestVisitSummary() {
    if (requestingSummary) return;
    setRequestingSummary(true);
    try {
      await visitSummaryService.request(apptId, patientId);
      setHasSummary(true);
    } finally {
      setRequestingSummary(false);
    }
  }

  return (
    <>
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ padding: 16, minHeight: height * 0.25 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 6, flex: 1, marginRight: 12 }}>
            {appt.title}
          </Text>
        </View>

        {role === 'family' && showCompleted && (
          hasSummary ? (
            <Pressable onPress={() => navigation.navigate('CareVisitSummaries')} style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#2a3647', borderRadius: 8, marginBottom: 8 }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Visit summary available in Care Visit Summaries</Text>
            </Pressable>
          ) : (
            <Pressable onPress={requestVisitSummary} disabled={requestingSummary} style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: requestingSummary ? '#999' : '#111', borderRadius: 8, marginBottom: 8, opacity: requestingSummary ? 0.7 : 1 }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Request Visit Summary</Text>
            </Pressable>
          )
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ marginRight: 8 }}>
            <StatusBadge status={appt.status ?? 'scheduled'} />
          </View>
          {showCompleted ? <StatusBadge status={'completed'} /> : null}
        </View>

        <Text style={{ marginTop: 6, marginBottom: 4 }}>
          {new Date(appt.startAt).toLocaleString()}
          {appt.endAt ? ` - ${new Date(appt.endAt).toLocaleString()}` : ''}
        </Text>
        {appt.location ? <Text style={{ marginBottom: 8 }}>📍 {appt.location}</Text> : null}

        {etaStart && etaEnd ? (
          <Text style={{ marginBottom: 8 }}>
            ETA: {etaStart.toLocaleString()}
            –
            {etaEnd.toLocaleString()}
            {etaUpdatedAt ? `  (updated ${etaUpdatedAt.toLocaleString()})` : ''}
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

        <Pressable disabled={!canRequestChange} onPress={() => setChangeVisible(true)} style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: canRequestChange ? '#111' : '#999', opacity: canRequestChange ? 1 : 0.5, borderRadius: 8 }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Request change</Text>
        </Pressable>
        {!canRequestChange && (
          <Text style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
            Change requests are available only 24h before the appointment.
          </Text>
        )}
      </View>

      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <Text style={{ fontWeight: '600', marginBottom: 6 }}>Care Chat</Text>
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
                {new Date(item.at).toLocaleString()}
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

    <Modal visible={changeVisible} transparent animationType="slide" onRequestClose={() => setChangeVisible(false)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 10 }}>Request change</Text>
          <Text style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>Provide preferred time and reason</Text>
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Preferred date (YYYY-MM-DD)</Text>
              <TextInput value={prefDate} onChangeText={setPrefDate} placeholder="2025-10-07" style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>From (HH:MM)</Text>
              <TextInput value={prefFrom} onChangeText={setPrefFrom} placeholder="09:00" style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>To (HH:MM)</Text>
              <TextInput value={prefTo} onChangeText={setPrefTo} placeholder="11:00" style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }} />
            </View>
          </View>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Reason</Text>
            <TextInput value={reason} onChangeText={setReason} placeholder="e.g. Caregiver unavailable until noon" multiline style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, minHeight: 60, textAlignVertical: 'top' }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Pressable onPress={() => setChangeVisible(false)} style={{ paddingHorizontal: 12, paddingVertical: 10, marginRight: 8 }}>
              <Text>Cancel</Text>
            </Pressable>
            <Pressable onPress={submitChange} style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#111', borderRadius: 10 }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Send</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
}
