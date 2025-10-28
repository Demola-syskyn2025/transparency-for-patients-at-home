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

type SessionItem = { id: string; title: string; ended?: boolean };

export default function ChatScreen() {
  const {
    sessionId, // set by createSession and (ideally) by getMessages(id)
    messages,
    createSession,
    sendMessage,
    endSession,
    loading,
    listSessions,
    getMessages,
    endedSessions,
  } = useChat("http://your-ip-address:3000");

  const [sessionName, setSessionName] = useState("");
  const [text, setText] = useState("");
  const [allSessions, setAllSessions] = useState<SessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // These help when opening an existing session
  const [loadingOldChat, setLoadingOldChat] = useState(false);
  const [localActiveSessionId, setLocalActiveSessionId] = useState<
    string | null
  >(null);

  // compute the actual active session id (covers the case where getMessages doesn't set sessionId)
  const activeSessionId = sessionId || localActiveSessionId;

  const currentSessionEnded = useMemo(() => {
    if (!activeSessionId) return false;
    return !!allSessions.find((s) => s.id === activeSessionId)?.ended;
  }, [allSessions, activeSessionId]);

  // --- Load sessions once ---
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

  const openOldSession = async (item: SessionItem) => {
    setLoadingOldChat(true);
    await getMessages(item.id);
    setSessionName(item.title || "");
    setLoadingOldChat(false);
  };

  const handleBackToSessions = () => {
    setLocalActiveSessionId(null);
    setSessionName("");
  };

  // --- Global loading overlay when opening an old session ---
  if (loadingOldChat) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 12 }}>Loading chat…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ---------- CREATE / PICK SESSION SCREEN ----------
  if (!activeSessionId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <View style={{ flex: 1, padding: 20 }}>
            <Text style={{ fontSize: 18, marginBottom: 10 }}>
              Choose or create a session:
            </Text>

            {/* Existing sessions */}
            {loadingSessions ? (
              <ActivityIndicator style={{ marginVertical: 8 }} />
            ) : (
              <FlatList
                data={filteredSessions}
                keyExtractor={(item) => item.id}
                style={{
                  maxHeight: 240,
                  borderWidth: 1,
                  borderColor: "#eee",
                  borderRadius: 8,
                  marginBottom: 12,
                }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Text style={{ color: "#6b7280", padding: 12 }}>
                    No previous sessions
                  </Text>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => openOldSession(item)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: "#eee",
                    }}
                  >
                    <Text>
                      {item.title || "Untitled session"}{" "}
                      {item.ended ? "• ended" : ""}
                    </Text>
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

            <Button
              title="Start New Chat"
              onPress={() => createSession(sessionName)}
            />
            <Speech />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ---------- CHAT SCREEN ----------
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                handleBackToSessions(); 
                setSessionName(""); 
              }}
              style={{ marginRight: 8, padding: 4 }}
            >
              <Text style={{ fontSize: 20 }}>←</Text>
            </TouchableOpacity>

            <Text style={{ fontWeight: "bold", fontSize: 16 }}>
              Session: {sessionName}
            </Text>
          </View>

          <FlatList
            data={messages}
            keyExtractor={(item) => item.id} // <--- use stable ids
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
          />

          {loading && <ActivityIndicator style={{ marginVertical: 8 }} />}

          {!currentSessionEnded && (
            <View
              style={{
                paddingTop: 8,
                paddingBottom: 16,
                backgroundColor: "#fff",
              }}
            >
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
                <Button
                  title="End Session"
                  color="red"
                  onPress={() => {
                    endSession(sessionId!);
                    setLocalActiveSessionId(null);
                    setSessionName("");
                  }}
                />
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
