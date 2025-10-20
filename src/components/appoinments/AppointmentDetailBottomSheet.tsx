//src/components/appointments/AppointmentDetailBottomSheet.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Modal, Dimensions, TextInput, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import type { Appointment, ChatMessage } from '../../utils/types';
import type { AppointmentService } from '../../services/appointments';
import StatusBadge from './StatusBadge';


const { height } = Dimensions.get('window');

export default function AppointmentDetailBottomSheet({
  appt,
  onClose,
  service,
}: {
  appt: Appointment | null;
  onClose: () => void;
  service: AppointmentService;
}) {
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const unsubRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    // quản lý subscribe theo appt
    if (!appt) return;
    // load + subscribe “realtime”
    unsubRef.current?.();
    unsubRef.current = service.subscribeMessages(appt.id, (arr) => setMsgs(arr));
    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [appt, service]);

  async function send() {
    if (!appt || !text.trim()) return;
    await service.sendMessage(appt.id, { apptId: appt.id, author: 'family', text: text.trim() });
    setText('');
  }

  if (!appt) return null;

  return (
    <Modal visible={!!appt} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
          {/* overlay để tap ra ngoài */}
          <Pressable style={{ flex: 1 }} onPress={onClose} />
          {/* bottom sheet */}
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, minHeight: height * 0.6 }}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#ccc', marginBottom: 12 }} />

            {/* Header: Thông tin chính */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 6, flex: 1, marginRight: 12 }}>
            {appt.title}
        </Text>
        {/* NEW: badge */}
        {/* import StatusBadge ở đầu file:  import StatusBadge from './StatusBadge'; */}
        {/* @ts-ignore: if path differs, adjust import */}
        </View>
        <StatusBadge status={appt.status ?? 'scheduled'} />

        <Text style={{ marginTop: 6, marginBottom: 4 }}>
        {new Date(appt.startAt).toLocaleString()}
        {appt.endAt ? ` - ${new Date(appt.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
        </Text>
        {appt.location ? <Text style={{ marginBottom: 8 }}>📍 {appt.location}</Text> : null}

        {/* NEW: reason for change */}
        {appt.reasonForChange ? (
        <View style={{ backgroundColor: '#FFF4E5', borderRadius: 8, padding: 8, marginBottom: 8 }}>
            <Text style={{ color: '#6B3A00' }}>Reason: {appt.reasonForChange}</Text>
        </View>
        ) : null}

            {/* Staff phụ trách */}
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

            {/* Chat realtime */}
            <View style={{ flex: 1, marginTop: 8 }}>
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

              {/* input */}
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

            {/* Close */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
              <Pressable onPress={onClose} style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#ccc' }}>
                <Text>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
