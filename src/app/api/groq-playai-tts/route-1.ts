// src/app/api/groq-playai-tts/route.ts
import { NextResponse, NextRequest } from "next/server";
import Groq from 'groq-sdk';
import { marked } from 'marked'; // For parsing markdown

// Initialize Groq SDK Client
// It's good practice to initialize it outside the handler if it doesn't depend on request-specific data
// and if the API key is globally available via environment variables.
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Your existing GET function for testing
export async function GET() {
  return NextResponse.json({ message: "Hello from /app/api/groq-playai-tts! Your GET route works perfectly." });
}

// POST function to handle TTS requests
export async function POST(request: NextRequest) {
  try {
    // 1. Read and parse the request body
    const body = await request.json();
    const inputText = body.text;
    const selectedVoice = body.voice || "Fritz-PlayAI"; // Default to Fritz-PlayAI if no voice is provided

    // 2. Validate input text
    if (!inputText || typeof inputText !== 'string' || inputText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Input text is required and cannot be empty." },
        { status: 400 }
      );
    }

    // 3. Process Markdown and Extract Speakable Text
    // This is a crucial step to avoid reading out markdown syntax or code blocks.
    let speakableText = "";
    if (inputText) {
        const renderer = new marked.Renderer();
        const textParts: string[] = [];

        // Override renderer methods to capture text and skip code/syntax elements
        // For elements we want to read, we push their text content.
        // For elements we want to ignore (like code), we return an empty string from their renderer.

        renderer.code = (code, language, isEscaped) => { return ''; }; // Skip fenced code blocks
        renderer.codespan = (code) => { return ''; }; // Skip inline code `...`
        renderer.html = (html) => { return ''; }; // Skip raw HTML
        renderer.hr = () => { return '\n'; }; // Horizontal rule as a pause/break
        renderer.br = () => { return '\n'; }; // Line break

        // Capture text from paragraphs, headings, list items, blockquotes
        renderer.paragraph = (text) => { textParts.push(text); return text; };
        renderer.heading = (text, level, raw, slugger) => { textParts.push(text); return text; };
        
        renderer.list = (body, ordered, start) => {
            // Process list items to extract text more cleanly
            const items = body.split('</li>').filter(item => item.trim().length > 0);
            items.forEach(item => {
                // Remove <li> tags and trim
                const cleanItem = item.replace(/<[^>]*>/g, '').trim();
                if(cleanItem) textParts.push(cleanItem);
            });
            return body; // Original body isn't used for speakableText here
        };
        renderer.listitem = (text) => { return `<li>${text}</li>`; }; // Keep for list handler
        
        renderer.blockquote = (quote) => { textParts.push(quote.replace(/<[^>]*>/g, '')); return quote; };
        renderer.strong = (text) => { textParts.push(text); return text; }; // Read bold text
        renderer.em = (text) => { textParts.push(text); return text; }; // Read italic text
        renderer.del = (text) => { return '';} // Skip strikethrough text

        // Links: read the link text, not the URL itself for speech
        renderer.link = (href, title, text) => { textParts.push(text); return text; };
        renderer.image = (href, title, text) => { return ''; }; // Skip images for speech

        // Use the custom renderer
        marked.parse(inputText, { renderer });
        speakableText = textParts.join(' \n').replace(/\s+/g, ' ').trim(); // Join captured parts and clean up whitespace
    }


    if (speakableText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "No speakable text found after cleaning markdown/code." },
        { status: 400 }
      );
    }

    // 4. Validate speakableText length (PlayAI limit is 10k characters)
    if (speakableText.length > 10000) {
      return NextResponse.json(
        { success: false, error: "Processed text exceeds 10,000 character limit for TTS." },
        { status: 400 }
      );
    }

    // 5. Call Groq API for TTS
    const ttsResponse = await groq.audio.speech.create({
      model: "playai-tts", // Or "playai-tts-arabic" if handling Arabic
      voice: selectedVoice,
      input: speakableText,
      response_format: "wav", // Currently, only "wav" is supported by PlayAI via Groq
      // speed: 1.0 // Optional: control speed if API supports it
    });

    // 6. Convert audio response to Buffer, then to Base64
    const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
    const audioBase64 = audioBuffer.toString('base64');

    // 7. Return successful response
    return NextResponse.json({
      success: true,
      audioData: audioBase64,
      mimeType: "audio/wav", // Let the client know it's WAV data
      originalText: inputText, // Optional: return original for debugging
      speakableText: speakableText, // Optional: return processed text for debugging
    });

  } catch (error: any) {
    // 8. Handle errors
    console.error("Groq TTS API Error:", error);
    let errorMessage = "Failed to generate audio.";
    if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error.message || errorMessage;
    } else if (error.message) {
        errorMessage = error.message;
    }

    return NextResponse.json(
      { success: false, error: errorMessage, details: error.toString() },
      { status: 500 }
    );
  }
}
