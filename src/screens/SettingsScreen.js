import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, Switch, TouchableOpacity, StyleSheet, Alert, Platform
} from 'react-native';
import axios from 'axios';
import io from 'socket.io-client';

// --- CONFIG: sẽ điều chỉnh lại theo backend
const BACKEND_BASE = 'https://your-backend.example.com'; // REST API
const SOCKET_URL = 'https://your-backend.example.com';   // socket.io url
const SOS_ENDPOINT = `${BACKEND_BASE}/api/sos`; // POST body includes camera/user info

export default function SettingsScreen({ navigation }) {
  const [fallEnabled, setFallEnabled] = useState(true); // mặc định On
  const [motionlessHours, setMotionlessHours] = useState(0); // mặc định 0 (off)
  const [monitoring, setMonitoring] = useState(false);
  const socketRef = useRef(null);
  const lastMovementRef = useRef(Date.now());
  const motionTimerRef = useRef(null);

  // Example camera info (do user cung cấp trong 1 màn hình khác)
  const cameraInfo = {
    provider: 'RTSP', // or 'EZVIZ' etc. (just metadata)
    url: 'rtsp://user:pass@192.168.1.100:554/stream1',
    name: 'Living Room Cam',
    userId: 'user-123'
  };

  // Kết nối socket để nhận event từ backend khi backend phát hiện (té ngã hoặc không chuyển động))
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });

    socketRef.current.on('connect', () => {
      console.log('socket connected', socketRef.current.id);
      // optionally join room: identify this client
      socketRef.current.emit('identify', { userId: cameraInfo.userId });
    });

    // backend gửi sự kiện khi phát hiện (fall or motionless)
    socketRef.current.on('detection', handleDetectionEvent);

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    // update monitoring on change of settings
    if (fallEnabled || motionlessHours > 0) {
      startMonitoring();
    } else {
      stopMonitoring();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fallEnabled, motionlessHours]);

  function handleDetectionEvent(event) {
    // event example: { type: 'fall' | 'motionless', camera: {...}, timestamp: ... }
    console.log('detection event', event);
    Alert.alert('Cảnh báo', `Phát hiện: ${event.type}`);
    // gửi SOS tới backend (nếu cần)
    sendSOS({ reason: event.type, camera: event.camera || cameraInfo });
  }

  async function sendSOS({ reason = 'unknown', camera = cameraInfo }) {
    try {
      const body = {
        userId: cameraInfo.userId,
        cameraName: camera.name,
        cameraUrl: camera.url,
        reason,
        timestamp: new Date().toISOString(),
      };
      await axios.post(SOS_ENDPOINT, body);
      console.log('SOS sent', body);
    } catch (err) {
      console.error('Failed sending SOS', err);
    }
  }

  // Gửi lệnh yêu cầu backend bắt đầu theo dõi camera với 2 loại detection
  async function startMonitoring() {
    try {
      if (monitoring) {
        // already started -> update settings
        await axios.post(`${BACKEND_BASE}/api/monitor/update`, {
          userId: cameraInfo.userId,
          camera: cameraInfo,
          fallEnabled,
          motionlessHours
        });
        console.log('monitoring updated');
        return;
      }

      // start monitoring
      const res = await axios.post(`${BACKEND_BASE}/api/monitor/start`, {
        userId: cameraInfo.userId,
        camera: cameraInfo,
        fallEnabled,
        motionlessHours
      });
      if (res.status === 200) {
        setMonitoring(true);
        console.log('monitoring started');
      }
    } catch (err) {
      console.error('startMonitoring error', err);
      Alert.alert('Lỗi', 'Không thể bắt đầu theo dõi. Kiểm tra kết nối backend / thông tin camera.');
    }
  }

  async function stopMonitoring() {
    try {
      if (!monitoring) return;
      await axios.post(`${BACKEND_BASE}/api/monitor/stop`, {
        userId: cameraInfo.userId,
        camera: cameraInfo
      });
      setMonitoring(false);
      console.log('monitoring stopped');
    } catch (err) {
      console.error('stopMonitoring error', err);
    }
  }

  // Backend gửi event "movement" mỗi khi có chuyển động.
  useEffect(() => {
    if (motionlessHours > 0) {
      // set timer check mỗi 5 phút
      clearInterval(motionTimerRef.current);
      motionTimerRef.current = setInterval(() => {
        const msPassed = Date.now() - lastMovementRef.current;
        const hoursPassed = msPassed / (1000 * 60 * 60);
        if (hoursPassed >= motionlessHours) {
          // trigger SOS (local)
          Alert.alert('Alert', `Motionless in ${motionlessHours} hour(s)`);
          sendSOS({ reason: `motionless_${motionlessHours}h` });
        }
      }, 5 * 60 * 1000);
    } else {
      if (motionTimerRef.current) {
        clearInterval(motionTimerRef.current);
        motionTimerRef.current = null;
      }
    }
    return () => {
      if (motionTimerRef.current) {
        clearInterval(motionTimerRef.current);
      }
    };
  }, [motionlessHours]);

  // Nếu backend gửi event 'movement' cập nhật lastMovement
  useEffect(() => {
    if (!socketRef.current) return;
    socketRef.current.on('movement', (info) => {
      // example { cameraId, timestamp }
      lastMovementRef.current = Date.now();
    });
    return () => {
      if (socketRef.current) {
        socketRef.current.off('movement');
      }
    };
  }, []);

  // UI small helpers
  function toggleFall(value) {
    setFallEnabled(value);
  }

  function pickMotionHours(value) {
    setMotionlessHours(value);
  }

  // Simple control UI
  return (
    <View style={styles.container}>
      <Text style={styles.header}>REMINDER / SETTINGS</Text>

      <View style={styles.card}>
        <Text style={styles.title}>Fall down detection</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Fall down</Text>
          <Switch
            value={fallEnabled}
            onValueChange={toggleFall}
          />
        </View>
        <Text style={styles.help}>When enabled, the backend will monitor and send an event if a fall is detected.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Motionless (hours)</Text>
        <View style={styles.pickerRow}>
          {[0,1,3,5,10].map(v => (
            <TouchableOpacity
              key={v}
              style={[styles.option, motionlessHours === v && styles.optionActive]}
              onPress={() => pickMotionHours(v)}
            >
              <Text style={[styles.optionText, motionlessHours === v && styles.optionTextActive]}>
                {v}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.help}>0 = When hour threshold is reached and no movement will send SOS.</Text>
      </View>

      <View style={styles.bottomRow}>
        <TouchableOpacity
          style={[styles.btn, monitoring ? styles.btnStop : styles.btnStart]}
          onPress={() => {
            if (monitoring) stopMonitoring();
            else startMonitoring();
          }}
        >
          <Text style={styles.btnText}>{monitoring ? 'Stop Monitoring' : 'Start Monitoring'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => {
            // test SOS locally
            sendSOS({ reason: 'manual_test' });
            Alert.alert('Send test SOS');
          }}
        >
          <Text style={styles.btnTextSecondary}>Test SOS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding: 20, backgroundColor:'#0f1720' },
  header: { color:'#fff', fontSize:18, fontWeight:'700', textAlign:'center', marginBottom:20 },
  card: { backgroundColor:'#1b2430', borderRadius:14, padding:16, marginBottom:14, shadowColor:'#000' },
  title: { color:'#cfe7ff', fontWeight:'700', marginBottom:8 },
  row: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  label: { color:'#fff' },
  help: { color:'#9aa6b2', marginTop:8, fontSize:12 },
  pickerRow: { flexDirection:'row', justifyContent:'space-between', marginTop:8 },
  option: { paddingVertical:8, paddingHorizontal:12, borderRadius:8, backgroundColor:'#0f1720', borderWidth:1, borderColor:'#2a3945' },
  optionActive: { backgroundColor:'#0ea5a3' },
  optionText: { color:'#cfe7ff' },
  optionTextActive: { color:'#052f2e', fontWeight:'700' },
  bottomRow: { flexDirection:'row', justifyContent:'space-between', marginTop:20 },
  btn: { padding:12, borderRadius:12, flex:1, alignItems:'center', marginRight:8 },
  btnStart: { backgroundColor:'#0ea5a3' },
  btnStop: { backgroundColor:'#ef4444' },
  btnText: { color:'#fff', fontWeight:'700' },
  btnSecondary: { padding:12, borderRadius:12, borderWidth:1, borderColor:'#fff', alignItems:'center', justifyContent:'center', width:120 },
  btnTextSecondary: { color:'#fff' }
});
