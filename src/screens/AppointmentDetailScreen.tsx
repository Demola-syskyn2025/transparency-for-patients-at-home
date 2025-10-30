// src/screens/AppointmentDetailScreen.tsx
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import StatusBadge from '../components/appoinments/StatusBadge';
import type { AppointmentService } from '../services/appointments';
import type { VisitSummaryService } from '../services/visitSummaries';
import type { Appointment, ChatMessage } from '../utils/types';

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
  const [summaryRequested, setSummaryRequested] = useState<boolean>(false);
  const [chatVisible, setChatVisible] = useState(false);
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
    if (!appt) return;
    setRequestingSummary(true);
    setSummaryRequested(true);
    try {
      await visitSummaryService.request(apptId, patientId, appt.startAt);
      setHasSummary(true);
    } finally {
      setRequestingSummary(false);
    }
  }

  return (
    <>
    <View style={{ flex: 1, backgroundColor: '#161B24' }}>
      {/* Appointment Details Card - Scrollable */}
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detailsCard}>
        <Text style={styles.appointmentTitle}>{appt.title}</Text>

        {role === 'family' && showCompleted && (
          hasSummary ? (
            <Pressable onPress={() => navigation.navigate('CareVisitSummaries')} style={styles.summaryButton}>
              <Text style={styles.summaryButtonText}>Homecare visit summary available in Homecare Visit Summaries</Text>
            </Pressable>
          ) : summaryRequested ? (
            <View style={styles.summaryRequestedBadge}>
              <Text style={styles.summaryButtonText}>homecare visit summary for this appointment is being created</Text>
            </View>
          ) : (
            <Pressable onPress={requestVisitSummary} disabled={requestingSummary} style={[styles.requestSummaryButton, requestingSummary && styles.requestSummaryButtonDisabled]}>
              <Text style={styles.summaryButtonText}>Request Homecare Visit Summary</Text>
            </Pressable>
          )
        )}
        
        <View style={styles.badgeRow}>
          <View style={{ marginRight: 8 }}>
            <StatusBadge status={appt.status ?? 'scheduled'} />
          </View>
          {showCompleted ? <StatusBadge status={'completed'} /> : null}
        </View>

        <Text style={styles.detailText}>
          {new Date(appt.startAt).toLocaleString()}
          {appt.endAt ? ` - ${new Date(appt.endAt).toLocaleString()}` : ''}
        </Text>
        {appt.location ? <Text style={styles.detailText}>📍 {appt.location}</Text> : null}

        {etaStart && etaEnd ? (
          <Text style={styles.detailText}>
            ETA: {etaStart.toLocaleString()}
            –
            {etaEnd.toLocaleString()}
            {etaUpdatedAt ? `  (updated ${etaUpdatedAt.toLocaleString()})` : ''}
          </Text>
        ) : null}

        {appt.reasonForChange ? (
          <View style={styles.reasonCard}>
            <Text style={styles.reasonText}>Reason: {appt.reasonForChange}</Text>
          </View>
        ) : null}

        {appt.assignedStaff?.length ? (
          <View style={styles.staffSection}>
            <Text style={styles.staffTitle}>Responsible staff</Text>
            {appt.assignedStaff.map(s => (
              <Text key={s.id} style={styles.staffText}>
                • {s.name} ({s.role}){s.phone ? `  ·  ${s.phone}` : ''}
              </Text>
            ))}
          </View>
        ) : null}

        <Pressable disabled={!canRequestChange} onPress={() => setChangeVisible(true)} style={[styles.changeButton, !canRequestChange && styles.changeButtonDisabled]}>
          <Text style={styles.changeButtonText}>Request change</Text>
        </Pressable>
        {!canRequestChange && (
          <Text style={styles.changeNote}>
            Change requests are available only 24h before the appointment.
          </Text>
        )}
      </View>
      </ScrollView>

      {/* Care Chat Button */}
      <Pressable onPress={() => setChatVisible(true)} style={styles.chatButton}>
        <Text style={styles.chatButtonText}>💬 Open Care Chat</Text>
        {msgs.length > 0 && (
          <View style={styles.chatBadge}>
            <Text style={styles.chatBadgeText}>{msgs.length}</Text>
          </View>
        )}
      </Pressable>
    </View>

    {/* Care Chat Modal */}
    <Modal visible={chatVisible} animationType="slide" onRequestClose={() => setChatVisible(false)}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.chatModalContainer}>
          <View style={styles.chatModalHeader}>
            <Text style={styles.chatModalTitle}>Care Chat</Text>
            <Pressable onPress={() => setChatVisible(false)} style={styles.chatCloseButton}>
              <Text style={styles.chatCloseButtonText}>✕</Text>
            </Pressable>
          </View>

          <FlatList
            data={msgs}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.messagesList}
            renderItem={({ item }) => (
              <View style={styles.messageWrapper}>
                <View style={[
                  styles.messageContainer,
                  item.author === 'family' ? styles.userMessage : styles.doctorMessage
                ]}>
                  <Text style={styles.messageAuthor}>
                    {item.author === 'family' ? 'You' : item.author === 'staff' ? 'Staff' : 'System'}
                  </Text>
                  <Text style={styles.messageText}>{item.text}</Text>
                  <Text style={styles.messageTime}>
                    {new Date(item.at).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          />

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="Type a note/request…"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={text}
                onChangeText={setText}
                style={styles.textInput}
                multiline
              />
            </View>
            <Pressable onPress={send} style={styles.sendButton}>
              <Text style={styles.sendButtonText}>Send</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>

    {/* Change Request Modal */}
    <Modal visible={changeVisible} transparent animationType="slide" onRequestClose={() => setChangeVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Request change</Text>
          <Text style={styles.modalSubtitle}>Provide preferred time and reason</Text>
          
          <View style={styles.modalRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>Preferred date (YYYY-MM-DD)</Text>
              <TextInput 
                value={prefDate} 
                onChangeText={setPrefDate} 
                placeholder="2025-10-07" 
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                style={styles.modalInput} 
              />
            </View>
          </View>
          
          <View style={styles.modalRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.modalLabel}>From (HH:MM)</Text>
              <TextInput 
                value={prefFrom} 
                onChangeText={setPrefFrom} 
                placeholder="09:00" 
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                style={styles.modalInput} 
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>To (HH:MM)</Text>
              <TextInput 
                value={prefTo} 
                onChangeText={setPrefTo} 
                placeholder="11:00" 
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                style={styles.modalInput} 
              />
            </View>
          </View>
          
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.modalLabel}>Reason</Text>
            <TextInput 
              value={reason} 
              onChangeText={setReason} 
              placeholder="e.g. Caregiver unavailable until noon" 
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              multiline 
              style={[styles.modalInput, styles.modalTextArea]} 
            />
          </View>
          
          <View style={styles.modalButtons}>
            <Pressable onPress={() => setChangeVisible(false)} style={styles.modalCancelButton}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={submitChange} style={styles.modalSendButton}>
              <Text style={styles.modalSendText}>Send</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  detailsCard: {
    backgroundColor: '#2D3947',
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  summaryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#7FB3D5',
    borderRadius: 8,
    marginBottom: 12,
  },
  summaryRequestedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#6B7280',
    borderRadius: 8,
    marginBottom: 12,
  },
  requestSummaryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#7FB3D5',
    borderRadius: 8,
    marginBottom: 12,
  },
  requestSummaryButtonDisabled: {
    backgroundColor: '#6B7280',
    opacity: 0.7,
  },
  summaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  reasonCard: {
    backgroundColor: 'rgba(127, 179, 213, 0.15)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#7FB3D5',
  },
  reasonText: {
    color: '#7FB3D5',
    fontSize: 14,
  },
  staffSection: {
    marginBottom: 12,
  },
  staffTitle: {
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    fontSize: 15,
  },
  staffText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    marginBottom: 4,
  },
  changeButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#7FB3D5',
    borderRadius: 8,
    marginTop: 4,
  },
  changeButtonDisabled: {
    backgroundColor: '#6B7280',
    opacity: 0.5,
  },
  changeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  changeNote: {
    marginTop: 8,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
  // Chat button styles
  chatButton: {
    backgroundColor: '#7FB3D5',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  chatBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  chatBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  // Chat modal styles
  chatModalContainer: {
    flex: 1,
    backgroundColor: '#161B24',
  },
  chatModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 52 : 20,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#161B24',
    borderBottomWidth: 1,
    borderBottomColor: '#2D3947',
  },
  chatModalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chatCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  chatCloseButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '300',
  },
  chatSection: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#161B24',
  },
  chatTitle: {
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  messagesList: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  messageWrapper: {
    marginBottom: 12,
  },
  messageContainer: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16,
  },
  userMessage: {
    backgroundColor: '#6366F1',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  doctorMessage: {
    backgroundColor: '#2D3947',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageAuthor: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    marginBottom: 4,
    fontWeight: '500',
  },
  messageText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  inputContainer: {
    backgroundColor: '#161B24',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: 'rgba(42, 54, 71, 0.6)',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: '#7FB3D5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginLeft: 12,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#2D3947',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
  },
  modalRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
    fontWeight: '500',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: 'rgba(127, 179, 213, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 15,
    backgroundColor: 'rgba(22, 27, 36, 0.5)',
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
  },
  modalCancelText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 15,
    fontWeight: '600',
  },
  modalSendButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#7FB3D5',
    borderRadius: 10,
  },
  modalSendText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
