import { useState } from "react";

type UiMessage = {
  id: string;
  text: string;
  role: "user" | "assistant";   // <-- align with server & UI
  createdAt?: string;
};

export function useChat(baseUrl: string) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [endedSessions, setEndedSessions] = useState<boolean>(false);

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
      const sid = data.sessionId || data.id;
      setSessionId(sid);
      setMessages([]);
    } catch (err) {
      console.error("Create session error:", err);
    }
  }

  // ---- FIXED: handle array OR {messages: []}, map to UI shape, and set sessionId
  async function getMessages(id: string | null = sessionId) {
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/chat/sessions/${id}/messages`);
      const data = await res.json();

      const raw: any[] = Array.isArray(data) ? data : (data?.messages ?? []);
      // ensure oldest -> newest
      raw.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      const mapped: UiMessage[] = raw.map((m) => ({
        id: m.id ?? `${Math.random()}`,
        text: m.content ?? "",
        role: m.role === "assistant" ? "assistant" : "user",
        createdAt: m.createdAt,
      }));

      setMessages(mapped);
      setSessionId(id); // make sure UI switches to chat view
    } catch (err) {
      console.error("Get messages error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(text: string) {
    if (!sessionId || !text.trim()) return;
    setLoading(true);

    // optimistic user bubble
    setMessages((prev) => [...prev, { id: `${Date.now()}`, role: "user", text }]);

    try {
      const res = await fetch(`${baseUrl}/chat/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();

      // be defensive about the server response shape
      const assistantText =
        data?.assistant?.content ?? data?.content ?? data?.message ?? "";

      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", text: assistantText },
      ]);
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function endSession(sessionId: string) {
    if (!sessionId) return;
    await fetch(`${baseUrl}/chat/sessions/${sessionId}/end`, { method: "POST" });
    setSessionId(null);
    setMessages([]);
  }

  async function listSessions() {
    try {
      const res = await fetch(`${baseUrl}/chat/sessions/4hxWqmlULbVgCXSq6s8K`);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (data ?? []);
      arr.map((s: any) => {
        if (s.ended) setEndedSessions(true);
      });
      return arr.map((s: any) => ({
        id: s.id || s.sessionId || String(s.createdAt || Math.random()),
        title: s.title || s.name || "",
        ended: s.ended
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
    endedSessions,
  };
}
