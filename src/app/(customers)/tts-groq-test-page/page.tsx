"use client";

import { useState } from "react";

export default function TtsTestPage() {
  const [inputText, setInputText] = useState(
    "Hello from Cyber Voice! Let's test Groq PlayAI."
  );
  const [voiceId, setVoiceId] = useState("Fritz-PlayAI"); // Default PlayAI voice
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleGenerateAudioGroq = async () => {
    setIsLoading(true);
    setAudioSrc(null);
    setMessage("");

    try {
      const response = await fetch("/api/groq-playai-tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
          voice: voiceId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newAudioSrc = `data:${data.mimeType};base64,${data.audioData}`;
        setAudioSrc(newAudioSrc);
        setMessage("Audio generated successfully! Play below.");
        // console.log("Speakable text was:", data.speakableText); // For debugging
      } else {
        setMessage(`Error: ${data.error || "Failed to generate audio."}`);
        console.error("API Error Data:", data);
      }
    } catch (error) {
      console.error("Network or unexpected error:", error);
      setMessage(`Network error: ${error || "Could not connect to API."}`);
    } finally {
      setIsLoading(false);
    }
  };

  // We can add a similar handler for OpenAI later: handleGenerateAudioOpenAI

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h1>Groq Playai TTS API Test Page which sux!!</h1>

      <div style={{ marginBottom: "20px" }}>
        <label
          htmlFor="inputText"
          style={{ display: "block", marginBottom: "5px" }}
        >
          Text to Synthesize:
        </label>
        <textarea
          id="inputText"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={5}
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          htmlFor="voiceId"
          style={{ display: "block", marginBottom: "5px" }}
        >
          Voice ID (e.g., Fritz-PlayAI):
        </label>
        <input
          type="text"
          id="voiceId"
          value={voiceId}
          onChange={(e) => setVoiceId(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
      </div>

      <button
        onClick={handleGenerateAudioGroq}
        disabled={isLoading}
        style={{
          padding: "10px 15px",
          backgroundColor: isLoading ? "#ccc" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: isLoading ? "not-allowed" : "pointer",
          marginRight: "10px",
        }}
      >
        {isLoading ? "Generating (Groq)..." : "Generate with Groq PlayAI"}
      </button>

      {/* Placeholder for OpenAI button
      <button
        // onClick={handleGenerateAudioOpenAI}
        disabled={isLoading}
        style={{ padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Generate with OpenAI
      </button>
      */}

      {message && (
        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            border: `1px solid ${
              message.startsWith("Error") ? "red" : "green"
            }`,
            borderRadius: "4px",
            backgroundColor: message.startsWith("Error")
              ? "#ffebeb"
              : "#e6ffed",
          }}
        >
          {message}
        </div>
      )}

      {audioSrc && (
        <div style={{ marginTop: "20px" }}>
          <h3>Generated Audio:</h3>
          <audio controls src={audioSrc} style={{ width: "100%" }}>
            Your browser does not support the audio element.
          </audio>
          <p
            style={{
              fontSize: "0.8em",
              wordBreak: "break-all",
              maxHeight: "100px",
              overflowY: "auto",
              background: "#f0f0f0",
              padding: "5px",
            }}
          >
            <small>
              Audio Source (Data URL): {audioSrc.substring(0, 100)}...
            </small>
          </p>
        </div>
      )}
    </div>
  );
}
