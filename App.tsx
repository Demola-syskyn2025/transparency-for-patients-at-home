// App.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native';

import AppointmentsScreen from './src/screens/AppointmentsScreen';
import ChatScreen from './src/screens/ChatScreen';
import HomeScreen from './src/screens/HomeScreen';
import PatientAppointmentScreen from './src/screens/PatientAppointmentScreen';
import ProfileScreen from './src/screens/ProfileScreen';
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
      startAt: '2025-12T09:00:00.000Z',
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
      <View style={[styles.homeRoof, focused && styles.homeRoofFocused]} />
      <View style={[styles.homeBase, focused && styles.homeBaseFocused]} />
      <View style={[styles.homeDoor, focused && styles.homeDoorFocused]} />
    </View>
  </View>
);

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
      {/* Header */}
      <View style={styles.sosHeader}>
        <Text style={styles.sosHeaderTitle}>SOS</Text>
      </View>
      
      {/* Content */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>SOS Emergency</Text>
        <Text style={{ color: '#fff', fontSize: 16, marginTop: 10 }}>Emergency contact feature</Text>
      </View>
    </View>
  );
};

function RootTabs({ role, patientId, uid, onRoleChange }: { 
  role: 'patient' | 'family'; 
  patientId: string; 
  uid: string;
  onRoleChange: (role: 'patient' | 'family') => void;
}) {
  return (
    <Tab.Navigator 
      initialRouteName="HomeTab"
      screenOptions={{ 
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#2a3647',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen 
        name="HomeTab"
        options={{
          tabBarIcon: ({ focused }) => <HomeIcon focused={focused} />,
        }}
      >
        {() => <HomeScreen role={role} patientId={patientId} appointmentService={apptService} checklistService={checklistService} />}
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
    <NavigationContainer>
      <Stack.Navigator initialRouteName="RootTabs">
        {/* Tab Navigator as default - now includes Home */}
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
  // Home Icon
  homeIcon: {
    width: 32,
    height: 32,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  homeRoof: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#8E9BA8',
    marginBottom: 2,
  },
  homeRoofFocused: {
    borderBottomColor: '#fff',
  },
  homeBase: {
    width: 24,
    height: 16,
    backgroundColor: '#8E9BA8',
    borderRadius: 2,
  },
  homeBaseFocused: {
    backgroundColor: '#fff',
  },
  homeDoor: {
    width: 8,
    height: 10,
    backgroundColor: '#161B24',
    position: 'absolute',
    bottom: 0,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  homeDoorFocused: {
    backgroundColor: '#2a3647',
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
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#161B24',
  },
  sosHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
  },
});