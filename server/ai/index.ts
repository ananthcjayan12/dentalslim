import { GeminiImagePreviewProvider } from "./geminiProvider";
import { MockImagePreviewProvider } from "./mockProvider";

export function getImagePreviewProvider(env: Env) {
  if (env.AI_PROVIDER === "mock") return new MockImagePreviewProvider();
  if (env.AI_PROVIDER === "gemini") {
    if (!env.GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");
    return new GeminiImagePreviewProvider(env.GEMINI_API_KEY);
  }
  return new MockImagePreviewProvider();
}
