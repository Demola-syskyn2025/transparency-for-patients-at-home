//src/screens/HomeScreen.tsx
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { AppointmentService } from '../services/appointments';
import type { ChecklistService } from '../services/checklist';
import type { ChecklistItem } from '../utils/checklist';
import type { Appointment } from '../utils/types';

// Appointment Icon Component (Document with clock)
const AppointmentIcon = () => (
  <View style={styles.appointmentIcon}>
    {/* Document shape */}
    <View style={styles.iconDocumentShape}>
      <View style={styles.iconDocumentTop} />
      <View style={styles.iconDocumentBody} />
    </View>
    {/* Lines inside document */}
    <View style={styles.iconLines}>
      <View style={styles.iconLine1} />
      <View style={styles.iconLine2} />
    </View>
    {/* Clock circle at bottom right */}
    <View style={styles.iconClockOuter}>
      <View style={styles.iconClockHand} />
    </View>
  </View>
);

// Checklist Icon Component (Square with checkmarks)
const ChecklistIcon = () => (
  <View style={styles.checklistIcon}>
    {/* Outer square border */}
    <View style={styles.checklistSquare} />
    {/* First checkmark line */}
    <View style={styles.checkmark1Container}>
      <View style={styles.checkmark1Short} />
      <View style={styles.checkmark1Long} />
    </View>
    {/* Horizontal lines */}
    <View style={styles.checklistLines}>
      <View style={styles.checklistLine1} />
      <View style={styles.checklistLine2} />
    </View>
    {/* Second checkmark */}
    <View style={styles.checkmark2Container}>
      <View style={styles.checkmark2Short} />
      <View style={styles.checkmark2Long} />
    </View>
  </View>
);

export default function HomeScreen({ 
  role, 
  patientId,
  appointmentService,
  checklistService,
}: { 
  role: 'patient' | 'family';
  patientId: string;
  appointmentService: AppointmentService;
  checklistService: ChecklistService;
}) {
  const navigation = useNavigation<any>();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    appointmentService.listByPatient(patientId).then(setAppointments);
    checklistService.listByPatient(patientId).then(setChecklistItems);
  }, [patientId]);

  // Get next appointment
  const nextAppointment = useMemo(() => {
    const now = new Date();
    return [...appointments]
      .filter(a => new Date(a.startAt) >= now)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];
  }, [appointments]);

  // Get today's pending tasks
  const todaysTasks = useMemo(() => {
    const today = new Date();
    return checklistItems.filter(item => {
      const dueDate = new Date(item.dueAt);
      return dueDate.toDateString() === today.toDateString() && !item.done;
    }).slice(0, 3);
  }, [checklistItems]);

  const handleAppointmentPress = () => {
    if (role === 'patient') {
      navigation.navigate('PatientAppointment');
    } else {
      navigation.navigate('Appointments');
    }
  };

  const handleChecklistPress = () => {
    navigation.navigate('Checklist');
  };

  const handleTabNavigation = (screen: string) => {
    navigation.navigate(screen as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#6294A1', '#151A23']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 0.29]}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
          {/* Reminder Card */}
          <View style={styles.reminderCard}>
            {/* Reminder Header */}
            <View style={styles.reminderHeader}>
              <Text style={styles.reminderHeaderTitle}>REMINDER</Text>
            </View>
            
            {/* Reminder Content */}
            <View style={styles.reminderContent}>
              {nextAppointment && (
                <>
                  <Text style={styles.reminderTitle}>
                    Appointment with doctor {nextAppointment.assignedStaff?.[0]?.name?.split(' ')[1] || 'Phils'}{' '}
                    {new Date(nextAppointment.startAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </Text>
                  {todaysTasks.length > 0 && (
                    <View style={styles.reminderTasks}>
                      {todaysTasks.map((task, index) => (
                        <Text key={task.id} style={styles.reminderTask}>{task.text}</Text>
                      ))}
                    </View>
                  )}
                </>
              )}
              {!nextAppointment && todaysTasks.length > 0 && (
                <View style={styles.reminderTasks}>
                  <Text style={styles.reminderTitle}>Today's Tasks</Text>
                  {todaysTasks.map((task) => (
                    <Text key={task.id} style={styles.reminderTask}>{task.text}</Text>
                  ))}
                </View>
              )}
              {!nextAppointment && todaysTasks.length === 0 && (
                <Text style={styles.reminderTitle}>No reminders for today</Text>
              )}
            </View>
          </View>

          {/* Appointment Card */}
          <Pressable style={styles.card} onPress={handleAppointmentPress}>
            <View style={styles.cardIcon}>
              <AppointmentIcon />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Appointment</Text>
              {nextAppointment && (
                <>
                  <Text style={styles.cardDetail}>
                    Doctor: <Text style={styles.cardDetailBold}>{nextAppointment.assignedStaff?.[0]?.name || 'N/A'}</Text>
                  </Text>
                  <Text style={styles.cardDetail}>
                    Date: <Text style={styles.cardDetailBold}>
                      {new Date(nextAppointment.startAt).toLocaleDateString('en-GB')}
                    </Text>
                  </Text>
                  <Text style={styles.cardDetail}>
                    Time: <Text style={styles.cardDetailBold}>
                      {new Date(nextAppointment.startAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </Text>
                  </Text>
                </>
              )}
              {!nextAppointment && (
                <Text style={styles.cardDetail}>No upcoming appointments</Text>
              )}
            </View>
            <View style={styles.cardArrow}>
              <Text style={styles.arrowText}>››</Text>
            </View>
          </Pressable>

          {/* Checklist Card */}
          <Pressable style={styles.card} onPress={handleChecklistPress}>
            <View style={styles.cardIcon}>
              <ChecklistIcon />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Checklist</Text>
              {todaysTasks.length > 0 ? (
                todaysTasks.map((task, index) => (
                  <Text key={task.id} style={styles.cardDetail}>• {task.text}</Text>
                ))
              ) : (
                <Text style={styles.cardDetail}>All tasks completed! 🎉</Text>
              )}
            </View>
            <View style={styles.cardArrow}>
              <Text style={styles.arrowText}>››</Text>
            </View>
          </Pressable>
        </ScrollView>

        {/* Bottom Navigation Bar */}
        {false && (
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => handleTabNavigation('Profile')}
          >
            <View style={styles.profileIcon}>
              <View style={styles.profileHead} />
              <View style={styles.profileBody} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => handleTabNavigation('Chat')}
          >
            <View style={styles.chatIconNav}>
              <View style={styles.chatBubble} />
              <View style={styles.chatTail} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.navButton, styles.sosButton]}
            onPress={() => handleTabNavigation('SOS')}
          >
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
        </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  reminderCard: {
    marginHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 40,
    marginBottom: 30,
    backgroundColor: 'rgba(42, 54, 71, 0.8)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  reminderHeader: {
    backgroundColor: '#141F33',
    paddingVertical: 12,
    alignItems: 'center',
  },
  reminderHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
  },
  reminderContent: {
    padding: 20,
    alignItems: 'center',
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  reminderTasks: {
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  reminderTask: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
    textAlign: 'center',
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(42, 54, 71, 0.6)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  cardDetail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  cardDetailBold: {
    fontWeight: '600',
    color: '#fff',
  },
  cardArrow: {
    marginLeft: 12,
  },
  arrowText: {
    fontSize: 24,
    color: '#7FB3D5',
    fontWeight: '600',
  },
  checklistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  // Appointment Icon Styles (Document with clock SVG)
  appointmentIcon: {
    width: 40,
    height: 40,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconDocumentShape: {
    width: 28,
    height: 32,
    position: 'absolute',
    top: 0,
    left: 4,
  },
  iconDocumentTop: {
    width: 28,
    height: 32,
    backgroundColor: '#fff',
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  iconDocumentBody: {
    width: 28,
    height: 26,
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
  },
  iconLines: {
    position: 'absolute',
    top: 8,
    left: 10,
  },
  iconLine1: {
    width: 14,
    height: 2,
    backgroundColor: '#7FB3D5',
    marginBottom: 3,
  },
  iconLine2: {
    width: 10,
    height: 2,
    backgroundColor: '#7FB3D5',
  },
  iconClockOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#7FB3D5',
    position: 'absolute',
    bottom: 2,
    right: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconClockHand: {
    width: 1.5,
    height: 5,
    backgroundColor: '#7FB3D5',
    position: 'absolute',
    top: 2,
    borderRadius: 1,
  },
  // Checklist Icon Styles (Square with checkmarks SVG)
  checklistIcon: {
    width: 40,
    height: 40,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checklistSquare: {
    width: 32,
    height: 32,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#fff',
    position: 'absolute',
  },
  checkmark1Container: {
    position: 'absolute',
    top: 8,
    left: 6,
    flexDirection: 'row',
  },
  checkmark1Short: {
    width: 3,
    height: 6,
    backgroundColor: '#22c55e',
    transform: [{ rotate: '-45deg' }],
    marginRight: -1.5,
  },
  checkmark1Long: {
    width: 3,
    height: 10,
    backgroundColor: '#22c55e',
    transform: [{ rotate: '45deg' }],
  },
  checklistLines: {
    position: 'absolute',
    top: 11,
    right: 8,
  },
  checklistLine1: {
    width: 12,
    height: 2,
    backgroundColor: '#2a3647',
    marginBottom: 2,
    borderRadius: 1,
  },
  checklistLine2: {
    width: 12,
    height: 2,
    backgroundColor: '#2a3647',
    borderRadius: 1,
  },
  checkmark2Container: {
    position: 'absolute',
    bottom: 7,
    left: 6,
    flexDirection: 'row',
  },
  checkmark2Short: {
    width: 3,
    height: 6,
    backgroundColor: '#22c55e',
    transform: [{ rotate: '-45deg' }],
    marginRight: -1.5,
  },
  checkmark2Long: {
    width: 3,
    height: 10,
    backgroundColor: '#22c55e',
    transform: [{ rotate: '45deg' }],
  },
  // Bottom Navigation Styles
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 90 : 70,
    backgroundColor: '#2a3647',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 30 : 0,
  },
  navButton: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  sosButton: {
    backgroundColor: '#FF4444',
  },
  sosText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Profile Icon for Nav
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
  profileBody: {
    width: 20,
    height: 14,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#8E9BA8',
  },
  // Chat Icon for Nav
  chatIconNav: {
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
  chatTail: {
    width: 6,
    height: 6,
    backgroundColor: '#8E9BA8',
    position: 'absolute',
    bottom: 5,
    right: 2,
    transform: [{ rotate: '45deg' }],
  },
});
