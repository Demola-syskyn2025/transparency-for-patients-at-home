import { useNavigation } from '@react-navigation/native';
import React from "react";
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, View } from "react-native";

/// Profile screen with role switcher

interface ProfileScreenProps {
    role?: 'patient' | 'family';
    onRoleChange?: (role: 'patient' | 'family') => void;
}

export default function ProfileScreen({ role = 'patient', onRoleChange }: ProfileScreenProps) {
    const navigation = useNavigation<any>();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.appName}>HOMECARE</Text>
                {/* Header with checkmark */}
                <View style={styles.header}>
                    <Pressable 
                        style={styles.checkmarkContainer}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Text style={styles.checkmark}>✓</Text>
                    </Pressable>
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    {role === 'patient' && (
                        <>
                            <View style={styles.avatarContainer}>
                                <View style={styles.avatar}>
                                    <View style={styles.avatarHead} />
                                    <View style={styles.avatarBody} />
                                </View>
                            </View>
                            <Text style={styles.name}>Shai Alexander</Text>
                        </>
                    )}

                    <Pressable 
                        style={styles.menuButton}
                        onPress={() => navigation.navigate('ProfileInfo')}
                    >
                        <Text style={styles.menuButtonText}>{role === 'patient' ? 'My Info' : 'My Parent Info'}</Text>
                        <Text style={styles.menuButtonArrow}>›</Text>
                    </Pressable>

                    {/* Medical ID Button */}
                    <Pressable style={styles.menuButton}>
                        <Text style={styles.menuButtonText}>Medical ID</Text>
                        <Text style={styles.menuButtonArrow}>›</Text>
                    </Pressable>

                    <Pressable style={styles.menuButton}>
                        <Text style={styles.menuButtonText}>Smart Health Devices</Text>
                        <Text style={styles.menuButtonArrow}>›</Text>
                    </Pressable>

                    <Pressable 
                        style={styles.menuButton}
                        onPress={() => navigation.navigate('CareVisitSummaries')}
                    >
                        <Text style={styles.menuButtonText}>Homecare Visit Summaries</Text>
                        <Text style={styles.menuButtonArrow}>›</Text>
                    </Pressable>

                    <Pressable 
                        style={styles.menuButton}
                        onPress={() => navigation.navigate('AppointmentHistory')}
                    >
                        <Text style={styles.menuButtonText}>Appointment History</Text>
                        <Text style={styles.menuButtonArrow}>›</Text>
                    </Pressable>
                </View>

                {/* Role Switcher at Bottom */}
                <View style={styles.roleSwitcher}>
                    <Text style={styles.roleLabel}>Patient</Text>
                    <Switch 
                        value={role === 'family'} 
                        onValueChange={(v: boolean) => onRoleChange?.(v ? 'family' : 'patient')}
                        trackColor={{ false: '#3e4a59', true: '#7FB3D5' }}
                        thumbColor={'#fff'}
                    />
                    <Text style={styles.roleLabel}>Family</Text>
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 40,
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    header: {
        alignItems: 'flex-end',
        marginBottom: 20,
    },
    checkmarkContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#7FB3D5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmark: {
        fontSize: 24,
        color: '#fff',
        fontWeight: 'bold',
    },
    profileCard: {
        backgroundColor: '#2D3947',
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarHead: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#2D3947',
        marginBottom: 4,
    },
    avatarBody: {
        width: 48,
        height: 36,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        backgroundColor: '#2D3947',
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 20,
    },
    infoGrid: {
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    infoLabel: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    infoValue: {
        fontSize: 15,
        color: '#fff',
        fontWeight: '500',
    },
    healthStatus: {
        fontSize: 15,
        color: '#7FB3D5',
        fontWeight: '600',
    },
    menuButton: {
        backgroundColor: '#1F2937',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    menuButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    menuButtonArrow: {
        fontSize: 28,
        color: '#7FB3D5',
        fontWeight: '300',
    },
    roleSwitcher: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: 'rgba(42, 54, 71, 0.6)',
        borderRadius: 16,
        marginTop: 10,
    },
    roleLabel: {
        fontSize: 16,
        color: '#fff',
        marginHorizontal: 12,
        fontWeight: '500',
    },
    appName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        letterSpacing: 2,
        marginBottom: 10,
    },
});