// App.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import AppointmentsScreen from './src/screens/AppointmentsScreen';
import ChatScreen from './src/screens/ChatScreen';
import HomeScreen from './src/screens/HomeScreen';
import PatientAppointmentScreen from './src/screens/PatientAppointmentScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AppointmentHistoryScreen from './src/screens/AppointmentHistoryScreen';
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
      etaStart: '2025-10-05T08:50:00.000Z',
      etaEnd: '2025-10-05T09:10:00.000Z',
      etaUpdatedAt: '2025-10-05T08:30:00.000Z',
      statusHistory: [
        { at: '2025-10-01T12:00:10.000Z', status: 'scheduled' },
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
      etaStart: '2025-10-07T13:45:00.000Z',
      etaEnd: '2025-10-07T14:15:00.000Z',
      etaUpdatedAt: '2025-10-07T12:30:00.000Z',
      statusHistory: [
        { at: '2025-10-01T12:05:10.000Z', status: 'scheduled' },
        { at: '2025-10-06T17:00:00.000Z', status: 'rescheduled', reason: 'Doctor reassigned to acute case' },
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
      statusHistory: [
        { at: '2025-10-02T09:00:10.000Z', status: 'scheduled' },
        { at: '2025-10-05T08:00:00.000Z', status: 'cancelled', reason: 'Patient requested to cancel' },
      ],
    },
    {
      id: 'appt-4',
      patientId: PATIENT_ID,
      title: 'Physio home visit',
      startAt: '2025-11-10T10:30:00.000Z',
      location: 'Home',
      notes: 'Mobility exercises and assessment',
      createdBy: 'system',
      createdAt: '2025-11-01T12:00:00.000Z',
      status: 'scheduled',
      assignedStaff: [
        { id: 'nurse-2', name: 'Sara Laine', role: 'nurse' },
      ],
      etaStart: '2025-11-10T10:20:00.000Z',
      etaEnd: '2025-11-10T10:40:00.000Z',
      etaUpdatedAt: '2025-11-10T09:45:00.000Z',
      statusHistory: [
        { at: '2025-11-01T12:00:10.000Z', status: 'scheduled' },
      ],
    },
    {
      id: 'appt-5',
      patientId: PATIENT_ID,
      title: 'Lab sample pickup',
      startAt: '2025-11-22T08:00:00.000Z',
      location: 'Home',
      notes: 'Fasting blood sample',
      createdBy: 'system',
      createdAt: '2025-11-05T09:00:00.000Z',
      status: 'scheduled',
      assignedStaff: [
        { id: 'emt-1', name: 'Petri Niemi', role: 'paramedic', phone: '+358 44 111 2222' },
      ],
      etaStart: '2025-11-22T07:50:00.000Z',
      etaEnd: '2025-11-22T08:10:00.000Z',
      etaUpdatedAt: '2025-11-22T07:30:00.000Z',
      statusHistory: [
        { at: '2025-11-05T09:00:10.000Z', status: 'scheduled' },
      ],
    },
    {
      id: 'appt-6',
      patientId: PATIENT_ID,
      title: 'Doctor follow-up (video)',
      startAt: '2025-12-05T13:00:00.000Z',
      location: 'Video call',
      notes: 'Review pain management and lab results',
      createdBy: 'system',
      createdAt: '2025-11-25T10:00:00.000Z',
      status: 'rescheduled',
      reasonForChange: 'Clinic schedule change',
      assignedStaff: [
        { id: 'doc-2', name: 'Dr. Juhani Mäkinen', role: 'doctor', phone: '+358 50 222 3344' },
      ],
      etaStart: '2025-12-05T12:55:00.000Z',
      etaEnd: '2025-12-05T13:10:00.000Z',
      etaUpdatedAt: '2025-12-05T12:00:00.000Z',
      statusHistory: [
        { at: '2025-11-25T10:00:10.000Z', status: 'scheduled' },
        { at: '2025-12-03T09:00:00.000Z', status: 'rescheduled', reason: 'Clinic schedule change' },
      ],
    },
    {
      id: 'appt-7',
      patientId: PATIENT_ID,
      title: 'Wound care',
      startAt: '2025-12-18T09:30:00.000Z',
      location: 'Home',
      notes: 'Dressing change and inspection',
      createdBy: 'system',
      createdAt: '2025-12-01T08:30:00.000Z',
      status: 'scheduled',
      assignedStaff: [
        { id: 'nurse-1', name: 'Mika Korhonen', role: 'nurse', phone: '+358 40 765 4321' },
      ],
      etaStart: '2025-12-18T09:20:00.000Z',
      etaEnd: '2025-12-18T09:40:00.000Z',
      etaUpdatedAt: '2025-12-18T08:50:00.000Z',
      statusHistory: [
        { at: '2025-12-01T08:30:10.000Z', status: 'scheduled' },
      ],
    },
  ],
};

const initialThreads: Record<string, ChatMessage[]> = {
  'appt-1': [
    { id: 'a1-m1', apptId: 'appt-1', author: 'system', text: 'Appointment created', at: '2025-10-01T12:00:10.000Z' },
    { id: 'a1-m2', apptId: 'appt-1', author: 'staff', text: 'We will bring dressing kit.', at: '2025-10-01T16:30:00.000Z' },
    { id: 'a1-m3', apptId: 'appt-1', author: 'family', text: 'Please confirm parking info near our entrance.', at: '2025-10-04T10:00:00.000Z' },
    { id: 'a1-m4', apptId: 'appt-1', author: 'system', text: 'Your message has been received. A nurse will reply if needed.', at: '2025-10-04T10:00:30.000Z' },
    { id: 'a1-m5', apptId: 'appt-1', author: 'system', text: 'Staff en route', at: '2025-10-05T08:20:00.000Z' },
    { id: 'a1-m6', apptId: 'appt-1', author: 'system', text: 'ETA updated to 2025-10-05 08:50–09:10', at: '2025-10-05T08:30:00.000Z' },
    { id: 'a1-m7', apptId: 'appt-1', author: 'system', text: 'Staff arrived', at: '2025-10-05T08:58:00.000Z' },
    { id: 'a1-m8', apptId: 'appt-1', author: 'system', text: 'Appointment completed', at: '2025-10-05T09:30:00.000Z' },
  ],
  'appt-2': [
    { id: 'a2-m1', apptId: 'appt-2', author: 'system', text: 'Appointment created', at: '2025-10-01T12:05:10.000Z' },
    { id: 'a2-m2', apptId: 'appt-2', author: 'system', text: 'Rescheduled on 2025-10-06 17:00 to 2025-10-07 14:00 (video).', at: '2025-10-06T17:00:00.000Z' },
    { id: 'a2-m3', apptId: 'appt-2', author: 'family', text: 'Can we extend the consultation to 30 minutes?', at: '2025-10-06T17:10:00.000Z' },
    { id: 'a2-m4', apptId: 'appt-2', author: 'system', text: 'Your message has been received. A nurse will reply if needed.', at: '2025-10-06T17:10:30.000Z' },
    { id: 'a2-m5', apptId: 'appt-2', author: 'staff', text: 'Yes, booked for 30 minutes.', at: '2025-10-06T18:00:00.000Z' },
    { id: 'a2-m6', apptId: 'appt-2', author: 'system', text: 'Staff ready to start video', at: '2025-10-07T13:55:00.000Z' },
    { id: 'a2-m7', apptId: 'appt-2', author: 'system', text: 'Appointment completed', at: '2025-10-07T14:30:00.000Z' },
  ],
  'appt-3': [
    { id: 'a3-m1', apptId: 'appt-3', author: 'system', text: 'Appointment created', at: '2025-10-02T09:00:10.000Z' },
    { id: 'a3-m2', apptId: 'appt-3', author: 'family', text: 'Please cancel this appointment.', at: '2025-10-05T07:55:00.000Z' },
    { id: 'a3-m3', apptId: 'appt-3', author: 'system', text: 'Your message has been received. A nurse will reply if needed.', at: '2025-10-05T07:55:30.000Z' },
    { id: 'a3-m4', apptId: 'appt-3', author: 'system', text: 'Appointment cancelled', at: '2025-10-05T08:00:00.000Z' },
  ],
  'appt-4': [
    { id: 'a4-m1', apptId: 'appt-4', author: 'system', text: 'Appointment created', at: '2025-11-01T12:00:10.000Z' },
    { id: 'a4-m2', apptId: 'appt-4', author: 'staff', text: 'Please have your walking aid ready.', at: '2025-11-07T09:00:00.000Z' },
    { id: 'a4-m3', apptId: 'appt-4', author: 'family', text: 'Can you also check knee pain during the visit?', at: '2025-11-09T18:00:00.000Z' },
    { id: 'a4-m4', apptId: 'appt-4', author: 'system', text: 'Your message has been received. A nurse will reply if needed.', at: '2025-11-09T18:00:30.000Z' },
    { id: 'a4-m5', apptId: 'appt-4', author: 'system', text: 'Staff en route', at: '2025-11-10T10:00:00.000Z' },
    { id: 'a4-m6', apptId: 'appt-4', author: 'system', text: 'Staff arrived', at: '2025-11-10T10:28:00.000Z' },
  ],
  'appt-5': [
    { id: 'a5-m1', apptId: 'appt-5', author: 'system', text: 'Appointment created', at: '2025-11-05T09:00:10.000Z' },
    { id: 'a5-m2', apptId: 'appt-5', author: 'staff', text: 'Reminder: Please fast overnight. Water is allowed.', at: '2025-11-21T17:00:00.000Z' },
    { id: 'a5-m3', apptId: 'appt-5', author: 'family', text: 'Is water allowed before the sample?', at: '2025-11-21T20:00:00.000Z' },
    { id: 'a5-m4', apptId: 'appt-5', author: 'system', text: 'Your message has been received. A nurse will reply if needed.', at: '2025-11-21T20:00:30.000Z' },
    { id: 'a5-m5', apptId: 'appt-5', author: 'staff', text: 'Yes, water is fine before the sample.', at: '2025-11-21T20:30:00.000Z' },
    { id: 'a5-m6', apptId: 'appt-5', author: 'system', text: 'Staff en route', at: '2025-11-22T07:30:00.000Z' },
    { id: 'a5-m7', apptId: 'appt-5', author: 'system', text: 'Staff arrived', at: '2025-11-22T07:52:00.000Z' },
  ],
  'appt-6': [
    { id: 'a6-m1', apptId: 'appt-6', author: 'system', text: 'Appointment created', at: '2025-11-25T10:00:10.000Z' },
    { id: 'a6-m2', apptId: 'appt-6', author: 'system', text: 'Rescheduled on 2025-12-03 09:00 due to clinic schedule change.', at: '2025-12-03T09:00:00.000Z' },
    { id: 'a6-m3', apptId: 'appt-6', author: 'family', text: 'Please include my daughter in the video call.', at: '2025-12-03T12:00:00.000Z' },
    { id: 'a6-m4', apptId: 'appt-6', author: 'system', text: 'Your message has been received. A nurse will reply if needed.', at: '2025-12-03T12:00:30.000Z' },
    { id: 'a6-m5', apptId: 'appt-6', author: 'staff', text: 'Meeting link sent to registered emails.', at: '2025-12-05T12:15:00.000Z' },
    { id: 'a6-m6', apptId: 'appt-6', author: 'system', text: 'Ready to start video', at: '2025-12-05T12:55:00.000Z' },
  ],
  'appt-7': [
    { id: 'a7-m1', apptId: 'appt-7', author: 'system', text: 'Appointment created', at: '2025-12-01T08:30:10.000Z' },
    { id: 'a7-m2', apptId: 'appt-7', author: 'family', text: 'Prefer morning before 10:00 if possible.', at: '2025-12-10T11:00:00.000Z' },
    { id: 'a7-m3', apptId: 'appt-7', author: 'system', text: 'Your message has been received. A nurse will reply if needed.', at: '2025-12-10T11:00:30.000Z' },
    { id: 'a7-m4', apptId: 'appt-7', author: 'staff', text: 'Noted; current plan is 09:30.', at: '2025-12-10T12:00:00.000Z' },
    { id: 'a7-m5', apptId: 'appt-7', author: 'system', text: 'Staff en route', at: '2025-12-18T08:50:00.000Z' },
    { id: 'a7-m6', apptId: 'appt-7', author: 'system', text: 'Staff arrived', at: '2025-12-18T09:22:00.000Z' },
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

// Profile Icon Component
const ProfileIcon = ({ focused }: { focused: boolean }) => (
  <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
    {focused && (
      <LinearGradient
        colors={['#A9C6CE', '#6294A1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    )}
    <View style={[styles.profileIcon, focused && styles.iconFocused]}>
      <View style={[styles.profileHead, focused && styles.profileHeadFocused]} />
      <View style={[styles.profileBody, focused && styles.profileBodyFocused]} />
    </View>
  </View>
);

// Chat Icon Component
const ChatIcon = ({ focused }: { focused: boolean }) => (
  <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
    {focused && (
      <LinearGradient
        colors={['#A9C6CE', '#6294A1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    )}
    <View style={[styles.chatIcon, focused && styles.iconFocused]}>
      <View style={[styles.chatBubble, focused && styles.chatBubbleFocused]} />
      <View style={[styles.chatTail, focused && styles.chatTailFocused]} />
    </View>
  </View>
);

// Home Icon Component
const HomeIcon = ({ focused }: { focused: boolean }) => (
  <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
    {focused && (
      <LinearGradient
        colors={['#A9C6CE', '#6294A1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    )}
    <View style={[styles.homeIcon, focused && styles.iconFocused]}>
      <View style={[styles.homeRoof, focused && styles.homeFocused]} />
      <View style={[styles.homeBody, focused && styles.homeFocused]} />
    </View>
  </View>
);

// SOS Icon Component
const SOSIcon = ({ focused }: { focused: boolean }) => (
  <View style={[styles.tabIconContainer, styles.sosIconContainer, focused && styles.tabIconFocused]}>
    {focused && (
      <LinearGradient
        colors={['#A9C6CE', '#6294A1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    )}
    <Text style={[styles.sosText, focused && styles.sosTextFocused]}>SOS</Text>
  </View>
);

// Dummy SOS Screen
const SOSScreen = () => {
  const navigation = useNavigation<any>();
  
  return (
    <View style={{ flex: 1, backgroundColor: '#161B24' }}>
      <StatusBar barStyle="light-content" />
      {/* Header with back button */}
      <View style={styles.sosHeader}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          style={styles.sosBackButton}
        >
          <Text style={styles.sosBackButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.sosHeaderTitle}>SOS</Text>
        <View style={styles.sosBackButton} />
      </View>
      
      {/* Content */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>SOS Emergency</Text>
        <Text style={{ color: '#fff', fontSize: 16, marginTop: 10 }}>Emergency contact feature</Text>
      </View>
    </View>
  );
};

// Home Tab (navigates to stack Home when selected)
const HomeTab = () => {
  const navigation = useNavigation<any>();
  React.useEffect(() => {
    navigation.navigate('Home');
  }, [navigation]);
  return <View />;
};

function RootTabs({ role, patientId, uid, onRoleChange }: { 
  role: 'patient' | 'family'; 
  patientId: string; 
  uid: string;
  onRoleChange: (role: 'patient' | 'family') => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator 
      screenOptions={{ 
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#2a3647',
          borderTopWidth: 0,
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 12),
          paddingTop: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen 
        name="Home"
        options={{
          tabBarIcon: ({ focused }) => <HomeIcon focused={focused} />,
        }}
      >
        {() => (
          <HomeScreen 
            role={role}
            patientId={patientId}
            appointmentService={apptService}
            checklistService={checklistService}
          />
        )}
      </Tab.Screen>

      <Tab.Screen 
        name="Profile"
        options={{
          tabBarIcon: ({ focused }) => <ProfileIcon focused={focused} />,
        }}
      >
        {() => <ProfileScreen role={role} onRoleChange={onRoleChange} />}
      </Tab.Screen>

      <Tab.Screen 
        name="Chat"
        options={{
          tabBarIcon: ({ focused }) => <ChatIcon focused={focused} />,
        }}
      >
        {() => <ChatScreen />}
      </Tab.Screen>

      <Tab.Screen 
        name="SOS"
        options={{
          tabBarIcon: ({ focused }) => <SOSIcon focused={focused} />,
        }}
      >
        {() => <SOSScreen />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [role, setRole] = useState<'patient' | 'family'>('patient'); // Always start as Patient
  const [uid] = useState<string>('demo-user');
  const patientId = PATIENT_ID;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="RootTabs">
        {/* Home Screen as default (not in tabs) */}
        <Stack.Screen name="Home" options={{ headerShown: false }}>
          {() => <HomeScreen role={role} patientId={patientId} appointmentService={apptService} checklistService={checklistService} />}
        </Stack.Screen>

        {/* Tab Navigator */}
        <Stack.Screen name="RootTabs" options={{ headerShown: false }}>
          {() => <RootTabs role={role} patientId={patientId} uid={uid} onRoleChange={setRole} />}
        </Stack.Screen>

        <Stack.Screen name="PatientAppointment" options={{ headerShown: false }}>
          {() => <PatientAppointmentScreen patientId={patientId} service={apptService} />}
        </Stack.Screen>
        <Stack.Screen name="Appointments" options={{ headerShown: false }}>
          {() => (
            <AppointmentsScreen
              role={role}
              patientId={patientId}
              service={apptService}
              uid={uid} />
          )}
        </Stack.Screen>
        <Stack.Screen name="Checklist" options={{ headerShown: false }}>
          {() => (
            <ChecklistScreen
              patientId={patientId}
              uid={uid}
              service={checklistService}
              role={role} />
          )}
        </Stack.Screen>
        <Stack.Screen name="AppointmentHistory" options={{ headerShown: false }}>
          {() => (
            <AppointmentHistoryScreen
              patientId={patientId}
              service={apptService}
            />
          )}
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
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  tabIconFocused: {
    // Gradient will be applied via LinearGradient component
  },
  iconFocused: {
    // Additional styling for focused state
  },
  // Profile Icon
  profileIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHead: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#8E9BA8',
    marginBottom: 2,
  },
  profileHeadFocused: {
    backgroundColor: '#fff',
  },
  profileBody: {
    width: 20,
    height: 14,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#8E9BA8',
  },
  profileBodyFocused: {
    backgroundColor: '#fff',
  },
  // Chat Icon
  chatIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  chatBubble: {
    width: 28,
    height: 22,
    backgroundColor: '#8E9BA8',
    borderRadius: 8,
    borderBottomRightRadius: 2,
  },
  chatBubbleFocused: {
    backgroundColor: '#fff',
  },
  chatTail: {
    width: 6,
    height: 6,
    backgroundColor: '#8E9BA8',
    position: 'absolute',
    bottom: 5,
    right: 2,
    transform: [{ rotate: '45deg' }],
  },
  chatTailFocused: {
    backgroundColor: '#fff',
  },
  // Home Icon
  homeIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  homeRoof: {
    width: 22,
    height: 22,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#8E9BA8',
    marginTop: 2,
  },
  homeBody: {
    width: 22,
    height: 12,
    backgroundColor: '#8E9BA8',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  homeFocused: {
    borderBottomColor: '#fff',
    backgroundColor: '#fff',
  },
  // SOS Icon
  sosIconContainer: {
    backgroundColor: '#FF4444',
  },
  sosText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  sosTextFocused: {
    color: '#fff',
  },
  // SOS Screen Styles
  sosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#161B24',
  },
  sosBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosBackButtonText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: '300',
  },
  sosHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
  },
});