import type { DentalCase, GeminiImageSize, PreviewQuality } from "./types";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const data: any = await res.json().catch(() => ({}));
    throw new Error(data.error || "Request failed");
  }
  return res.json();
}

export const api = {
  listCases: () => req<{ cases: DentalCase[] }>("/api/cases"),
  getCase: (id: string) => req<{ case: DentalCase }>(`/api/cases/${id}`),
  createCase: (payload: Record<string, unknown>) =>
    req<{ caseId: string; status: string }>("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  patchCase: (id: string, payload: Record<string, unknown>) =>
    req<{ ok: boolean }>(`/api/cases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  uploadCaseImage: async (id: string, file: File, path: "upload" | "mask") => {
    const form = new FormData();
    form.append("file", file);
    return req<{ ok: boolean }>(`/api/cases/${id}/${path}`, { method: "POST", body: form });
  },
  uploadReferenceImages: async (id: string, files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    return req<{ ok: boolean }>(`/api/cases/${id}/references`, { method: "POST", body: form });
  },
  generatePreview: (id: string, options: { previewQuality: PreviewQuality; imageSize: GeminiImageSize }) =>
    req<{ ok: boolean; previewImageUrl: string; status: string }>(`/api/cases/${id}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...options, aspectRatio: "4:3" }),
    }),
};
