// src/app/api/groq-playai-tts/route.ts
import { NextResponse, NextRequest } from "next/server";
import Groq from 'groq-sdk';
import { marked, Token, Tokens } from 'marked'; // Import Token and Tokens types

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function GET() {
  return NextResponse.json({ message: "Hello from /app/api/groq-playai-tts! Your GET route works perfectly." });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const inputText: string = body.text;
    const selectedVoice: string = body.voice || "Fritz-PlayAI";

    if (!inputText || typeof inputText !== 'string' || inputText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Input text is required and cannot be empty." },
        { status: 400 }
      );
    }

    // --- Revised Markdown to Speakable Text Extraction ---
    const textParts: string[] = [];
    const renderer = new marked.Renderer();

    // Helper to extract text from an array of inline tokens
    function extractInlineText(inlineTokens: Token[]): string {
      let text = "";
      for (const token of inlineTokens) {
        if (token.type === 'text') {
          text += token.text;
        } else if (token.type === 'strong' || token.type === 'em' || token.type === 'link' || token.type === 'del') {
          // These tokens have their own 'tokens' or 'text' property
          if ('tokens' in token && token.tokens) {
            text += extractInlineText(token.tokens as Token[]); // Recurse for nested tokens
          } else if ('text' in token && typeof token.text === 'string') {
            text += token.text; // For simple cases like del
          }
        } else if (token.type === 'codespan') {
          // Skip inline code
        } else if (token.type === 'br') {
          text += ' '; // Treat <br> as a space for speech flow
        }
        // Add other inline token types as needed
      }
      return text;
    }

    // Override renderer methods for block-level tokens
    // These functions are expected to return an HTML string, but we primarily use them
    // as hooks to extract text into `textParts`. We can return `token.raw` to let
    // marked handle the actual HTML generation if we don't want to customize it here.
    // However, for elements we want to OMIT from speech, we also make them return '' from marked.

    renderer.paragraph = (token: Tokens.Paragraph): string => {
      const extracted = extractInlineText(token.tokens).trim();
      if (extracted) textParts.push(extracted);
      return token.raw; // Or customize HTML output: `<p>${extractInlineText(token.tokens)}</p>`
    };

    renderer.heading = (token: Tokens.Heading): string => {
      const extracted = extractInlineText(token.tokens).trim();
      if (extracted) textParts.push(extracted + '.'); // Add a period for a slight pause after headings
      return token.raw;
    };

    renderer.list = (token: Tokens.List): string => {
      token.items.forEach((item: Tokens.ListItem) => {
        // item.tokens is an array of tokens representing the content of the list item.
        // Each element in item.tokens typically starts with a 'text' token that itself has 'tokens'.
        let listItemText = "";
        item.tokens.forEach(listItemContentToken => {
            if (listItemContentToken.type === 'text' && 'tokens' in listItemContentToken) {
                listItemText += extractInlineText(listItemContentToken.tokens as Token[]);
            } else if (listItemContentToken.type === 'text' && 'text' in listItemContentToken) { // Fallback for simpler text
                listItemText += listItemContentToken.text;
            }
        });
        const trimmedItemText = listItemText.trim();
        if (trimmedItemText) textParts.push(trimmedItemText + '.'); // Add period for pause
      });
      return token.raw; // Let marked render the list as HTML
    };

    // For list items themselves, the main logic is in renderer.list iterating through items.
    // This override might not be strictly needed if renderer.list handles items comprehensively.
    renderer.listitem = (token: Tokens.ListItem): string => {
        // If renderer.list doesn't fully extract, you might need logic here.
        // For now, assume renderer.list handles it.
        return token.raw;
    };


    renderer.blockquote = (token: Tokens.Blockquote): string => {
      const extracted = extractInlineText(token.tokens).trim();
      if (extracted) textParts.push(extracted);
      return token.raw;
    };

    // Elements to completely skip for both speech and final HTML output (by returning empty string)
    renderer.code = (token: Tokens.Code): string => {
      return ''; // Skip code blocks entirely
    };
    renderer.html = (token: Tokens.HTML): string => {
      return ''; // Skip raw HTML
    };
    renderer.hr = (): string => {
      textParts.push('.'); // Represent as a pause
      return '';
    };
    // In your custom renderer object:
    renderer.image = (token: Tokens.Image): string => {
      // We want to skip images entirely for speech and for our speakableText.
      // The token object would have token.href, token.title, token.text (alt text)
      return ''; // Return empty string to effectively remove it from parsed output used for TTS
    };


    // Inline elements are generally handled by extractInlineText called from their block-level parent.
    // We don't need to push to textParts again here. We just tell marked how to render them if needed.
    // Returning token.raw lets marked use its default rendering for these inline parts within the block.
    renderer.strong = (token: Tokens.Strong): string => { return token.raw; };
    renderer.em = (token: Tokens.Em): string => { return token.raw; };
    renderer.codespan = (token: Tokens.Codespan): string => { return ''; }; // Skip inline code
    renderer.br = (): string => { return ' '; }; // Handled by extractInlineText as a space essentially.
    renderer.del = (token: Tokens.Del): string => { return token.raw; }; // Text will be extracted by parent, marked will render with <del>
    renderer.link = (token: Tokens.Link): string => {
      // The text of the link will be extracted by extractInlineText via token.tokens
      return token.raw; // Let marked render the link as HTML
    };
    renderer.text = (token: Tokens.Text): string => {
      // This is for plain text segments. extractInlineText will pick it up.
      return token.raw;
    };

    // Use the lexer and parser with the custom renderer
    const tokens = marked.lexer(inputText);
    marked.parser(tokens, { renderer }); // This populates textParts via side-effects in renderer methods

    const speakableText = textParts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    // --- End of Revised Markdown Extraction ---

    if (speakableText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "No speakable text found after cleaning markdown/code." },
        { status: 400 }
      );
    }

    if (speakableText.length > 10000) {
      return NextResponse.json(
        { success: false, error: "Processed text exceeds 10,000 character limit for TTS." },
        { status: 400 }
      );
    }

    const ttsResponse = await groq.audio.speech.create({
      model: "playai-tts",
      voice: selectedVoice,
      input: speakableText,
      response_format: "mp3", // Attempting MP3 based on your finding
      // speed: 1.0 // Add if you confirm it's supported and want to configure
    });

    const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
    const audioBase64 = audioBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      audioData: audioBase64,
      mimeType: "audio/mpeg", // Changed to audio/mpeg for MP3
      originalText: inputText,
      speakableText: speakableText,
    });

  } catch (error: any) {
    console.error("Groq TTS API Error or Markdown Processing Error:", error);
    let errorMessage = "Failed to generate audio.";
    // ... (rest of your error handling) ...
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