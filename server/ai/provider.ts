export type GeneratePreviewInput = {
  originalImage: ArrayBuffer;
  originalMimeType: string;
  maskImage: ArrayBuffer;
  maskMimeType: string;
  referenceImages?: Array<{ image: ArrayBuffer; mimeType: string }>;
  patientName?: string;
  toothNumber?: string;
  concern?: string;
  shade?: string;
  model: "gemini-3.1-flash-image-preview" | "gemini-3-pro-image-preview";
  imageSize: "0.5K" | "1K" | "2K" | "4K";
  aspectRatio: "1:1" | "4:3" | "3:4" | "16:9" | "9:16";
};

export type GeneratePreviewOutput = { image: ArrayBuffer; mimeType: "image/jpeg" | "image/png"; text?: string };

export interface ImagePreviewProvider { generatePreview(input: GeneratePreviewInput): Promise<GeneratePreviewOutput>; }
