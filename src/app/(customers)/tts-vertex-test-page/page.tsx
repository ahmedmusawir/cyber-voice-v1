// src/app/(customers)/tts-vertex-test-page/page.tsx
"use client";

import { useState } from "react";

// Standard US English voices from Google Cloud Text-to-Speech
// Based on the user's screenshot (image.png)
const googleStandardVoices = [
  { name: "Standard-C (Female)", value: "en-US-Standard-C" },
  { name: "Standard-D (Male)", value: "en-US-Standard-D" },
  { name: "Standard-E (Female)", value: "en-US-Standard-E" },
  { name: "Standard-F (Female)", value: "en-US-Standard-F" },
  { name: "Standard-G (Female)", value: "en-US-Standard-G" },
  { name: "Standard-H (Female)", value: "en-US-Standard-H" },
  { name: "Standard-I (Male)", value: "en-US-Standard-I" },
  { name: "Standard-J (Male)", value: "en-US-Standard-J" },
  // We can add more voices here, including WaveNet, Chirp, Studio etc. for further testing
  // For example:
  // { name: "WaveNet-A (Female)", value: "en-US-Wavenet-A" },
  // { name: "Chirp3 HD Alnilam (Female)", value: "en-US-Chirp3-HD-Alnilam"},
  // { name: "Studio-O (Female)", value: "en-US-Studio-O"}
] as const;

type GoogleVoiceName = (typeof googleStandardVoices)[number]["value"];

export default function VertexTtsTestPage() {
  const [inputText, setInputText] = useState(
    "Hello from Cyber Voice! This is a test of Google Cloud Text-to-Speech."
  );
  const [selectedVoice, setSelectedVoice] =
    useState<GoogleVoiceName>("en-US-Standard-C");
  const [languageCode, setLanguageCode] = useState("en-US");
  const [speakingRate, setSpeakingRate] = useState(1.0);

  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [debugInfo, setDebugInfo] = useState<object | null>(null);

  const handleGenerateAudioGoogle = async () => {
    setIsLoading(true);
    setAudioSrc(null);
    setMessage("");
    setDebugInfo(null);

    if (!inputText.trim()) {
      setMessage("Error: Input text cannot be empty.");
      setIsLoading(false);
      return;
    }
    if (speakingRate < 0.25 || speakingRate > 4.0) {
      setMessage("Error: Speaking rate must be between 0.25 and 4.0.");
      setIsLoading(false);
      return;
    }

    const payload = {
      text: inputText,
      languageCode: languageCode,
      voiceName: selectedVoice,
      speakingRate: speakingRate,
    };

    try {
      // Assuming your API route is /api/vertex-tts based on your folder structure
      const response = await fetch("/api/vertex-tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setDebugInfo({ requestBody: payload, responseData: data });

      if (response.ok && data.success) {
        const newAudioSrc = `data:${data.mimeType};base64,${data.audioData}`;
        setAudioSrc(newAudioSrc);
        setMessage(
          `Google Cloud TTS audio generated successfully! Play below.`
        );
      } else {
        setMessage(
          `Error: ${
            data.error || "Failed to generate audio with Google Cloud TTS."
          }`
        );
        console.error("Google TTS API Error Data:", data);
      }
    } catch (error: any) {
      console.error("Network or unexpected error (Google TTS):", error);
      setMessage(
        `Network error: ${
          error.message || "Could not connect to Google Cloud TTS API."
        }`
      );
      setDebugInfo({ requestBody: payload, errorDetails: error.toString() });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
            Google Cloud TTS Test Rig
          </h1>
          <p className="mt-3 text-xl text-slate-600">
            Experiment with Google's Text-to-Speech voices.
          </p>
        </header>

        <div className="bg-white shadow-xl rounded-xl p-6 sm:p-8 ring-1 ring-slate-200">
          <div className="space-y-6">
            <div>
              <label
                htmlFor="inputText"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Text to Synthesize:
              </label>
              <textarea
                id="inputText"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={6}
                className="block w-full px-4 py-3 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                placeholder="Enter text for TTS..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="selectedVoice"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Voice Name:
                </label>
                <select
                  id="selectedVoice"
                  value={selectedVoice}
                  onChange={(e) =>
                    setSelectedVoice(e.target.value as GoogleVoiceName)
                  }
                  className="block w-full pl-3 pr-10 py-3 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                >
                  {googleStandardVoices.map((voice) => (
                    <option key={voice.value} value={voice.value}>
                      {voice.name} ({voice.value})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="languageCode"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Language Code:
                </label>
                <input
                  type="text"
                  id="languageCode"
                  value={languageCode}
                  onChange={(e) => setLanguageCode(e.target.value)}
                  className="block w-full px-4 py-3 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                  placeholder="e.g., en-US"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="speakingRate"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Speaking Rate (0.25 to 4.0):
              </label>
              <input
                type="number"
                id="speakingRate"
                value={speakingRate}
                onChange={(e) => setSpeakingRate(parseFloat(e.target.value))}
                min="0.25"
                max="4.0"
                step="0.05"
                className="block w-full px-4 py-3 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={handleGenerateAudioGoogle}
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  "Generate Audio with Google Cloud TTS"
                )}
              </button>
            </div>
          </div>

          {message && (
            <div
              className={`mt-6 p-4 rounded-md text-sm ${
                message.startsWith("Error:")
                  ? "bg-red-100 text-red-700 border border-red-300"
                  : "bg-green-100 text-green-700 border border-green-300"
              }`}
            >
              <p>{message}</p>
            </div>
          )}

          {audioSrc && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-slate-900 mb-3">
                Generated Audio:
              </h3>
              <audio controls src={audioSrc} className="w-full rounded-md">
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {debugInfo && (
            <div className="mt-6 p-4 bg-slate-100 rounded-md border border-slate-200">
              <h4 className="text-sm font-medium text-slate-700 mb-2">
                Debugging Information:
              </h4>
              <pre className="text-xs text-slate-600 whitespace-pre-wrap break-all overflow-x-auto max-h-60">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
        <footer className="mt-10 text-center text-sm text-slate-500">
          <p>Cyber Voice TTS Experimentation Lab - Google Cloud</p>
        </footer>
      </div>
    </div>
  );
}
