// App.tsx

import React, { useMemo } from 'react';

import { NavigationContainer } from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { ActivityIndicator, View, Text } from 'react-native';



import { AuthProvider, useAuth } from './src/context/AuthContext';

import LoginScreen from './src/screens/LoginScreen';



// Patient screens

import HomeScreen from './src/screens/HomeScreen';

import ChecklistScreen from './src/screens/ChecklistScreen';

import PatientAppointmentScreen from './src/screens/PatientAppointmentScreen';

import PatientOverviewScreen from './src/screens/PatientOverviewScreen';



// Family screens

import FamilyDashboardScreen from './src/screens/FamilyDashboardScreen';



// Staff screens

import StaffDashboardScreen from './src/screens/StaffDashboardScreen';

import MyPatientsScreen from './src/screens/MyPatientsScreen';

import PlanScheduleScreen from './src/screens/PlanScheduleScreen';



// Shared screens

import AppointmentsScreen from './src/screens/AppointmentsScreen';

import ProfileScreen from './src/screens/ProfileScreen';

import ChatScreen from './src/screens/ChatScreen';

import AppointmentDetailScreen from './src/screens/AppointmentDetailScreen';

import AppointmentHistoryScreen from './src/screens/AppointmentHistoryScreen';

import CareVisitSummariesScreen from './src/screens/CareVisitSummariesScreen';

import HomecareVisitSummaryScreen from './src/screens/HomecareVisitSummaryScreen';



import { AppointmentApiService } from './src/services/appointmentApi';

import { ChecklistApiService } from './src/services/checklistApi';

import { VisitSummaryApiService } from './src/services/visitSummaryApi';



const Tab = createBottomTabNavigator();

const Stack = createNativeStackNavigator();



type AppRole = 'patient' | 'family' | 'staff';



function mapRole(backendRole: string): AppRole {

  if (backendRole === 'PATIENT') return 'patient';

  if (backendRole === 'FAMILY_MEMBER') return 'family';

  return 'staff'; // DOCTOR, NURSE

}



const TAB_STYLE = {

  tabBarStyle: { backgroundColor: '#1F2937', borderTopColor: 'rgba(255,255,255,0.1)' },

  tabBarActiveTintColor: '#7FB3D5',

  tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',

  headerStyle: { backgroundColor: '#161B24' },

  headerTintColor: '#fff',

};



// ===================== PATIENT TABS =====================

function PatientTabs({ patientId, uid, apptService, checklistService }: any) {

  return (

    <Tab.Navigator screenOptions={TAB_STYLE}>

      <Tab.Screen name="Home" options={{ headerShown: false }}>

        {() => (

          <HomeScreen

            role="patient"

            patientId={patientId}

            appointmentService={apptService}

            checklistService={checklistService}

          />

        )}

      </Tab.Screen>

      <Tab.Screen name="Appointments" options={{ title: 'My Appointments' }}>

        {() => <PatientAppointmentScreen patientId={patientId} service={apptService} />}

      </Tab.Screen>

      <Tab.Screen name="Checklist">

        {() => <ChecklistScreen patientId={patientId} uid={uid} service={checklistService} role="patient" />}

      </Tab.Screen>

      <Tab.Screen name="Chat" options={{ headerShown: false }}>

        {() => <ChatScreen />}

      </Tab.Screen>

      <Tab.Screen name="Profile" options={{ headerShown: false }}>

        {() => <ProfileScreen />}

      </Tab.Screen>

    </Tab.Navigator>

  );

}



// ===================== FAMILY TABS =====================

function FamilyTabs({ userId, apptService, visitSummaryService }: any) {

  return (

    <Tab.Navigator screenOptions={TAB_STYLE}>

      <Tab.Screen name="Dashboard" options={{ headerShown: false }}>

        {() => <FamilyDashboardScreen userId={userId} />}

      </Tab.Screen>

      <Tab.Screen name="Appointments">

        {() => <AppointmentsScreen role="family" patientId={userId} service={apptService} uid={userId} />}

      </Tab.Screen>

      <Tab.Screen name="Summaries" options={{ title: 'Visit Summaries' }}>

        {() => <CareVisitSummariesScreen patientId={userId} service={visitSummaryService} />}

      </Tab.Screen>

      <Tab.Screen name="Chat" options={{ headerShown: false }}>

        {() => <ChatScreen />}

      </Tab.Screen>

      <Tab.Screen name="Profile" options={{ headerShown: false }}>

        {() => <ProfileScreen />}

      </Tab.Screen>

    </Tab.Navigator>

  );

}



// ===================== STAFF TABS =====================

function StaffTabs({ staffId, apptService }: any) {

  return (

    <Tab.Navigator screenOptions={TAB_STYLE}>

      <Tab.Screen name="Dashboard" options={{ headerShown: false }}>

        {() => <StaffDashboardScreen staffId={staffId} />}

      </Tab.Screen>

      <Tab.Screen name="My Patients">

        {() => <MyPatientsScreen staffId={staffId} />}

      </Tab.Screen>

      <Tab.Screen name="Plan" options={{ title: 'Plan Week' }}>

        {() => <PlanScheduleScreen staffId={staffId} />}

      </Tab.Screen>

      <Tab.Screen name="Schedule" options={{ title: 'All Appointments' }}>

        {() => <AppointmentsScreen role="family" patientId={staffId} service={apptService} uid={staffId} />}

      </Tab.Screen>

      <Tab.Screen name="Profile" options={{ headerShown: false }}>

        {() => <ProfileScreen />}

      </Tab.Screen>

    </Tab.Navigator>

  );

}



// ===================== AUTHENTICATED APP =====================

function AuthenticatedApp() {

  const { user } = useAuth();



  const userId = String(user!.id);

  const role = mapRole(user!.role);



  const apptService = useMemo(() => new AppointmentApiService(), []);

  const checklistService = useMemo(() => new ChecklistApiService(), []);

  const visitSummaryService = useMemo(() => new VisitSummaryApiService(userId), [userId]);



  return (

    <NavigationContainer>

      <Stack.Navigator

        screenOptions={{

          headerStyle: { backgroundColor: '#161B24' },

          headerTintColor: '#fff',

        }}

      >

        {/* Role-based root tabs */}

        <Stack.Screen name="RootTabs" options={{ headerShown: false }}>

          {() => {

            if (role === 'patient') {

              return (

                <PatientTabs

                  patientId={userId}

                  uid={userId}

                  apptService={apptService}

                  checklistService={checklistService}

                />

              );

            }

            if (role === 'family') {

              return (

                <FamilyTabs

                  userId={userId}

                  apptService={apptService}

                  visitSummaryService={visitSummaryService}

                />

              );

            }

            return <StaffTabs staffId={userId} apptService={apptService} />;

          }}

        </Stack.Screen>



        {/* Shared stack screens */}

        <Stack.Screen name="AppointmentDetail" options={{ title: 'Appointment Details' }}>

          {(props: any) => (

            <AppointmentDetailScreen

              route={props.route}

              role={role}

            />

          )}

        </Stack.Screen>



        <Stack.Screen name="PatientAppointment" options={{ title: 'My Appointments' }}>

          {() => <PatientAppointmentScreen patientId={userId} service={apptService} />}

        </Stack.Screen>



        <Stack.Screen name="AppointmentHistory" options={{ title: 'Appointment History' }}>

          {() => <AppointmentHistoryScreen patientId={userId} service={apptService} />}

        </Stack.Screen>



        <Stack.Screen name="CareVisitSummaries" options={{ title: 'Visit Summaries' }}>

          {() => <CareVisitSummariesScreen patientId={userId} service={visitSummaryService} />}

        </Stack.Screen>



        <Stack.Screen name="HomecareVisitSummary" options={{ title: 'Visit Summary' }}>

          {(props: any) => (

            <HomecareVisitSummaryScreen

              route={props.route}

              role={role === 'patient' ? 'patient' : 'family'}

            />

          )}

        </Stack.Screen>



        <Stack.Screen name="MyPatients" options={{ title: 'My Patients' }}>

          {() => <MyPatientsScreen staffId={userId} />}

        </Stack.Screen>



        <Stack.Screen name="PatientOverview" options={({ route }: any) => ({ title: route.params?.patientName || 'Patient' })}>

          {(props: any) => <PatientOverviewScreen route={props.route} />}

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



// ===================== ROOT =====================

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