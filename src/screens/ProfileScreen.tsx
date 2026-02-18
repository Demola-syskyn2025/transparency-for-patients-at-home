// src/screens/ProfileScreen.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Text>
        </View>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.role}>{user?.role}</Text>
      </View>

      <View style={styles.section}>
        <Pressable style={styles.row} onPress={() => navigation.navigate('ProfileInfo')}>
          <Text style={styles.rowText}>My Info</Text>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </View>

      <Pressable style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151A23' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 24 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#7FB3D5', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  name: { color: '#fff', fontSize: 20, fontWeight: '700' },
  role: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 },
  section: { marginTop: 20, marginHorizontal: 16 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(42,54,71,0.6)', padding: 16, borderRadius: 12,
  },
  rowText: { color: '#fff', fontSize: 16 },
  arrow: { color: '#7FB3D5', fontSize: 20 },
  logoutBtn: {
    marginTop: 40, marginHorizontal: 16, padding: 16, borderRadius: 12,
    backgroundColor: 'rgba(220,38,38,0.2)', alignItems: 'center',
  },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
});
