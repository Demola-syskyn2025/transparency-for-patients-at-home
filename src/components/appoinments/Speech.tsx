// STTGemini.tsx
import { Audio } from "expo-av";
import React, { useRef, useState } from "react";
import { Button, Text, View } from "react-native";

export default function STTGemini() {
  const recRef = useRef<Audio.Recording | null>(null);
  const [status, setStatus] = useState("idle");
  const [text, setText] = useState("");
  const [summaryText, setSummaryText] = useState("");

  const BASE_URL = "http://replacewithyouripv4:3000";

  const startRecording = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") return alert("Need mic permission");

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    const rec = new Audio.Recording();
    await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await rec.startAsync();

    recRef.current = rec;
    setStatus("recording");
  };

  const stopAndUpload = async () => {
    if (!recRef.current) return;
    setStatus("uploading");

    try {
      await recRef.current.stopAndUnloadAsync();
      const uri = recRef.current.getURI()!;
      recRef.current = null;

      const endpoint = `${BASE_URL}/stt/transcribe`;

      const file = await fetch(uri).then((r) => r.blob());
      const form = new FormData();
      form.append("audio", {
        uri,
        name: "audio.m4a",
        type: "audio/mp4",
      } as any);

      // Add a 20s timeout
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(endpoint, {
        method: "POST",
        body: form,
        signal: controller.signal,
      }).catch((e) => {
        console.log("Fetch failed/cancelled:", e?.message);
        throw e;
      });
      clearTimeout(id);

      console.log("Response status:", res.status);
      const raw = await res.text();
      console.log("Raw response text:", raw);

      // Try to parse JSON; if it fails show raw text
      let data: any = {};
      try {
        data = JSON.parse(raw);
      } catch {}
      setText(data.text ?? raw ?? "(no text)");
      setStatus("done");
    } catch (e: any) {
      console.warn("Upload/transcribe error:", e?.message || e);
      setText(`Error: ${e?.message || "Transcription failed"}`);
      setStatus("idle");
    }
  };

  const summary = async () => {
    try {
      const endpoint = `${BASE_URL}/notes`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript:
            text,
          by: "4hxWqmlULbVgCXSq6s8K",
        }),
      });
      const data = await res.json();
      setSummaryText(data.aiSummary);
    } catch (error) {
      console.error("Error fetching summary:", error);
      setSummaryText("Error fetching summary");
    }
  };

  return (
    <View style={{ padding: 16, gap: 10 }}>
      <Button
        title={status === "recording" ? "Stop & Transcribe" : "Start Recording"}
        onPress={status === "recording" ? stopAndUpload : startRecording}
      />
      <Text>Status: {status}</Text>
      <Text>Transcription: {text}</Text>
      <Text>Summary: {summaryText}</Text>
      {status === "done" && (
        <Button title="Get Summary" onPress={summary} />
      )}
      
    </View>
  );
}
