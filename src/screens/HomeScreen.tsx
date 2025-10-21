//src/screens/HomeScreen.tsx
import React from 'react';
import { View, Text } from 'react-native';

export default function HomeScreen({ role, patientId }: { role: 'patient'|'family', patientId: string }) {
  return (
    <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
      <Text>Role: {role}</Text>
      <Text>Patient: {patientId}</Text>
    </View>
  );
}
