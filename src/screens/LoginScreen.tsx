// src/screens/LoginScreen.tsx
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      const message =
        err?.response?.status === 401
          ? 'Invalid email or password'
          : err?.message || 'Login failed. Is the server running?';
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#6294A1', '#151A23']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 0.45]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Logo / Title */}
          <View style={styles.header}>
            <Text style={styles.appName}>DEEPEN</Text>
            <Text style={styles.subtitle}>Transparency for Patients at Home</Text>
          </View>

          {/* Login Form */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. patient@home.fi"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!loading}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              editable={!loading}
              onSubmitEditing={handleLogin}
            />

            <Pressable
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Log In</Text>
              )}
            </Pressable>

            {/* Demo accounts hint */}
            <View style={styles.demoHint}>
              <Text style={styles.demoHintTitle}>Demo Accounts</Text>
              <Text style={styles.demoHintText}>patient@home.fi / password123</Text>
              <Text style={styles.demoHintText}>family@home.fi / password123</Text>
              <Text style={styles.demoHintText}>dr.smith@hospital.fi / password123</Text>
              <Text style={styles.demoHintText}>nurse.korhonen@hospital.fi / password123</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 6,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(42, 54, 71, 0.8)',
    borderRadius: 20,
    padding: 24,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(22, 27, 36, 0.6)',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(127, 179, 213, 0.2)',
  },
  loginButton: {
    backgroundColor: '#7FB3D5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  demoHint: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  demoHintTitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  demoHintText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    marginBottom: 2,
  },
});
