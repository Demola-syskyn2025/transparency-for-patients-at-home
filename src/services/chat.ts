import { useState } from "react";

type UiMessage = {
  id: string;
  text: string;
  role: "user" | "bot";
  createdAt?: string;
};

export function useChat(baseUrl: string) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1️⃣ Create a new chat session
  async function createSession(name: string) {
    if (!name.trim()) return alert("Please enter a session name");
    try {
      const res = await fetch(`${baseUrl}/chat/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: name,
          patientId: "4hxWqmlULbVgCXSq6s8K",
        }),
      });
      const data = await res.json();
      setSessionId(data.sessionId || data.id);
      setMessages([]); // clear previous messages
    } catch (err) {
      console.error("Create session error:", err);
    }
  }
  // 2️⃣ Get all messages in current session
  async function getMessages(id = sessionId) {
    if (!id) return;
    try {
      const res = await fetch(`${baseUrl}/chat/sessions/${id}/messages`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Get messages error:", err);
    }
  }

  // 3️⃣ Send message to chatbot
  async function sendMessage(text: string) {
    if (!sessionId || !text.trim()) return;
    setLoading(true);

    // Add the user's message instantly
    setMessages((prev) => [...prev, { role: "user", text }]);

    try {
      const res = await fetch(
        `${baseUrl}/chat/sessions/${sessionId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        }
      );
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.assistant.content },
      ]);
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setLoading(false);
    }
  }

  // 4️⃣ End chat session
  async function endSession() {
    if (!sessionId) return;
    await fetch(`${baseUrl}/chat/sessions/${sessionId}/end`, {
      method: "POST",
    });
    setSessionId(null);
    setMessages([]);
  }

  async function listSessions() {
    try {
      const res = await fetch(`${baseUrl}/chat/sessions/4hxWqmlULbVgCXSq6s8K`);
      const data = await res.json();
      const arr = data || [];
      return arr.map((s: any) => ({
        id: s.id || s.sessionId || String(s.createdAt || Math.random()),
        title: s.title || s.name || "",
      }));
    } catch (err) {
      console.error("List sessions error:", err);
      return [];
    }
  }

  return {
    sessionId,
    messages,
    createSession,
    getMessages,
    sendMessage,
    endSession,
    loading,
    listSessions,
  };
}
