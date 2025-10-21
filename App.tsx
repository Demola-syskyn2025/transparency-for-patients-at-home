// App.tsx
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Switch } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import AppointmentsScreen from './src/screens/AppointmentsScreen';
import { MockAppointmentService } from './src/services/appointments';
import type { Appointment, ChatMessage } from './src/utils/types';

// NEW: Checklist
import ChecklistScreen from './src/screens/ChecklistScreen';
import { MockChecklistService } from './src/services/checklist';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const PATIENT_ID = 'patient_demo';

// ---------- Seed Appointments (giữ nguyên của Dan) ----------
const initialAppointments: Record<string, Appointment[]> = {
  [PATIENT_ID]: [
    {
      id: 'appt-1',
      patientId: PATIENT_ID,
      title: 'Nurse home visit',
      startAt: '2025-10-05T09:00:00.000Z',
      endAt: '2025-10-05T09:30:00.000Z',
      location: 'Home',
      notes: 'Check wound & vitals',
      createdBy: 'system',
      createdAt: '2025-10-01T12:00:00.000Z',
      status: 'scheduled',
      assignedStaff: [
        { id: 'doc-1', name: 'Dr. Anna Virtanen', role: 'doctor', phone: '+358 40 123 4567' },
        { id: 'nurse-1', name: 'Mika Korhonen', role: 'nurse', phone: '+358 40 765 4321' },
      ],
    },
    {
      id: 'appt-2',
      patientId: PATIENT_ID,
      title: 'Doctor consultation (video)',
      startAt: '2025-10-07T14:00:00.000Z',
      location: 'Video call',
      notes: 'Discuss medication plan',
      createdBy: 'system',
      createdAt: '2025-10-01T12:05:00.000Z',
      status: 'rescheduled',
      reasonForChange: 'Doctor reassigned to acute case',
      assignedStaff: [
        { id: 'doc-2', name: 'Dr. Juhani Mäkinen', role: 'doctor', phone: '+358 50 222 3344' },
      ],
    },
    {
      id: 'appt-3',
      patientId: PATIENT_ID,
      title: 'IV therapy',
      startAt: '2025-10-08T10:00:00.000Z',
      createdBy: 'system',
      createdAt: '2025-10-02T09:00:00.000Z',
      status: 'cancelled',
      reasonForChange: 'Patient requested to cancel',
      assignedStaff: [
        { id: 'doc-1', name: 'Dr. Anna Virtanen', role: 'doctor', phone: '+358 40 123 4567' },
        { id: 'nurse-2', name: 'Sara Laine', role: 'nurse' },
      ],
    },
  ],
};

const initialThreads: Record<string, ChatMessage[]> = {
  'appt-1': [
    { id: 'm1', apptId: 'appt-1', author: 'system', text: 'Appointment created', at: '2025-10-01T12:00:10.000Z' },
    { id: 'm2', apptId: 'appt-1', author: 'staff', text: 'We will bring dressing kit.', at: '2025-10-01T16:30:00.000Z' },
  ],
  'appt-2': [
    { id: 'm3', apptId: 'appt-2', author: 'system', text: 'Appointment created', at: '2025-10-01T12:05:10.000Z' },
  ],
};

const apptService = new MockAppointmentService(initialAppointments, initialThreads);

// ---------- Seed Checklist (task trong NGÀY cho patient, không cần nhập) ----------
function todayAt(h: number, m: number) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

const checklistService = new MockChecklistService({
  [PATIENT_ID]: [
    {
      id: 't1',
      patientId: PATIENT_ID,
      text: 'Take morning medication',
      detail: 'Take 2 tablets of Metformin 500mg with water after breakfast.',
      done: false,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      dueAt: todayAt(10, 0),
    },
    {
      id: 't2',
      patientId: PATIENT_ID,
      text: 'Measure blood pressure',
      detail: 'Sit for 5 minutes before measuring. Record systolic/diastolic.',
      done: false,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      dueAt: todayAt(11, 0),
    },
    {
      id: 't3',
      patientId: PATIENT_ID,
      text: 'Record temperature',
      detail: 'Use the digital thermometer under the tongue for 1 minute.',
      done: true,
      completedAt: todayAt(8, 30),
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      dueAt: todayAt(8, 0),
    },
    {
      id: 't4',
      patientId: PATIENT_ID,
      text: 'Take evening pills',
      detail: '1 pill of vitamin D after dinner with a glass of water.',
      done: true,
      completedAt: todayAt(8, 30),
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      dueAt: todayAt(18, 0),
    }
  ],
});

function RootTabs({ role, patientId, uid }: { role: 'patient' | 'family'; patientId: string; uid: string }) {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home">
        {() => <HomeScreen role={role} patientId={patientId} />}
      </Tab.Screen>

      <Tab.Screen name="Appointments">
        {() => (
          <AppointmentsScreen
            role={role}
            patientId={patientId}
            service={apptService}
            uid={uid}
          />
        )}
      </Tab.Screen>

      {/* NEW: Checklist tab (patient daily tasks) */}
      <Tab.Screen name="Checklist">
        {() => (
          <ChecklistScreen
            patientId={patientId}
            uid={uid}
            service={checklistService}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [role, setRole] = useState<'patient' | 'family'>('family'); // mở app là Family luôn
  const [uid] = useState<string>('demo-user');
  const patientId = PATIENT_ID;

  return (
    <NavigationContainer>
      {/* Toggle vai trò để demo */}
      <View style={{ height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ marginRight: 8 }}>Patient</Text>
        <Switch value={role === 'family'} onValueChange={(v) => setRole(v ? 'family' : 'patient')} />
        <Text style={{ marginLeft: 8 }}>Family</Text>
      </View>

      <Stack.Navigator>
        <Stack.Screen name="RootTabs" options={{ headerShown: false }}>
          {() => <RootTabs role={role} patientId={patientId} uid={uid} />}
        </Stack.Screen>
        <Stack.Screen name="AppointmentDetail" options={{ title: 'Appointment details' }}>
          {(props) => (
            // inject services and patientId
            <>
              {/* @ts-ignore component typed separately */}
              {React.createElement(require('./src/screens/AppointmentDetailScreen').default, {
                ...props,
                service: apptService,
                patientId,
              })}
            </>
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}