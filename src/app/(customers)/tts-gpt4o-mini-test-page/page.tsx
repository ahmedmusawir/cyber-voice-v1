// src/app/(customers)/tts-gpt4o-mini-test-page/page.tsx
"use client";

import { useState } from "react";

// Define known voices for gpt-4o-mini-tts (can be expanded)
const gpt4oMiniVoices = [
  "alloy",
  "echo",
  "fable",
  "onyx",
  "nova",
  "shimmer",
  "coral",
] as const; // Added coral
type Gpt4oMiniVoice = (typeof gpt4oMiniVoices)[number];

// Define available models (though this page is focused on gpt-4o-mini-tts)
const gpt4oMiniModels = ["gpt-4o-mini-tts", "tts-1"] as const; // Added gpt-4o-mini as an option if it becomes relevant for TTS
type Gpt4oMiniModel = (typeof gpt4oMiniModels)[number];

export default function Gpt4oMiniTtsTestPage() {
  const [inputText, setInputText] = useState(
    "Hello! This is a test of the gpt-4o-mini-tts model with emotional instructions."
  );
  const [selectedVoice, setSelectedVoice] = useState<Gpt4oMiniVoice>("coral"); // Default to coral
  const [selectedModel, setSelectedModel] =
    useState<Gpt4oMiniModel>("gpt-4o-mini-tts"); // Default to gpt-4o-mini-tts
  const [instructions, setInstructions] = useState(
    "Speak in a slightly cheerful and enthusiastic tone."
  );
  const [speed, setSpeed] = useState(1.0);

  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [debugInfo, setDebugInfo] = useState<object | null>(null);

  const handleGenerateAudio = async () => {
    setIsLoading(true);
    setAudioSrc(null);
    setMessage("");
    setDebugInfo(null);

    if (!inputText.trim()) {
      setMessage("Error: Input text cannot be empty.");
      setIsLoading(false);
      return;
    }
    if (speed < 0.25 || speed > 4.0) {
      setMessage("Error: Speed must be between 0.25 and 4.0.");
      setIsLoading(false);
      return;
    }

    const payload = {
      text: inputText,
      model: selectedModel,
      voice: selectedVoice,
      instructions: instructions,
      speed: speed,
    };

    try {
      const response = await fetch("/api/openai-gpt4o-mini-tts", {
        // Calling the new dedicated endpoint
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
          `Audio with ${selectedModel} generated successfully! Play below.`
        );
      } else {
        setMessage(
          `Error: ${
            data.error || `Failed to generate audio with ${selectedModel}.`
          }`
        );
        console.error("API Error Data:", data);
      }
    } catch (error: any) {
      console.error("Network or unexpected error:", error);
      setMessage(
        `Network error: ${error.message || "Could not connect to API."}`
      );
      setDebugInfo({ requestBody: payload, errorDetails: error.toString() });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            GPT-4o Mini TTS Test Rig
          </h1>
          <p className="mt-3 text-xl text-slate-400">
            Experiment with expressive speech synthesis.
          </p>
        </header>

        <div className="bg-slate-800 shadow-2xl rounded-xl p-6 sm:p-8 ring-1 ring-slate-700">
          <div className="space-y-6">
            <div>
              <label
                htmlFor="inputText"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Text to Synthesize:
              </label>
              <textarea
                id="inputText"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={5}
                className="block w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-100"
                placeholder="Enter text for TTS..."
              />
            </div>

            <div>
              <label
                htmlFor="instructions"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Instructions (for emotional tone, style):
              </label>
              <textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                className="block w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-100"
                placeholder="e.g., Speak in a cheerful and positive tone."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="selectedModel"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Model:
                </label>
                <select
                  id="selectedModel"
                  value={selectedModel}
                  onChange={(e) =>
                    setSelectedModel(e.target.value as Gpt4oMiniModel)
                  }
                  className="block w-full pl-3 pr-10 py-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-100"
                >
                  {gpt4oMiniModels.map((modelName) => (
                    <option key={modelName} value={modelName}>
                      {modelName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="selectedVoice"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Voice:
                </label>
                <select
                  id="selectedVoice"
                  value={selectedVoice}
                  onChange={(e) =>
                    setSelectedVoice(e.target.value as Gpt4oMiniVoice)
                  }
                  className="block w-full pl-3 pr-10 py-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-100"
                >
                  {gpt4oMiniVoices.map((voiceName) => (
                    <option key={voiceName} value={voiceName}>
                      {voiceName.charAt(0).toUpperCase() + voiceName.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label
                htmlFor="speed"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Speed (0.25 to 4.0):
              </label>
              <input
                type="number"
                id="speed"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                min="0.25"
                max="4.0"
                step="0.05"
                className="block w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-100"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={handleGenerateAudio}
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-lg text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
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
                  "Generate with GPT-4o Mini TTS"
                )}
              </button>
            </div>
          </div>

          {message && (
            <div
              className={`mt-6 p-4 rounded-md text-sm ${
                message.startsWith("Error:")
                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                  : "bg-green-500/20 text-green-300 border border-green-500/30"
              }`}
            >
              <p>{message}</p>
            </div>
          )}

          {audioSrc && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-slate-100 mb-3">
                Generated Audio:
              </h3>
              <audio controls src={audioSrc} className="w-full rounded-md">
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {debugInfo && (
            <div className="mt-6 p-4 bg-slate-700/50 rounded-md border border-slate-600">
              <h4 className="text-sm font-medium text-slate-300 mb-2">
                Debugging Information:
              </h4>
              <pre className="text-xs text-slate-400 whitespace-pre-wrap break-all overflow-x-auto max-h-60">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
        <footer className="mt-10 text-center text-sm text-slate-500">
          <p>Cyber Voice TTS Experimentation Lab</p>
        </footer>
      </div>
    </div>
  );
}
