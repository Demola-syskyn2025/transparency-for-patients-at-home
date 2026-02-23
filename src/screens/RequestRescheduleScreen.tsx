// src/screens/RequestRescheduleScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../config/api';
import { rescheduleApi } from '../services/rescheduleApi';
import type { AppointmentDto } from '../utils/apiTypes';

type RequestType = 'RESCHEDULE' | 'CANCEL';

export default function RequestRescheduleScreen({
  route,
}: {
  route: { params: { appointmentId: string } };
}) {
  const { appointmentId } = route.params;
  const navigation = useNavigation<any>();
  const [appt, setAppt] = useState<AppointmentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [requestType, setRequestType] = useState<RequestType>('RESCHEDULE');
  const [reason, setReason] = useState('');
  const [preferredDate1, setPreferredDate1] = useState('');
  const [preferredDate2, setPreferredDate2] = useState('');
  const [preferredDate3, setPreferredDate3] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<AppointmentDto>(`/appointments/${appointmentId}`);
        setAppt(res.data);
      } catch {
        // not found
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [appointmentId]);

  const hoursUntilAppt = appt
    ? (new Date(appt.scheduledAt).getTime() - Date.now()) / (1000 * 60 * 60)
    : 0;
  const canRequest = hoursUntilAppt >= 48;

  async function handleSubmit() {
    if (!appt) return;

    if (!reason.trim()) {
      const msg = 'Please provide a reason for your request';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Missing Info', msg);
      return;
    }

    if (requestType === 'RESCHEDULE' && !preferredDate1.trim()) {
      const msg = 'Please provide at least one preferred date/time';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Missing Info', msg);
      return;
    }

    setSubmitting(true);
    try {
      await rescheduleApi.create({
        appointmentId: appt.id,
        reason: reason.trim(),
        requestType,
        preferredDate1: preferredDate1 ? new Date(preferredDate1).toISOString() : undefined,
        preferredDate2: preferredDate2 ? new Date(preferredDate2).toISOString() : undefined,
        preferredDate3: preferredDate3 ? new Date(preferredDate3).toISOString() : undefined,
      });

      const successMsg =
        requestType === 'CANCEL'
          ? 'Your cancellation request has been submitted. Staff will review it shortly.'
          : 'Your reschedule request has been submitted. Staff will review and respond.';

      if (Platform.OS === 'web') {
        alert(successMsg);
      } else {
        Alert.alert('Request Submitted', successMsg);
      }
      navigation.goBack();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to submit request';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7FB3D5" />
      </View>
    );
  }

  if (!appt) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Appointment not found</Text>
      </View>
    );
  }

  const scheduledDate = new Date(appt.scheduledAt);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Appointment Summary */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>APPOINTMENT</Text>
        <Text style={styles.dateText}>
          {scheduledDate.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
        <Text style={styles.timeText}>
          {scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          {appt.estimatedDurationMinutes ? ` · ${appt.estimatedDurationMinutes} min` : ''}
        </Text>
        <Text style={styles.staffText}>
          With: {appt.staff.firstName} {appt.staff.lastName}
        </Text>
      </View>

      {/* 48hr Warning */}
      {!canRequest && (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Request Not Available</Text>
          <Text style={styles.warningText}>
            Change requests can only be made at least 48 hours before the appointment.
            This appointment is in {Math.round(hoursUntilAppt)} hours.
          </Text>
        </View>
      )}

      {canRequest && (
        <>
          {/* Request Type Selection */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>REQUEST TYPE</Text>
            <View style={styles.typeRow}>
              <Pressable
                style={[styles.typeBtn, requestType === 'RESCHEDULE' && styles.typeBtnActive]}
                onPress={() => setRequestType('RESCHEDULE')}
              >
                <Text style={[styles.typeBtnText, requestType === 'RESCHEDULE' && styles.typeBtnTextActive]}>
                  Change Time
                </Text>
              </Pressable>
              <Pressable
                style={[styles.typeBtn, requestType === 'CANCEL' && styles.typeBtnActiveCancel]}
                onPress={() => setRequestType('CANCEL')}
              >
                <Text style={[styles.typeBtnText, requestType === 'CANCEL' && styles.typeBtnTextActiveCancel]}>
                  Request Cancel
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Reason Input */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>REASON *</Text>
            <TextInput
              style={styles.textInput}
              placeholder={
                requestType === 'CANCEL'
                  ? 'Why do you need to cancel this visit?'
                  : 'Why do you need to change the time?'
              }
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Preferred Dates (for reschedule) */}
          {requestType === 'RESCHEDULE' && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>PREFERRED DATE/TIME *</Text>
              <Text style={styles.hint}>Enter dates in format: YYYY-MM-DD HH:MM (e.g., 2026-03-01 10:00)</Text>
              
              <Text style={styles.inputLabel}>Option 1 *</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-03-01 10:00"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={preferredDate1}
                onChangeText={setPreferredDate1}
              />

              <Text style={styles.inputLabel}>Option 2 (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-03-02 14:00"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={preferredDate2}
                onChangeText={setPreferredDate2}
              />

              <Text style={styles.inputLabel}>Option 3 (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-03-03 09:00"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={preferredDate3}
                onChangeText={setPreferredDate3}
              />
            </View>
          )}

          {/* Submit Button */}
          <Pressable
            style={[
              styles.submitBtn,
              requestType === 'CANCEL' && styles.submitBtnCancel,
              submitting && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>
                {requestType === 'CANCEL' ? 'Submit Cancellation Request' : 'Submit Reschedule Request'}
              </Text>
            )}
          </Pressable>

          <Text style={styles.footerNote}>
            Your request will be reviewed by the care team. You will be notified once a decision is made.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151A23' },
  center: { flex: 1, backgroundColor: '#151A23', justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 16 },

  card: {
    backgroundColor: 'rgba(42,54,71,0.6)',
    margin: 16,
    marginBottom: 0,
    borderRadius: 14,
    padding: 18,
  },
  cardLabel: {
    color: '#7FB3D5',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  dateText: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  timeText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  staffText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 8 },

  warningCard: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    margin: 16,
    marginBottom: 0,
    borderRadius: 14,
    padding: 18,
  },
  warningTitle: { color: '#EF4444', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  warningText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 20 },

  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: 'rgba(127,179,213,0.2)',
    borderWidth: 1,
    borderColor: '#7FB3D5',
  },
  typeBtnActiveCancel: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  typeBtnText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
  typeBtnTextActive: { color: '#7FB3D5' },
  typeBtnTextActiveCancel: { color: '#EF4444' },

  textInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  hint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginBottom: 12,
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 14,
  },

  submitBtn: {
    backgroundColor: '#7FB3D5',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitBtnCancel: {
    backgroundColor: '#EF4444',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  footerNote: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    textAlign: 'center',
    margin: 16,
    lineHeight: 18,
  },
});
