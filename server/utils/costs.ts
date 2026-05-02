export type GeminiImageModel = "gemini-3.1-flash-image-preview" | "gemini-3-pro-image-preview";
export type GeminiImageSize = "0.5K" | "1K" | "2K" | "4K";

export function estimateGeminiImageCostUsd(model: GeminiImageModel, imageSize: GeminiImageSize): number {
  if (model === "gemini-3.1-flash-image-preview") {
    const costs: Record<GeminiImageSize, number> = { "0.5K": 0.045, "1K": 0.067, "2K": 0.101, "4K": 0.151 };
    return costs[imageSize];
  }
  const costs: Record<GeminiImageSize, number | null> = { "0.5K": null, "1K": 0.134, "2K": 0.134, "4K": 0.24 };
  const cost = costs[imageSize];
  if (cost === null) throw new Error("Gemini 3 Pro Image does not support 0.5K in this app.");
  return cost;
}

export function normalizeModelSelection(input: { previewQuality: "standard" | "premium"; imageSize?: GeminiImageSize }): { model: GeminiImageModel; imageSize: GeminiImageSize } {
  if (input.previewQuality === "premium") {
    return { model: "gemini-3-pro-image-preview", imageSize: input.imageSize === "0.5K" ? "1K" : input.imageSize ?? "1K" };
  }
  return { model: "gemini-3.1-flash-image-preview", imageSize: input.imageSize ?? "0.5K" };
}
