import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useChat } from "../services/chat";
import Speech from "../components/appoinments/Speech";


type SessionItem = { id: string; title: string };

type Props = {
  patientId: string; // pass this in from parent/screen params
};

export default function ChatScreen() {
  const {
    sessionId,
    messages,
    createSession,
    sendMessage,
    endSession,
    loading,
    listSessions,
    getMessages
  } = useChat("http://your-ip-address:3000"); // your backend URL

  const [sessionName, setSessionName] = useState("");
  const [text, setText] = useState("");
  const [allSessions, setAllSessions] = useState<SessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // --- Load sessions (once) and refilter as user types ---
  useEffect(() => {
    (async () => {
      setLoadingSessions(true);
      const list = await listSessions();
      setAllSessions(list);
      setLoadingSessions(false);
    })();
  }, []);

  const filteredSessions = useMemo(() => {
    if (!sessionName.trim()) return allSessions;
    const q = sessionName.toLowerCase();
    return allSessions.filter((s) => (s.title || "").toLowerCase().includes(q));
  }, [allSessions, sessionName]);

  // ---------- CREATE SESSION SCREEN ----------
  if (!sessionId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <View style={{ flex: 1, padding: 20 }}>
            <Text style={{ fontSize: 18, marginBottom: 10 }}>Choose or create a session:</Text>

            {/* Existing sessions */}
            {loadingSessions ? (
              <ActivityIndicator style={{ marginVertical: 8 }} />
            ) : (
              <FlatList
                data={filteredSessions}
                keyExtractor={(item) => item.id}
                style={{
                  maxHeight: 200,
                  borderWidth: 1,
                  borderColor: "#eee",
                  borderRadius: 8,
                  marginBottom: 12,
                }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Text style={{ color: "#6b7280", padding: 12 }}>No previous sessions</Text>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => getMessages(item.id)} // ✅ load old chat
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: "#eee",
                    }}
                  >
                    <Text>{item.title}</Text>
                  </TouchableOpacity>
                )}
              />
            )}

            {/* Create new */}
            <TextInput
              value={sessionName}
              onChangeText={setSessionName}
              placeholder="e.g. Leg pain checkup"
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 8,
                padding: 10,
                marginBottom: 12,
              }}
              returnKeyType="done"
              onSubmitEditing={() => createSession(sessionName)}
            />

            <Button title="Start New Chat" onPress={() => createSession(sessionName)} />
            <Speech />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // --- Chat screen ---
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
          <Text style={{ fontWeight: "bold", marginBottom: 8 }}>Session: {sessionName}</Text>

          <FlatList
            data={messages}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <Text
                style={{
                  marginVertical: 4,
                  alignSelf: item.role === "user" ? "flex-end" : "flex-start",
                  backgroundColor: item.role === "user" ? "#6366F1" : "#1F2937",
                  color: "white",
                  padding: 10,
                  borderRadius: 10,
                  maxWidth: "85%",
                }}
              >
                {item.text}
              </Text>
            )}
            contentContainerStyle={{ paddingBottom: 90 }}
            keyboardShouldPersistTaps="handled"
          />

          {loading && <ActivityIndicator style={{ marginVertical: 8 }} />}

          <View style={{ paddingTop: 8, paddingBottom: 16, backgroundColor: "#fff" }}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type your message"
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 8,
                padding: 10,
                marginBottom: 10,
              }}
              multiline
              returnKeyType="send"
              onSubmitEditing={() => {
                if (!text.trim()) return;
                sendMessage(text);
                setText("");
              }}
            />

            <Button
              title="Send"
              onPress={() => {
                if (!text.trim()) return;
                sendMessage(text);
                setText("");
              }}
            />
            <View style={{ marginTop: 10 }}>
              <Button title="End Session" color="red" onPress={endSession} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
