// src/app/api/vertex-tts/route.ts
import { NextResponse, NextRequest } from "next/server";
import { TextToSpeechClient, protos } from '@google-cloud/text-to-speech';
import { marked, Token, Tokens } from 'marked'; // For parsing markdown

// Initialize Google Cloud TextToSpeech Client
// This will automatically use credentials from GOOGLE_APPLICATION_CREDENTIALS environment variable
const ttsClient = new TextToSpeechClient();

export async function GET() {
  return NextResponse.json({ message: "Hello from /app/api/vertex-tts! Your GET route works perfectly." });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const inputText: string = body.text;
    const languageCode: string = body.languageCode || 'en-US';
    // Example: "en-US-Standard-A" (cheaper), "en-US-WaveNet-D", "en-US-Studio-O", "en-US-Chirp3-HD-Alnilam"
    const voiceName: string = body.voiceName || 'en-US-Standard-A'; // Default to a standard voice
    const speakingRate: number = body.speakingRate || 1.0; // 0.25 to 4.0

    if (!inputText || typeof inputText !== 'string' || inputText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Input text is required and cannot be empty." },
        { status: 400 }
      );
    }
    if (speakingRate < 0.25 || speakingRate > 4.0) {
        return NextResponse.json(
            { success: false, error: "Speaking rate must be between 0.25 and 4.0." },
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

    // Google TTS has a limit of 5000 characters per request for standard API calls.
    // For longer audio, Batch Long Audio Synthesis is recommended, but for now, we'll enforce this limit.
    if (speakableText.length > 5000) {
      return NextResponse.json(
        { success: false, error: "Processed text exceeds 5000 character limit for Google TTS single request." },
        { status: 400 }
      );
    }

    const ttsRequest: protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
      input: { text: speakableText },
      voice: {
        languageCode: languageCode,
        name: voiceName,
      },
      audioConfig: {
        audioEncoding: 'MP3', // Request MP3 directly
        speakingRate: speakingRate,
        // You can add pitch, volumeGainDb etc. here if needed
        // effectsProfileId: [] // For specific audio profiles like "wearable-class-device"
      },
    };

    const [ttsResponse] = await ttsClient.synthesizeSpeech(ttsRequest);

    if (!ttsResponse.audioContent) {
        throw new Error("No audio content received from Google TTS.");
    }
    
    // audioContent is already a Buffer or Uint8Array
    const audioBuffer = Buffer.from(ttsResponse.audioContent);
    const audioBase64 = audioBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      audioData: audioBase64,
      mimeType: "audio/mpeg", // For MP3
      originalText: inputText,
      speakableText: speakableText, // For debugging
      voiceUsed: voiceName,
    });

  } catch (error: any) {
    console.error("Google TTS API Error:", error);
    let errorMessage = "Failed to generate audio with Google TTS.";
    if (error.message) {
        errorMessage = error.message;
    }
    // Google API errors often have a 'code' and 'details'
    if (error.code) {
        errorMessage += ` (Code: ${error.code})`;
    }

    return NextResponse.json(
      { success: false, error: errorMessage, details: error.toString() },
      { status: 500 } // Or error.code if it's an HTTP status
    );
  }
}
