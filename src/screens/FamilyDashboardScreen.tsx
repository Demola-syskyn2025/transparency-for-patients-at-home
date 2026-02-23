// src/screens/FamilyDashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../config/api';
import type { FamilyPatientLinkDto, AppointmentDto } from '../utils/apiTypes';

export default function FamilyDashboardScreen({ userId }: { userId: string }) {
  const navigation = useNavigation<any>();
  const [links, setLinks] = useState<FamilyPatientLinkDto[]>([]);
  const [upcomingAppts, setUpcomingAppts] = useState<AppointmentDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Fetch linked patients for this family member
        const linksRes = await api.get<FamilyPatientLinkDto[]>(`/family-links/family/${userId}`);
        setLinks(linksRes.data);

        // Fetch appointments for all linked patients
        const allAppts: AppointmentDto[] = [];
        for (const link of linksRes.data) {
          try {
            const apptRes = await api.get<AppointmentDto[]>(`/appointments/patient/${link.patient.id}`);
            allAppts.push(...apptRes.data);
          } catch {
            // continue with other patients
          }
        }
        // Filter upcoming appointments and sort by date
        const now = new Date();
        const upcoming = allAppts
          .filter(a => new Date(a.scheduledAt) >= now && a.status !== 'CANCELLED')
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
        setUpcomingAppts(upcoming);
      } catch {
        // handle silently
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7FB3D5" />
      </View>
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <Text style={styles.title}>Family Dashboard</Text>
      <Text style={styles.subtitle}>
        {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
      </Text>

      <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
      {upcomingAppts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No upcoming appointments</Text>
        </View>
      ) : (
        upcomingAppts.slice(0, 5).map((appt) => (
          <Pressable
            key={appt.id}
            style={styles.appointmentCard}
            onPress={() =>
              navigation.navigate('AppointmentDetail', {
                appointmentId: String(appt.id),
              })
            }
          >
            <View style={styles.apptHeader}>
              <Text style={styles.apptPatientName}>
                {appt.patient.firstName} {appt.patient.lastName}
              </Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{appt.status}</Text>
              </View>
            </View>
            <Text style={styles.apptDateTime}>
              {formatDate(appt.scheduledAt)} at {formatTime(appt.scheduledAt)}
            </Text>
            <Text style={styles.apptType}>{appt.type?.replace('_', ' ')}</Text>
            <Text style={styles.apptStaff}>
              Staff: {appt.staff.firstName} {appt.staff.lastName}
            </Text>
          </Pressable>
        ))
      )}

      <Text style={styles.sectionTitle}>Linked Patients</Text>
      {links.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No linked patients</Text>
        </View>
      ) : (
        links.map((link) => (
          <Pressable
            key={link.id}
            style={styles.card}
            onPress={() =>
              navigation.navigate('PatientOverview', {
                patientId: String(link.patient.id),
                patientName: `${link.patient.firstName} ${link.patient.lastName}`,
              })
            }
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {link.patient.firstName} {link.patient.lastName}
              </Text>
              <Text style={styles.relationshipBadge}>{link.relationship}</Text>
            </View>
            <Text style={styles.cardSub}>{link.patient.email}</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151A23' },
  center: { flex: 1, backgroundColor: '#151A23', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 24 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  card: {
    backgroundColor: 'rgba(42,54,71,0.6)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cardSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 },
  relationshipBadge: {
    backgroundColor: 'rgba(127,179,213,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    color: '#7FB3D5',
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: 'rgba(42,54,71,0.3)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  appointmentCard: {
    backgroundColor: 'rgba(42,54,71,0.6)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  apptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  apptPatientName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  statusBadge: {
    backgroundColor: 'rgba(127,179,213,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    color: '#7FB3D5',
    fontSize: 11,
    fontWeight: '600',
  },
  apptDateTime: {
    color: '#7FB3D5',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  apptType: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  apptStaff: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 4,
  },
});
