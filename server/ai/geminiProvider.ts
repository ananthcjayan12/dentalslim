import type { GeneratePreviewInput, GeneratePreviewOutput, ImagePreviewProvider } from "./provider";
import { buildDentalPreviewPrompt } from "./prompts";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export class GeminiImagePreviewProvider implements ImagePreviewProvider {
  constructor(private apiKey: string) {}

  async generatePreview(input: GeneratePreviewInput): Promise<GeneratePreviewOutput> {
    const prompt = buildDentalPreviewPrompt({ toothNumber: input.toothNumber, concern: input.concern, shade: input.shade });
    const parts: any[] = [
      { text: prompt },
      { inline_data: { mime_type: input.originalMimeType || "image/jpeg", data: arrayBufferToBase64(input.originalImage) } },
      { inline_data: { mime_type: input.maskMimeType || "image/png", data: arrayBufferToBase64(input.maskImage) } },
    ];
    for (const reference of input.referenceImages ?? []) {
      parts.push({ inline_data: { mime_type: reference.mimeType || "image/jpeg", data: arrayBufferToBase64(reference.image) } });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": this.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: { aspectRatio: input.aspectRatio || "4:3", imageSize: input.imageSize || "0.5K" },
        },
      }),
    });

    if (!response.ok) throw new Error("Preview could not be created. Please try again.");

    const data: any = await response.json();
    const partsOut = data?.candidates?.[0]?.content?.parts ?? [];
    let text = "";
    for (const part of partsOut) {
      if (part.text) text += part.text;
      const inline = part.inlineData ?? part.inline_data;
      if (inline?.data) {
        return {
          image: base64ToArrayBuffer(inline.data),
          mimeType: (inline.mimeType ?? inline.mime_type ?? "image/png") as "image/jpeg" | "image/png",
          text,
        };
      }
    }
    throw new Error("Preview could not be created. Please try again.");
  }
}
