// App.tsx
import React, { useMemo, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import AppointmentsScreen from './src/screens/AppointmentsScreen';
import ChecklistScreen from './src/screens/ChecklistScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ChatScreen from './src/screens/ChatScreen';
import AppointmentDetailScreen from './src/screens/AppointmentDetailScreen';
import AppointmentHistoryScreen from './src/screens/AppointmentHistoryScreen';
import CareVisitSummariesScreen from './src/screens/CareVisitSummariesScreen';
import HomecareVisitSummaryScreen from './src/screens/HomecareVisitSummaryScreen';

import { AppointmentApiService } from './src/services/appointmentApi';
import { ChecklistApiService } from './src/services/checklistApi';
import { VisitSummaryApiService } from './src/services/visitSummaryApi';
import type { AppointmentService } from './src/services/appointments';
import type { ChecklistService } from './src/services/checklist';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Map backend roles to frontend role concept
function mapRole(backendRole: string): 'patient' | 'family' {
  if (backendRole === 'PATIENT') return 'patient';
  return 'family'; // FAMILY_MEMBER, DOCTOR, NURSE all see "family" view for now
}

function RootTabs({
  role,
  patientId,
  uid,
  apptService,
  checklistService,
}: {
  role: 'patient' | 'family';
  patientId: string;
  uid: string;
  apptService: AppointmentService;
  checklistService: ChecklistService;
}) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: '#1F2937', borderTopColor: 'rgba(255,255,255,0.1)' },
        tabBarActiveTintColor: '#7FB3D5',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        headerStyle: { backgroundColor: '#161B24' },
        headerTintColor: '#fff',
      }}
    >
      <Tab.Screen name="Home" options={{ headerShown: false }}>
        {() => (
          <HomeScreen
            role={role}
            patientId={patientId}
            appointmentService={apptService}
            checklistService={checklistService}
          />
        )}
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

      <Tab.Screen name="Checklist">
        {() => (
          <ChecklistScreen
            patientId={patientId}
            uid={uid}
            service={checklistService}
            role={role}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="Profile" options={{ headerShown: false }}>
        {() => <ProfileScreen />}
      </Tab.Screen>

      <Tab.Screen name="Chat" options={{ headerShown: false }}>
        {() => <ChatScreen />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function AuthenticatedApp() {
  const { user, logout } = useAuth();

  // Derive patientId and role from authenticated user
  const patientId = String(user!.id);
  const uid = String(user!.id);
  const role = mapRole(user!.role);

  // Create API services (memoized so they don't recreate on every render)
  const apptService = useMemo(() => new AppointmentApiService(), []);
  const checklistService = useMemo(() => new ChecklistApiService(), []);
  const visitSummaryService = useMemo(
    () => new VisitSummaryApiService(patientId),
    [patientId]
  );

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#161B24' },
          headerTintColor: '#fff',
        }}
      >
        <Stack.Screen name="RootTabs" options={{ headerShown: false }}>
          {() => (
            <RootTabs
              role={role}
              patientId={patientId}
              uid={uid}
              apptService={apptService}
              checklistService={checklistService}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="AppointmentDetail" options={{ title: 'Appointment Details' }}>
          {(props: any) => (
            <AppointmentDetailScreen
              route={props.route}
              service={apptService}
              patientId={patientId}
              role={role}
              visitSummaryService={visitSummaryService}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="PatientAppointment" options={{ title: 'My Appointments' }}>
          {() => {
            const PatientAppointmentScreen = require('./src/screens/PatientAppointmentScreen').default;
            return <PatientAppointmentScreen patientId={patientId} service={apptService} />;
          }}
        </Stack.Screen>

        <Stack.Screen name="AppointmentHistory" options={{ title: 'Appointment History' }}>
          {() => (
            <AppointmentHistoryScreen
              patientId={patientId}
              service={apptService}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="CareVisitSummaries" options={{ title: 'Visit Summaries' }}>
          {() => (
            <CareVisitSummariesScreen
              patientId={patientId}
              service={visitSummaryService}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="HomecareVisitSummary" options={{ title: 'Visit Summary' }}>
          {(props: any) => (
            <HomecareVisitSummaryScreen
              route={props.route}
              role={role}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="ProfileInfo" options={{ title: 'My Info' }}>
          {() => (
            <View style={{ flex: 1, backgroundColor: '#161B24', padding: 20 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 }}>Profile Info</Text>
              <Text style={{ color: '#fff', marginBottom: 8 }}>Name: {user?.firstName} {user?.lastName}</Text>
              <Text style={{ color: '#fff', marginBottom: 8 }}>Email: {user?.email}</Text>
              <Text style={{ color: '#fff', marginBottom: 8 }}>Phone: {user?.phoneNumber || 'N/A'}</Text>
              <Text style={{ color: '#fff', marginBottom: 8 }}>Role: {user?.role}</Text>
            </View>
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#151A23', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7FB3D5" />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}