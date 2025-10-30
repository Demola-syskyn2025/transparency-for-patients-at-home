import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomecareVisitSummaryScreen({
  route,
  role,
}: {
  route: { params: { apptId?: string } };
  role: 'patient' | 'family';
}) {
  const navigation = useNavigation<any>();
  const { apptId } = route.params || {};
  const insets = useSafeAreaInsets();

  // Mocked report content for appt-1 (completed on 05/10/2025)
  const isAppt1 = apptId === 'appt-1';

  if (!isAppt1) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff', opacity: 0.8 }}>Homecare visit summary not available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>HOMECARE VISIT SUMMARY</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View style={styles.card}>
          <Text style={styles.title}>Nurse home visit</Text>
          <Text style={styles.sub}>Issued: 05/10/2025 10:00</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Clinician</Text>
            <Text style={styles.bodyText}>Mika Korhonen (nurse)</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performed Procedures</Text>
            <Text style={styles.listItem}>• Vital signs assessment</Text>
            <Text style={styles.listItem}>• Wound check & dressing change</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vitals</Text>
            <Text style={styles.bodyText}>Temperature: 36.7°C</Text>
            <Text style={styles.bodyText}>Blood Pressure: 120/80 mmHg</Text>
            <Text style={styles.bodyText}>Heart Rate: 70 bpm</Text>
            <Text style={styles.bodyText}>SpO₂: 98%</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Patient Status</Text>
            <Text style={styles.bodyText}>Stable. Wound healing progressing well. No signs of infection.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medication Changes</Text>
            <Text style={styles.bodyText}>No changes made during this visit.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            <Text style={styles.bodyText}>Keep the wound clean and dry. Continue current medication. Report any redness or swelling.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Follow Up</Text>
            <Text style={styles.bodyText}>Next home visit scheduled within 7 days (12/10/2025).</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.bodyText}>Patient cooperative. Education provided on wound care and warning signs.</Text>
          </View>
        </View>
      </ScrollView>
      {role === 'family' && (
        <Pressable
          onPress={() => {}}
          style={[styles.fab, { bottom: Math.max(insets.bottom, 16) }]}
        >
          <Text style={styles.fabText}>extract to PDF</Text>
        </Pressable>
      )}
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
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#2D3947',
    borderRadius: 16,
    padding: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sub: {
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 12,
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    color: '#7FB3D5',
    fontWeight: '700',
    marginBottom: 6,
  },
  bodyText: {
    color: '#fff',
    opacity: 0.9,
  },
  listItem: {
    color: '#fff',
    opacity: 0.9,
    marginBottom: 2,
  },
  fab: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#7FB3D5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  fabText: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
