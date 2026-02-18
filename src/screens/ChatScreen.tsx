// src/screens/ChatScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat</Text>
      <Text style={styles.subtitle}>Coming soon — messaging with your care team</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151A23', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center' },
});
