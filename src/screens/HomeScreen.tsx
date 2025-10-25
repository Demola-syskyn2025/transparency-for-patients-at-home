//src/screens/HomeScreen.tsx
import React from 'react';
import { View, Text } from 'react-native';
import Speech from '../components/appoinments/Speech';

export default function HomeScreen({ role, patientId }: { role: 'patient'|'family', patientId: string }) {
  return (
    <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
      <Text>Role: {role}</Text>
      <Speech />
      <Text>Patient: {patientId}</Text>
    </View>
  );
}
