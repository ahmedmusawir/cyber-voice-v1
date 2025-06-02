// src/app/api/openai-tts/route.ts
import { NextResponse, NextRequest } from "next/server";
import OpenAI from 'openai';
import { marked, Token, Tokens } from 'marked'; // For parsing markdown

// Initialize OpenAI SDK Client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Your existing GET function for testing (optional, you can create one if needed)
export async function GET() {
  return NextResponse.json({ message: "Hello from /app/api/openai-tts! Your GET route works perfectly." });
}

// Add this type definition at the top of your file or in a shared types file
type OpenAIVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";


// POST function to handle TTS requests with OpenAI
export async function POST(request: NextRequest) {
  try {
    // 1. Read and parse the request body
    const body = await request.json();
    const inputText: string = body.text;
    const selectedModel: string = body.model || "tts-1"; // e.g., "tts-1", "tts-1-hd"
    const selectedVoice: OpenAIVoice = body.voice || "alloy"; // Use the defined string literal type
    const speed: number = body.speed || 1.0; // Optional speed control (0.25 to 4.0)


    // 2. Validate input text
    if (!inputText || typeof inputText !== 'string' || inputText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Input text is required and cannot be empty." },
        { status: 400 }
      );
    }
    if (speed < 0.25 || speed > 4.0) {
        return NextResponse.json(
            { success: false, error: "Speed must be between 0.25 and 4.0." },
            { status: 400 }
        );
    }


    // 3. Process Markdown and Extract Speakable Text (Reusing the same logic)
    const textParts: string[] = [];
    const renderer = new marked.Renderer();

    function extractInlineText(inlineTokens: Token[]): string {
      let text = "";
      for (const token of inlineTokens) {
        if (token.type === 'text') {
          text += token.text;
        } else if (token.type === 'strong' || token.type === 'em' || token.type === 'link' || token.type === 'del') {
          if ('tokens' in token && token.tokens) {
            text += extractInlineText(token.tokens as Token[]);
          } else if ('text' in token && typeof token.text === 'string') {
            text += token.text;
          }
        } else if (token.type === 'codespan') {
          // Skip inline code
        } else if (token.type === 'br') {
          text += ' ';
        }
      }
      return text;
    }

    renderer.paragraph = (token: Tokens.Paragraph): string => {
      const extracted = extractInlineText(token.tokens).trim();
      if (extracted) textParts.push(extracted);
      return token.raw;
    };
    renderer.heading = (token: Tokens.Heading): string => {
      const extracted = extractInlineText(token.tokens).trim();
      if (extracted) textParts.push(extracted + '.');
      return token.raw;
    };
    renderer.list = (token: Tokens.List): string => {
      token.items.forEach((item: Tokens.ListItem) => {
        let listItemText = "";
        item.tokens.forEach(listItemContentToken => {
            if (listItemContentToken.type === 'text' && 'tokens' in listItemContentToken) {
                listItemText += extractInlineText(listItemContentToken.tokens as Token[]);
            } else if (listItemContentToken.type === 'text' && 'text' in listItemContentToken) {
                listItemText += listItemContentToken.text;
            }
        });
        const trimmedItemText = listItemText.trim();
        if (trimmedItemText) textParts.push(trimmedItemText + '.');
      });
      return token.raw;
    };
    renderer.listitem = (token: Tokens.ListItem): string => { return token.raw; };
    renderer.blockquote = (token: Tokens.Blockquote): string => {
      const extracted = extractInlineText(token.tokens).trim();
      if (extracted) textParts.push(extracted);
      return token.raw;
    };
    renderer.code = (token: Tokens.Code): string => { return ''; };
    renderer.html = (token: Tokens.HTML): string => { return ''; };
    renderer.hr = (): string => { textParts.push('.'); return ''; };
    renderer.image = (token: Tokens.Image): string => { return ''; }; // Corrected to use token
    renderer.strong = (token: Tokens.Strong): string => { return token.raw; };
    renderer.em = (token: Tokens.Em): string => { return token.raw; };
    renderer.codespan = (token: Tokens.Codespan): string => { return ''; };
    renderer.br = (): string => { return ' '; };
    renderer.del = (token: Tokens.Del): string => { return token.raw; };
    renderer.link = (token: Tokens.Link): string => { return token.raw; };
    renderer.text = (token: Tokens.Text): string => { return token.raw; };

    const tokens = marked.lexer(inputText);
    marked.parser(tokens, { renderer });
    const speakableText = textParts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();


    if (speakableText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "No speakable text found after cleaning markdown/code." },
        { status: 400 }
      );
    }

    // OpenAI TTS has a limit of 4096 characters per request.
    if (speakableText.length > 4096) {
      return NextResponse.json(
        { success: false, error: "Processed text exceeds 4096 character limit for OpenAI TTS." },
        { status: 400 }
      );
    }

    // 4. Call OpenAI API for TTS
    const ttsResponse = await openai.audio.speech.create({
      model: selectedModel,
      voice: selectedVoice,
      input: speakableText,
      response_format: "mp3", // OpenAI supports "mp3", "opus", "aac", "flac"
      speed: speed,
    });

    // 5. Convert audio response (which is a ReadableStream) to Buffer, then to Base64
    const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
    const audioBase64 = audioBuffer.toString('base64');

    // 6. Return successful response
    return NextResponse.json({
      success: true,
      audioData: audioBase64,
      mimeType: "audio/mpeg", // For MP3
      originalText: inputText,
      speakableText: speakableText, // For debugging
    });

  } catch (error: any) {
    // 7. Handle errors
    console.error("OpenAI TTS API Error:", error);
    let errorMessage = "Failed to generate audio with OpenAI.";
    // Check if it's an OpenAI API error object
    if (error instanceof OpenAI.APIError) {
        errorMessage = error.message || errorMessage; // OpenAI errors often have a message property
    } else if (error.message) {
        errorMessage = error.message;
    }

    return NextResponse.json(
      { success: false, error: errorMessage, details: error.toString() },
      { status: (error instanceof OpenAI.APIError && error.status) ? error.status : 500 }
    );
  }
}
