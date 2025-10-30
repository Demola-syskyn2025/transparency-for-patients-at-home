import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, View, Pressable } from 'react-native';

export default function ProfileInfoScreen({ role = 'patient' }: { role?: 'patient' | 'family' }) {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
          <Text style={styles.headerBackText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{role === 'patient' ? 'MY INFO' : 'MY PARENT INFO'}</Text>
        <View style={styles.headerBackBtn} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          {role === 'family' && (
            <>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <View style={styles.avatarHead} />
                  <View style={styles.avatarBody} />
                </View>
              </View>
              <Text style={styles.name}>Shai Alexander</Text>
            </>
          )}

          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Age:</Text>
              <Text style={styles.infoValue}>60</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date of Birth:</Text>
              <Text style={styles.infoValue}>25/08/1965</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sex:</Text>
              <Text style={styles.infoValue}>Male</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Blood Type:</Text>
              <Text style={styles.infoValue}>AB</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone number:</Text>
              <Text style={styles.infoValue}>0441234456</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Health Status:</Text>
              <Text style={styles.healthStatus}>Healthy</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161B24',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight ? (StatusBar.currentHeight + 20) : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#161B24',
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#2D3947',
    borderRadius: 20,
    padding: 24,
    marginTop: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarHead: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2D3947',
    marginBottom: 4,
  },
  avatarBody: {
    width: 48,
    height: 36,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#2D3947',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  infoGrid: {
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  infoValue: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  healthStatus: {
    fontSize: 15,
    color: '#7FB3D5',
    fontWeight: '600',
  },
});
