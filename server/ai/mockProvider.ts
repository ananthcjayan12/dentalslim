import type { GeneratePreviewInput, GeneratePreviewOutput, ImagePreviewProvider } from "./provider";

export class MockImagePreviewProvider implements ImagePreviewProvider {
  async generatePreview(input: GeneratePreviewInput): Promise<GeneratePreviewOutput> {
    return { image: input.originalImage, mimeType: (input.originalMimeType === "image/png" ? "image/png" : "image/jpeg") as "image/png" | "image/jpeg", text: "Mock preview returned original image." };
  }
}
