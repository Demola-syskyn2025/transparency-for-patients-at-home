// src/screens/PatientAppointmentScreen.tsx
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import type { AppointmentService } from '../services/appointments';
import type { Appointment } from '../utils/types';
import StatusBadge from '../components/appoinments/StatusBadge';

// Custom Appointment Icon Component (based on SVG design)
const AppointmentIcon = () => (
  <View style={styles.appointmentIconContainer}>
    {/* Document/Calendar body with white background for contrast */}
    <View style={styles.appointmentIconDocument}>
      {/* Horizontal lines representing text/content */}
      <View style={styles.appointmentIconLine1} />
      <View style={styles.appointmentIconLine2} />
    </View>
    {/* Clock circle with white background */}
    <View style={styles.appointmentIconClock}>
      {/* Clock hands */}
      <View style={styles.appointmentIconClockHand} />
    </View>
  </View>
);

export default function PatientAppointmentScreen({
  patientId,
  service,
}: {
  patientId: string;
  service: AppointmentService;
}) {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<Appointment[] | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    let alive = true;
    service.listByPatient(patientId).then(rows => { if (alive) setItems(rows); });
    return () => { alive = false; };
  }, [patientId, service]);

  const nextAppt = useMemo(() => {
    if (!items) return null;
    const now = new Date();
    return [...items]
      .filter(a => new Date(a.startAt) >= now)
      .sort((a,b)=> new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0] || null;
  }, [items]);

  // Set initial selected appointment to next appointment
  useEffect(() => {
    if (nextAppt && !selectedAppointment) {
      setSelectedAppointment(nextAppt);
    }
  }, [nextAppt, selectedAppointment]);

  // Function to handle day click
  const handleDayPress = (date: Date) => {
    if (!items) return;
    
    // Find appointment for this date
    const appointment = items.find(a => {
      const aDate = new Date(a.startAt);
      return aDate.toDateString() === date.toDateString();
    });
    
    if (appointment) {
      setSelectedAppointment(appointment);
    }
  };

  if (items === null) {
    return (
      <View style={[styles.container, { alignItems:'center', justifyContent:'center' }]}>
        <ActivityIndicator color="#7FB3D5" />
        <Text style={[styles.text, { marginTop: 8 }]}>Loading appointments…</Text>
      </View>
    );
  }

  if (!nextAppt) {
    return (
      <View style={[styles.container, { alignItems:'center', justifyContent:'center', padding: 16 }]}>
        <Text style={[styles.text, { fontSize: 16 }]}>No upcoming appointments</Text>
      </View>
    );
  }

  const displayedAppt = selectedAppointment || nextAppt;
  const apptDate = displayedAppt ? new Date(displayedAppt.startAt) : currentDate;
  const displayMonth = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Navigation functions
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setMonth(currentDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Generate calendar days for week view
  const generateWeekDays = () => {
    const days = [];
    const today = new Date(currentDate);
    // Get the Monday of the week containing currentDate
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    
    // Generate 7 days starting from Monday
    for (let i = 0; i < 7; i++) {
      const currentDateInLoop = new Date(monday);
      currentDateInLoop.setDate(monday.getDate() + i);
      
      const hasAppointment = items?.some(a => {
        const aDate = new Date(a.startAt);
        return aDate.toDateString() === currentDateInLoop.toDateString();
      });
      
      days.push({
        day: currentDateInLoop.getDate(),
        date: currentDateInLoop,
        isEmpty: false,
        hasAppointment,
        isSelected: displayedAppt && currentDateInLoop.toDateString() === new Date(displayedAppt.startAt).toDateString()
      });
    }
    return days;
  };

  // Generate calendar days for the month
  const generateMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Adjust for Monday start (0 = Sunday, need to make Monday = 0)
    const adjustedStart = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    
    // Add previous month's days
    for (let i = 0; i < adjustedStart; i++) {
      days.push({ day: '', isEmpty: true });
    }
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      const hasAppointment = items?.some(a => {
        const aDate = new Date(a.startAt);
        return aDate.getDate() === i && aDate.getMonth() === month && aDate.getFullYear() === year;
      });
      days.push({ 
        day: i, 
        date: dayDate,
        isEmpty: false,
        hasAppointment,
        isSelected: displayedAppt && i === new Date(displayedAppt.startAt).getDate() && month === new Date(displayedAppt.startAt).getMonth() && year === new Date(displayedAppt.startAt).getFullYear()
      });
    }
    return days;
  };

  const calendarDays = viewMode === 'week' ? generateWeekDays() : generateMonthDays();
  const phoneNumber = displayedAppt?.assignedStaff?.[0]?.phone;
  const etaStart = displayedAppt?.etaStart ? new Date(displayedAppt.etaStart) : null;
  const etaEnd = displayedAppt?.etaEnd ? new Date(displayedAppt.etaEnd) : null;
  const etaUpdatedAt = displayedAppt?.etaUpdatedAt ? new Date(displayedAppt.etaUpdatedAt) : null;
  const apptEndRef = displayedAppt?.endAt ? new Date(displayedAppt.endAt) : apptDate;
  const isPast = apptEndRef.getTime() < Date.now();
  const showCompleted = isPast && (displayedAppt?.status === 'scheduled' || displayedAppt?.status === 'rescheduled');

  return (
    <View style={styles.container}>
      {/* Header with safe area padding */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{"<"}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>APPOINTMENTS</Text>
        <View style={styles.backButton} />
      </View>

      {/* View Mode Toggle */}
      <View style={styles.toggleContainer}>
        <Pressable 
          style={[styles.toggleButton, viewMode === 'week' && styles.toggleButtonActive]}
          onPress={() => setViewMode('week')}
        >
          <Text style={[styles.toggleText, viewMode === 'week' && styles.toggleTextActive]}>Week</Text>
        </Pressable>
        <Pressable 
          style={[styles.toggleButton, viewMode === 'month' && styles.toggleButtonActive]}
          onPress={() => setViewMode('month')}
        >
          <Text style={[styles.toggleText, viewMode === 'month' && styles.toggleTextActive]}>Month</Text>
        </Pressable>
      </View>

      {/* Calendar Navigation */}
      <View style={styles.calendarNav}>
        <Pressable onPress={handlePrevious}>
          <Text style={styles.navButton}>{"< Prev"}</Text>
        </Pressable>
        <Text style={styles.monthText}>{displayMonth}</Text>
        <Pressable onPress={handleNext}>
          <Text style={styles.navButton}>{"Next >"}</Text>
        </Pressable>
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarContainer}>
        <View style={styles.weekdayRow}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <Text key={day} style={styles.weekdayText}>{day}</Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {calendarDays.map((item, index) => (
            <View key={index} style={styles.dayCell}>
              {!item.isEmpty && (
                <Pressable 
                  onPress={() => item.hasAppointment && item.date && handleDayPress(item.date)}
                  disabled={!item.hasAppointment}
                  style={[
                    styles.dayCircle,
                    item.isSelected && styles.dayCircleSelected,
                    item.hasAppointment && !item.isSelected && styles.dayCircleHasAppt
                  ]}
                >
                  <Text style={[
                    styles.dayText,
                    item.isSelected && styles.dayTextSelected
                  ]}>
                    {item.day}
                  </Text>
                  {item.hasAppointment && (
                    <AppointmentIcon />
                  )}
                </Pressable>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Details Section - Scrollable */}
      <ScrollView style={styles.detailsScrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>Details</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Doctor:</Text>
          <Text style={styles.detailValue}>{displayedAppt.assignedStaff?.[0]?.name || 'N/A'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>
            {apptDate.toLocaleDateString('en-GB')}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Time:</Text>
          <Text style={styles.detailValue}>
            {apptDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status:</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ marginRight: 8 }}>
              <StatusBadge status={displayedAppt.status ?? 'scheduled'} />
            </View>
            {showCompleted ? <StatusBadge status={'completed'} /> : null}
          </View>
        </View>

        {etaStart && etaEnd && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ETA:</Text>
            <Text style={styles.detailValue}>
              {etaStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
              –
              {etaEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
              {etaUpdatedAt ? `  (updated ${etaUpdatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}
            </Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type:</Text>
          <Text style={styles.detailValue}>{displayedAppt.title}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Phone Number:</Text>
          <Text style={styles.detailValue}>{phoneNumber || 'N/A'}</Text>
        </View>

        {displayedAppt.notes && (
          <View style={[styles.detailRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
            <Text style={styles.detailLabel}>Medicine:</Text>
            <Text style={styles.detailValue}>{displayedAppt.notes}</Text>
          </View>
        )}

        <View style={styles.doctorNoteContainer}>
          <Text style={styles.doctorNoteLabel}>Doctor note:</Text>
          <Text style={styles.doctorNoteText}>
            {displayedAppt.reasonForChange || "Please DO NOT drink coffee or eat solid food 3hr before appointment"}
          </Text>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161B24',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  text: {
    color: '#fff',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
    gap: 8,
  },
  toggleButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  toggleButtonActive: {
    backgroundColor: '#7FB3D5',
  },
  toggleText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#2C3E50',
  },
  calendarNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  navButton: {
    color: '#7FB3D5',
    fontSize: 14,
    fontWeight: '600',
  },
  monthText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  calendarContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    width: 40,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayCircleSelected: {
    backgroundColor: '#7FB3D5',
  },
  dayCircleHasAppt: {
    backgroundColor: 'rgba(127, 179, 213, 0.3)',
  },
  dayText: {
    color: '#fff',
    fontSize: 14,
  },
  dayTextSelected: {
    color: '#2C3E50',
    fontWeight: '700',
  },
  appointmentIconContainer: {
    position: 'absolute',
    bottom: -2,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentIconDocument: {
    position: 'absolute',
    width: 13,
    height: 15,
    backgroundColor: '#fff',
    borderRadius: 1.5,
    justifyContent: 'center',
    paddingHorizontal: 2.5,
    paddingVertical: 3,
    borderWidth: 1.5,
    borderColor: '#2C3E50',
  },
  appointmentIconLine1: {
    width: 8,
    height: 1.5,
    backgroundColor: '#7FB3D5',
    marginBottom: 2,
    borderRadius: 0.5,
  },
  appointmentIconLine2: {
    width: 5,
    height: 1.5,
    backgroundColor: '#7FB3D5',
    borderRadius: 0.5,
  },
  appointmentIconClock: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#2C3E50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentIconClockHand: {
    position: 'absolute',
    width: 1.5,
    height: 4,
    backgroundColor: '#7FB3D5',
    top: 2,
    borderRadius: 0.5,
  },
  detailsScrollContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  detailsContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailsTitle: {
    color: '#7FB3D5',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  doctorNoteContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  doctorNoteLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 4,
  },
  doctorNoteText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
  },
});
