import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Audio } from "expo-av";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useChat } from "../services/chat";

type SessionItem = { id: string; title: string; ended?: boolean };

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const BASE_URL = "http://192.168.101.101:3000";
  const {
    sessionId,
    messages,
    createSession,
    sendMessage,
    endSession,
    loading,
    listSessions,
    getMessages,
  } = useChat(BASE_URL);


  const [sessionName, setSessionName] = useState("");
  const [text, setText] = useState("");
  const [allSessions, setAllSessions] = useState<SessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingOldChat, setLoadingOldChat] = useState(false);
  const [localActiveSessionId, setLocalActiveSessionId] = useState<string | null>(null);
  const [newSessionCreated, setNewSessionCreated] = useState(false);
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  //Use to load chat
  const activeSessionId = localActiveSessionId;

  const currentSessionEnded = useMemo(() => {
    if (!activeSessionId) return false;
    return !!allSessions.find((s) => s.id === activeSessionId)?.ended;
  }, [allSessions, activeSessionId]);

  useEffect(() => {
    (async () => {
      setLoadingSessions(true);
      const list = await listSessions();
      const sid = list.map((s: SessionItem) => s.id);
      setAllSessions(list);
      setLoadingSessions(false);
    })();
  }, [newSessionCreated]);

  const filteredSessions = useMemo(() => {
    if (!sessionName.trim()) return allSessions;
    const q = sessionName.toLowerCase();
    return allSessions.filter((s) => (s.title || "").toLowerCase().includes(q));
  }, [allSessions, sessionName]);

  const openOldSession = async (item: SessionItem) => {
    setLoadingOldChat(true);
    await getMessages(item.id);
    setSessionName(item.title || "");
    setLocalActiveSessionId(item.id);
    setLoadingOldChat(false);
  };

  const handleBackToSessions = () => {
    setLocalActiveSessionId(null);
    setSessionName("");
    setNewSessionCreated(false);
  };

  const handleStartNewChat = async (sessionName: string) => {
    setNewSessionCreated(true);
    if(!sessionName.trim()) {
      setNewSessionCreated(false)
      alert("Session name cannot be empty");
      return;
    }
    const trimmedName = sessionName.trim();
    const data = (await createSession(trimmedName)) as any;
    if (data && data.id) {
      setLocalActiveSessionId(data.id);
      return;
    }
    try {
      const list = await listSessions();
      if (list && list.length > 0) {
        const newSession = list.find((s: SessionItem) => s.title === sessionName) || list[list.length - 1];
        if (newSession && newSession.id) {
          setLocalActiveSessionId(newSession.id);
        }
      }
    } catch (err) {
      console.error("Failed to refresh sessions after creating session", err);
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Microphone permission is required");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        // Send the audio file to server for transcription
        const formData = new FormData();
        formData.append("audio", {
          uri,
          name: "audio.m4a",
          type: "audio/mp4",
        } as any);

        const response = await fetch(`${BASE_URL}/stt/transcribe`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (data.text) {
          // Send transcribed text as message
          sendMessage(data.text);
        }
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  // Loading overlay
  if (loadingOldChat) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7FB3D5" />
          <Text style={styles.loadingText}>Loading chat…</Text>
        </View>
      </View>
    );
  }

  // Session selection screen
  if (!activeSessionId) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <View style={styles.sessionContainer}>
            <View style={styles.sessionHeader}>
              <Text style={styles.headerTitle}>CHAT</Text>
            </View>

            <Text style={styles.sectionTitle}>Choose or create a session:</Text>

            {loadingSessions ? (
              <ActivityIndicator style={{ marginVertical: 20 }} color="#7FB3D5" />
            ) : (
              <FlatList
                data={filteredSessions}
                keyExtractor={(item) => item.id}
                style={styles.sessionList}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No previous sessions</Text>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => openOldSession(item)}
                    style={styles.sessionItem}
                  >
                    <Text style={styles.sessionItemText}>
                      {item.title || "Untitled session"}
                    </Text>
                    {item.ended && <Text style={styles.endedBadge}>ended</Text>}
                  </TouchableOpacity>
                )}
              />
            )}

            <TextInput
              value={sessionName}
              onChangeText={setSessionName}
              placeholder="e.g. Leg pain checkup"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={() => handleStartNewChat(sessionName)}
            />

            <TouchableOpacity
              style={styles.createButton}
              onPress={() => handleStartNewChat(sessionName)}
            >
              <Text style={styles.createButtonText}>Start New Chat</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // Chat screen
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity
            onPress={handleBackToSessions}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.chatHeaderTitle}>CHAT</Text>
        </View>

        {/* Doctor Name Box */}
        <View style={styles.doctorBox}>
          <Text style={styles.doctorName}>{sessionName || ""}</Text>
        </View>

        {/* Messages */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => (
            <View style={styles.messageWrapper}>
              <View
                style={[
                  styles.messageContainer,
                  item.role === "user" ? styles.userMessage : styles.doctorMessage,
                ]}
              >
                <Text style={styles.messageText}>{item.text}</Text>
              </View>
              {item.role === "user" && (
                <Text style={styles.messageTime}>
                  Sent {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} using speech to text{'\n'}
                  <Text style={styles.summaryLink}>Get summary</Text>
                </Text>
              )}
              {item.role !== "user" && (
                <Text style={styles.messageTimestamp}>
                  {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </Text>
              )}
            </View>
          )}
        />

        {loading && (
          <ActivityIndicator
            style={{ marginVertical: 8 }}
            color="#7FB3D5"
          />
        )}

        {!currentSessionEnded && (
          <View style={styles.inputContainer}>
            {/* Text Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Type your message"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                style={styles.textInput}
                multiline
                maxLength={500}
              />
              {text.trim().length > 0 && (
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={() => {
                    if (text.trim()) {
                      sendMessage(text);
                      setText("");
                    }
                  }}
                >
                  <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Mic Button */}
            <TouchableOpacity
              style={[styles.micButton, isRecording && styles.micButtonActive]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <View style={styles.micIcon}>
                <View style={styles.micBody} />
                <View style={styles.micBase} />
                <View style={styles.micStand} />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161B24',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
  sessionContainer: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 40,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
    fontWeight: '600',
  },
  sessionList: {
    maxHeight: 240,
    backgroundColor: 'rgba(42, 54, 71, 0.6)',
    borderRadius: 12,
    marginBottom: 20,
  },
  sessionItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionItemText: {
    color: '#fff',
    fontSize: 15,
  },
  endedBadge: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    padding: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(42, 54, 71, 0.6)',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#7FB3D5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Chat screen styles
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#161B24',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: '300',
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
    flex: 1,
    textAlign: 'center',
    marginRight: 48, // Balance the back button
  },
  doctorBox: {
    backgroundColor: '#2D3947',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7FB3D5',
  },
  messagesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  messageContainer: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 4,
  },
  userMessage: {
    backgroundColor: '#6366F1',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  doctorMessage: {
    backgroundColor: '#2D3947',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  messageTimestamp: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  summaryLink: {
    color: '#7FB3D5',
    textDecorationLine: 'underline',
  },
  inputContainer: {
    backgroundColor: '#161B24',
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: 'rgba(42, 54, 71, 0.6)',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: '#7FB3D5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  micButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#7FB3D5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7FB3D5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  micButtonActive: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  micIcon: {
    width: 24,
    height: 32,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  micBody: {
    width: 14,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  micBase: {
    width: 18,
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
    marginTop: 2,
  },
  micStand: {
    width: 2,
    height: 6,
    backgroundColor: '#fff',
    marginTop: -3,
  },
});