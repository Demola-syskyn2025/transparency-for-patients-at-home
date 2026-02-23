// src/screens/CareVisitSummariesScreen.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function CareVisitSummariesScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <Text style={styles.title}>Care Visit Summaries</Text>
      <Text style={styles.subtitle}>
        {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Visit Summary</Text>
        <Text style={styles.cardDate}>February 20, 2026</Text>
        <Text style={styles.cardContent}>
          Patient showed good progress with medication adherence. Vital signs stable. 
          Blood pressure: 120/80, Heart rate: 72 bpm. No immediate concerns noted.
        </Text>
        <Text style={styles.cardStaff}>Staff: Dr. Sarah Johnson</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Follow-up Visit</Text>
        <Text style={styles.cardDate}>February 15, 2026</Text>
        <Text style={styles.cardContent}>
          Wound healing progressing well. Dressing changed successfully. 
          Patient reports reduced pain levels. Continue current treatment plan.
        </Text>
        <Text style={styles.cardStaff}>Staff: Nurse Emily Davis</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Initial Assessment</Text>
        <Text style={styles.cardDate}>February 10, 2026</Text>
        <Text style={styles.cardContent}>
          Comprehensive assessment completed. Patient history reviewed. 
          Care plan established with focus on mobility improvement and pain management.
        </Text>
        <Text style={styles.cardStaff}>Staff: Dr. Sarah Johnson</Text>
      </View>

      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>Visit Summaries</Text>
        <Text style={styles.noticeText}>
          This page displays care visit summaries and medical notes from healthcare providers. 
          Summaries are created after each home visit to document patient progress, 
          treatment updates, and care recommendations.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151A23' },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 24 },
  card: {
    backgroundColor: 'rgba(42,54,71,0.6)', borderRadius: 12, padding: 16, marginBottom: 12,
  },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardDate: { color: '#7FB3D5', fontSize: 13, marginBottom: 8 },
  cardContent: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  cardStaff: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  noticeCard: {
    backgroundColor: 'rgba(127,179,213,0.1)', borderRadius: 12, padding: 16, marginTop: 20,
  },
  noticeTitle: { color: '#7FB3D5', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  noticeText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 18 },
});
