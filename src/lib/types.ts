export type CaseStatus =
  | "draft"
  | "photo_uploaded"
  | "marked"
  | "generating"
  | "preview_ready"
  | "saved"
  | "failed";

export type PreviewQuality = "standard" | "premium";

export type GeminiImageModel =
  | "gemini-3.1-flash-image-preview"
  | "gemini-3-pro-image-preview";

export type GeminiImageSize = "0.5K" | "1K" | "2K" | "4K";

export type AspectRatio = "1:1" | "4:3" | "3:4" | "16:9" | "9:16";

export type DentalCase = {
  id: string;
  patientName: string;
  toothNumber?: string;
  concern?: string;
  shade?: string;
  status: CaseStatus;
  previewModel: GeminiImageModel;
  previewQuality: PreviewQuality;
  imageSize: GeminiImageSize;
  aspectRatio: AspectRatio;
  estimatedCostUsd?: number;
  originalImageUrl?: string;
  maskImageUrl?: string;
  previewImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
};
