//src/screens/HomeScreen.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen({ role, patientId }: { role: 'patient'|'family', patientId: string }) {
  const navigation = useNavigation<any>();

  return (
    <View style={{flex:1, alignItems:'center', justifyContent:'center', padding: 16}}>
      <Text style={{ marginBottom: 8 }}>Role: {role}</Text>
      <Text style={{ marginBottom: 16 }}>Patient: {patientId}</Text>

      {role === 'patient' ? (
        <Pressable onPress={() => navigation.navigate('PatientAppointment')} style={{ backgroundColor: '#111', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 }}>
          <Text style={{ color:'#fff', fontWeight:'600' }}>Appointment</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
