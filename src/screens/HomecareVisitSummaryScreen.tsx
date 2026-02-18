// src/screens/HomecareVisitSummaryScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../config/api';
import type { VisitSummaryDto } from '../utils/apiTypes';

export default function HomecareVisitSummaryScreen({
  route,
  role,
}: {
  route: { params: { summaryId?: string; apptId?: string } };
  role: 'patient' | 'family';
}) {
  const { summaryId, apptId } = route.params ?? {};
  const [summary, setSummary] = useState<VisitSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (summaryId) {
          const res = await api.get(`/visit-summaries/${summaryId}`);
          setSummary(res.data);
        } else if (apptId) {
          const res = await api.get(`/visit-summaries/appointment/${apptId}`);
          if (Array.isArray(res.data) && res.data.length > 0) {
            setSummary(res.data[0]);
          }
        }
      } catch {
        // summary may not exist
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [summaryId, apptId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7FB3D5" />
      </View>
    );
  }

  if (!summary) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No visit summary available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.sectionTitle}>Summary</Text>
      <Text style={styles.body}>{summary.summary}</Text>

      {summary.recommendations && (
        <>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <Text style={styles.body}>{summary.recommendations}</Text>
        </>
      )}

      {summary.medications && (
        <>
          <Text style={styles.sectionTitle}>Medications</Text>
          <Text style={styles.body}>{summary.medications}</Text>
        </>
      )}

      {summary.nextVisitRecommendation && (
        <>
          <Text style={styles.sectionTitle}>Next Visit</Text>
          <Text style={styles.body}>
            {new Date(summary.nextVisitRecommendation).toLocaleDateString('en-GB')}
          </Text>
        </>
      )}

      <View style={styles.meta}>
        <Text style={styles.metaText}>By: {summary.staffName}</Text>
        <Text style={styles.metaText}>
          Date: {new Date(summary.createdAt).toLocaleDateString('en-GB')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151A23' },
  center: { flex: 1, backgroundColor: '#151A23', alignItems: 'center', justifyContent: 'center' },
  empty: { color: 'rgba(255,255,255,0.5)', fontSize: 16 },
  sectionTitle: { color: '#7FB3D5', fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  body: { color: '#fff', fontSize: 14, lineHeight: 22 },
  meta: { marginTop: 30, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  metaText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 4 },
});
