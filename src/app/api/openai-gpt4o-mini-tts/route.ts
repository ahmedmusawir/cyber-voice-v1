// src/app/api/openai-gpt4o-mini-tts/route.ts
import { NextResponse, NextRequest } from "next/server";
import OpenAI from 'openai';
import { marked, Token, Tokens } from 'marked'; // For parsing markdown

// Initialize OpenAI SDK Client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Optional: Define known voices for gpt-4o-mini-tts if they are specific
// For now, we'll allow string and rely on OpenAI API validation for the voice.
// Example: type Gpt4oMiniVoice = "coral" | "another_new_voice";

export async function GET() {
  return NextResponse.json({ message: "Hello from /app/api/openai-gpt4o-mini-tts! GET route works." });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const inputText: string = body.text;
    // For this dedicated endpoint, we can hardcode the model or still allow it from request for flexibility
    const selectedModel: string = body.model || "gpt-4o-mini-tts";
    const selectedVoice: string = body.voice || "coral"; // Default to "coral" or another known voice for this model
    const instructions: string | undefined = body.instructions; // For emotional tone, etc.
    const speed: number = body.speed || 1.0;

    if (!inputText || typeof inputText !== 'string' || inputText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Input text is required and cannot be empty." },
        { status: 400 }
      );
    }
    if (selectedModel !== "gpt-4o-mini-tts") {
        // Or handle other models if this endpoint becomes more general,
        // for now, it's dedicated to gpt-4o-mini-tts for testing its specific features
        console.warn(`Warning: Model specified is '${selectedModel}', but this endpoint is optimized for 'gpt-4o-mini-tts'.`);
    }
    if (speed < 0.25 || speed > 4.0) {
        return NextResponse.json(
            { success: false, error: "Speed must be between 0.25 and 4.0." },
            { status: 400 }
        );
    }

    // --- Markdown Processing (Reusing the same robust logic) ---
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
        } else if (token.type === 'codespan') { /* Skip */ }
        else if (token.type === 'br') { text += ' '; }
      }
      return text;
    }
    renderer.paragraph = (token: Tokens.Paragraph): string => {
      const extracted = extractInlineText(token.tokens).trim(); if (extracted) textParts.push(extracted); return token.raw;
    };
    renderer.heading = (token: Tokens.Heading): string => {
      const extracted = extractInlineText(token.tokens).trim(); if (extracted) textParts.push(extracted + '.'); return token.raw;
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
        const trimmedItemText = listItemText.trim(); if (trimmedItemText) textParts.push(trimmedItemText + '.');
      });
      return token.raw;
    };
    renderer.listitem = (token: Tokens.ListItem): string => { return token.raw; };
    renderer.blockquote = (token: Tokens.Blockquote): string => {
      const extracted = extractInlineText(token.tokens).trim(); if (extracted) textParts.push(extracted); return token.raw;
    };
    renderer.code = (token: Tokens.Code): string => { return ''; };
    renderer.html = (token: Tokens.HTML): string => { return ''; };
    renderer.hr = (): string => { textParts.push('.'); return ''; };
    renderer.image = (token: Tokens.Image): string => { return ''; };
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
    // --- End of Markdown Processing ---

    if (speakableText.trim().length === 0) {
      return NextResponse.json({ success: false, error: "No speakable text found after cleaning." }, { status: 400 });
    }
    if (speakableText.length > 4096) { // OpenAI's general character limit
      return NextResponse.json({ success: false, error: "Processed text exceeds 4096 character limit." }, { status: 400 });
    }

    // Construct the payload for OpenAI, including instructions if provided
    const speechPayload: OpenAI.Audio.Speech.SpeechCreateParams = {
      model: selectedModel, // Should be "gpt-4o-mini-tts"
      voice: selectedVoice as OpenAI.Audio.Speech.SpeechCreateParams['voice'], // Cast to the SDK's expected voice type
      input: speakableText,
      response_format: "mp3",
      speed: speed,
    };

    if (instructions && instructions.trim() !== "") {
      speechPayload.instructions = instructions;
    }

    const ttsResponse = await openai.audio.speech.create(speechPayload);

    const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
    const audioBase64 = audioBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      audioData: audioBase64,
      mimeType: "audio/mpeg",
      originalText: inputText,
      speakableText: speakableText,
      modelUsed: selectedModel,
      voiceUsed: selectedVoice,
      instructionsUsed: instructions,
    });

  } catch (error: any) {
    console.error("OpenAI GPT-4o-mini-TTS API Error:", error);
    let errorMessage = "Failed to generate audio with OpenAI gpt-4o-mini-tts.";
    if (error instanceof OpenAI.APIError) {
      errorMessage = error.message || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { success: false, error: errorMessage, details: error.toString() },
      { status: (error instanceof OpenAI.APIError && error.status) ? error.status : 500 }
    );
  }
}
