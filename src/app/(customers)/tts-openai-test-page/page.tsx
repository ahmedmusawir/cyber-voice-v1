// src/app/(customers)/tts-openai-test-page/page.tsx
"use client";

import { useState } from "react";

// Define the available voices for OpenAI tts-1 model
const openAIVoices = [
  "alloy",
  "echo",
  "fable",
  "onyx",
  "nova",
  "shimmer",
] as const;
type OpenAIVoice = (typeof openAIVoices)[number];

// Define available models
const openAIModels = ["tts-1", "tts-1-hd"] as const;
type OpenAIModel = (typeof openAIModels)[number];

export default function OpenaiTtsTestPage() {
  const [inputText, setInputText] = useState(
    "Hello from Cyber Voice! This is a test of the OpenAI TTS with the tts-1 model."
  );
  const [selectedVoice, setSelectedVoice] = useState<OpenAIVoice>("alloy");
  const [selectedModel, setSelectedModel] = useState<OpenAIModel>("tts-1");
  const [speed, setSpeed] = useState(1.0);

  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [debugInfo, setDebugInfo] = useState<object | null>(null);

  const handleGenerateAudioOpenAI = async () => {
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

    try {
      const response = await fetch("/api/openai-tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
          model: selectedModel,
          voice: selectedVoice,
          speed: speed,
        }),
      });

      const data = await response.json();
      setDebugInfo({
        requestBody: {
          text: inputText,
          model: selectedModel,
          voice: selectedVoice,
          speed,
        },
        responseData: data,
      });

      if (response.ok && data.success) {
        const newAudioSrc = `data:${data.mimeType};base64,${data.audioData}`;
        setAudioSrc(newAudioSrc);
        setMessage("OpenAI audio generated successfully! Play below.");
      } else {
        setMessage(
          `Error: ${data.error || "Failed to generate audio with OpenAI."}`
        );
        console.error("OpenAI API Error Data:", data);
      }
    } catch (error: any) {
      console.error("Network or unexpected error (OpenAI):", error);
      setMessage(
        `Network error: ${
          error.message || "Could not connect to OpenAI TTS API."
        }`
      );
      setDebugInfo({
        requestBody: {
          text: inputText,
          model: selectedModel,
          voice: selectedVoice,
          speed,
        },
        errorDetails: error.toString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-slate-800">
            OpenAI TTS Test Page
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Test the OpenAI Text-to-Speech API integration.
          </p>
        </header>

        <div className="bg-white shadow-xl rounded-lg p-6 sm:p-8">
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
                className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter text for TTS..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="selectedModel"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Model:
                </label>
                <select
                  id="selectedModel"
                  value={selectedModel}
                  onChange={(e) =>
                    setSelectedModel(e.target.value as OpenAIModel)
                  }
                  className="block w-full pl-3 pr-10 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  {openAIModels.map((modelName) => (
                    <option key={modelName} value={modelName}>
                      {modelName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="selectedVoice"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Voice:
                </label>
                <select
                  id="selectedVoice"
                  value={selectedVoice}
                  onChange={(e) =>
                    setSelectedVoice(e.target.value as OpenAIVoice)
                  }
                  className="block w-full pl-3 pr-10 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  {openAIVoices.map((voiceName) => (
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
                className="block text-sm font-medium text-slate-700 mb-1"
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
                className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={handleGenerateAudioOpenAI}
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
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
                  "Generate Audio with OpenAI TTS"
                )}
              </button>
            </div>
          </div>

          {message && (
            <div
              className={`mt-6 p-4 rounded-md ${
                message.startsWith("Error:")
                  ? "bg-red-50 text-red-700 border border-red-300"
                  : "bg-green-50 text-green-700 border border-green-300"
              }`}
            >
              <p>{message}</p>
            </div>
          )}

          {audioSrc && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Generated Audio:
              </h3>
              <audio controls src={audioSrc} className="w-full">
                Your browser does not support the audio element.
              </audio>
              {/* Optional: Display part of the base64 string for debugging */}
              {/* <p className="mt-2 text-xs text-slate-500 break-all max-h-24 overflow-y-auto bg-slate-50 p-2 rounded">
                <small>Audio Source (Data URL): {audioSrc.substring(0, 150)}...</small>
              </p> */}
            </div>
          )}

          {/* Debug Info Area */}
          {debugInfo && (
            <div className="mt-6 p-4 bg-slate-50 rounded-md border border-slate-200">
              <h4 className="text-sm font-medium text-slate-700 mb-2">
                Debugging Information:
              </h4>
              <pre className="text-xs text-slate-600 whitespace-pre-wrap break-all overflow-x-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
