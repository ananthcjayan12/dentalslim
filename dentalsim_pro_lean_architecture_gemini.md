# DentalSim Pro — Lean Cloudflare + Gemini Image MVP Architecture

**Version:** 1.0  
**Purpose:** Shareable implementation document for a Codex / coding agent  
**Product:** Dentist-facing dental before/after preview tool  
**Frontend:** React + Vite + TypeScript + Tailwind on Cloudflare Pages  
**Backend:** Cloudflare Pages Functions + D1 + R2  
**AI Image Models:** Gemini 3.1 Flash Image Preview and Gemini 3 Pro Image Preview

---

## 0. Product Principle

DentalSim Pro should feel like a simple clinical workflow for dentists:

```txt
Upload Photo → Mark Tooth → Create Preview → Review With Patient
```

Avoid developer-facing language in the UI. Do **not** show pipelines, logs, GPUs, JSON, model internals, or complex analytics to the dentist.

---

## 1. Source Notes From Gemini Documentation

Use these model IDs:

```txt
gemini-3.1-flash-image-preview
gemini-3-pro-image-preview
```

Google describes Nano Banana 2 as `gemini-3.1-flash-image-preview`, optimized for speed and high-volume developer use cases. Google describes Nano Banana Pro as `gemini-3-pro-image-preview`, designed for professional asset production and higher-fidelity image generation/editing.

Gemini image generation supports text-to-image and text-plus-image-to-image editing. The docs state that image generation/editing can use text, images, or a combination of both, and all generated images include SynthID watermarking.

Gemini 3.1 Flash Image Preview supports new output resolution options: `0.5K`, `2K`, and `4K`, with default `1K`. Gemini 3 Pro Image Preview supports high-fidelity image generation and 4K output.

References:

- Gemini image generation guide: https://ai.google.dev/gemini-api/docs/image-generation
- Gemini 3.1 Flash Image Preview model page: https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-image-preview
- Gemini 3 Pro Image Preview model page: https://ai.google.dev/gemini-api/docs/models/gemini-3-pro-image-preview
- Gemini pricing page: https://ai.google.dev/gemini-api/docs/pricing
- Gemini 3 guide: https://ai.google.dev/gemini-api/docs/gemini-3

---

## 2. MVP Scope

Build only the core product first.

### Screens

```txt
1. Dashboard
2. New Case
3. Mark Tooth
4. Preview Ready
5. Cases List
6. Settings
```

### Core Features

```txt
- Create case
- Upload smile photo
- Upload optional reference photos
- Mark tooth area with a simple brush
- Select preview model and resolution
- Generate dental preview using Gemini image model
- Store original, mask, and preview images
- Show before/after comparison
- Save case
- Regenerate preview
```

### Explicitly Out of Scope for MVP

```txt
- Billing
- User roles
- Clinic teams
- Patient portal
- Audit logs
- Advanced reports
- Cloud/GPU status UI
- AI validation score UI
- Complicated model analytics
- Realtime collaboration
```

---

## 3. Lean System Architecture

```txt
Dentist Browser
   |
   v
React + Vite App
Cloudflare Pages
   |
   v
Cloudflare Pages Functions
/api/*
   |
   |---- Cloudflare D1
   |     Case metadata, image keys, status, selected model, resolution
   |
   |---- Cloudflare R2
   |     Original image, mask image, generated preview, reference photos
   |
   |---- Gemini API
         Image editing/generation
```

Use Cloudflare Pages as both frontend host and backend runtime. Use D1 and R2 because they are simple, cheap, and fit this MVP.

---

## 4. Cloudflare Services

### Required

| Service | Use |
|---|---|
| Cloudflare Pages | Host React + Vite frontend |
| Pages Functions | API routes under `/api/*` |
| D1 | Store case metadata |
| R2 | Store uploaded and generated images |

### Optional Later

| Service | Use |
|---|---|
| KV | Temporary job status cache |
| Queues | Async image generation if API calls become slow |
| Turnstile | Protect public/demo upload forms |

For MVP, do **not** use Queues unless the synchronous generate request times out or becomes unreliable.

---

## 5. Recommended User Flow

```txt
Dashboard
  ↓ Create New Preview
New Case
  ↓ Enter patient + tooth + concern + upload smile photo
Mark Tooth
  ↓ Paint selected tooth/treatment area
Create Preview
  ↓ Backend calls Gemini
Preview Ready
  ↓ Dentist reviews before/after and saves or retries
```

---

## 6. Model Strategy

### Default Mode

Use **Gemini 3.1 Flash Image Preview** with `imageSize: "0.5K"` as the default because it is the lowest-cost option and enough for quick chairside preview.

```txt
Default model: gemini-3.1-flash-image-preview
Default resolution: 0.5K
Default mode label in UI: Standard Preview
```

### Premium Mode

Use **Gemini 3 Pro Image Preview** for better quality when the dentist wants a cleaner patient presentation.

```txt
Premium model: gemini-3-pro-image-preview
Recommended resolution: 1K or 2K
Premium 4K optional: 4K
```

### UI Selection

Keep this simple:

```txt
Preview Quality
[ Standard ]  Gemini 3.1 Flash Image, default 0.5K
[ Premium ]   Gemini 3 Pro Image, default 1K

Resolution
[ 0.5K ] [ 1K ] [ 2K ] [ 4K ]
```

Rules:

```txt
- Standard mode allows: 0.5K, 1K, 2K, 4K
- Premium mode allows: 1K, 2K, 4K
- App default: Standard + 0.5K
- If user selects Premium and current resolution is 0.5K, auto-switch resolution to 1K
```

---

## 7. Estimated Gemini Cost Per Preview

Pricing below is based on the Gemini Developer API pricing page at the time of this document.

### Gemini 3.1 Flash Image Preview

| Resolution | Output cost per image | Notes |
|---|---:|---|
| 0.5K | $0.045 | Cheapest default preview |
| 1K | $0.067 | Good default if 0.5K quality is too low |
| 2K | $0.101 | Better for patient presentation |
| 4K | $0.151 | Highest Flash resolution |

### Gemini 3 Pro Image Preview

| Resolution | Output cost per image | Notes |
|---|---:|---|
| 1K | $0.134 | Premium default |
| 2K | $0.134 | Same listed price bucket as 1K |
| 4K | $0.240 | Premium high-quality render |

### Input Cost Notes

For Gemini 3 Pro Image Preview, Google lists image input as 560 tokens, equivalent to about **$0.0011 per image input**. For this MVP, the input cost is very small compared to image output cost.

Approximate real cost per successful case:

```txt
Standard 0.5K:  $0.045 + small input cost
Standard 1K:    $0.067 + small input cost
Standard 2K:    $0.101 + small input cost
Standard 4K:    $0.151 + small input cost
Premium 1K/2K:  $0.134 + small input cost
Premium 4K:     $0.240 + small input cost
```

With one retry, roughly double the image output cost.

Recommended UI labels:

```txt
Standard Preview — low cost, quick preview
Premium Preview — higher quality for patient presentation
```

Do not show exact API prices to dentists unless needed. Show internal admin estimate only.

---

## 8. Project Structure

```txt
dentalsim-pro/
  package.json
  vite.config.ts
  wrangler.toml
  tailwind.config.ts
  index.html

  src/
    main.tsx
    App.tsx

    routes/
      Dashboard.tsx
      NewCase.tsx
      MarkTooth.tsx
      PreviewReady.tsx
      Cases.tsx
      Settings.tsx

    components/
      layout/
        AppShell.tsx
        Sidebar.tsx
        Topbar.tsx

      dashboard/
        SummaryCard.tsx
        TodayCasesTable.tsx
        HowItWorksCard.tsx
        RecentBeforeAfter.tsx

      case/
        CaseForm.tsx
        UploadSmilePhoto.tsx
        ReferencePhotos.tsx
        CaseSummary.tsx
        ToothMarker.tsx
        BeforeAfterSlider.tsx
        PreviewQualitySelector.tsx

      ui/
        Button.tsx
        Card.tsx
        Input.tsx
        Select.tsx
        Badge.tsx
        Stepper.tsx

    lib/
      api.ts
      types.ts
      constants.ts
      image.ts

  functions/
    api/
      [[path]].ts

  server/
    ai/
      provider.ts
      mockProvider.ts
      geminiProvider.ts
      index.ts

    db/
      schema.sql

    utils/
      r2.ts
      response.ts
      costs.ts
```

Use a single `functions/api/[[path]].ts` Hono router for simplicity.

---

## 9. Wrangler Config

```toml
name = "dentalsim-pro"
compatibility_date = "2026-05-01"
pages_build_output_dir = "dist"

[[d1_databases]]
binding = "DB"
database_name = "dentalsim-db"
database_id = "REPLACE_WITH_D1_DATABASE_ID"

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "dentalsim-images"

[vars]
APP_ENV = "development"
AI_PROVIDER = "gemini"
DEFAULT_IMAGE_MODEL = "gemini-3.1-flash-image-preview"
DEFAULT_IMAGE_SIZE = "0.5K"
DEFAULT_ASPECT_RATIO = "4:3"
```

Secrets:

```bash
npx wrangler pages secret put GEMINI_API_KEY
```

---

## 10. D1 Schema

```sql
CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  patient_name TEXT NOT NULL,
  tooth_number TEXT,
  concern TEXT,
  shade TEXT DEFAULT 'B1',
  status TEXT NOT NULL DEFAULT 'draft',

  preview_model TEXT DEFAULT 'gemini-3.1-flash-image-preview',
  preview_quality TEXT DEFAULT 'standard',
  image_size TEXT DEFAULT '0.5K',
  aspect_ratio TEXT DEFAULT '4:3',
  estimated_cost_usd REAL DEFAULT 0,

  original_image_key TEXT,
  mask_image_key TEXT,
  preview_image_key TEXT,

  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reference_images (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  image_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (case_id) REFERENCES cases(id)
);
```

Keep only two tables for MVP.

---

## 11. Case Statuses

```ts
export type CaseStatus =
  | "draft"
  | "photo_uploaded"
  | "marked"
  | "generating"
  | "preview_ready"
  | "saved"
  | "failed";
```

Dentist-friendly UI labels:

```ts
export const CASE_STATUS_LABELS = {
  draft: "Draft",
  photo_uploaded: "Photo Added",
  marked: "Marked",
  generating: "Creating Preview",
  preview_ready: "Ready",
  saved: "Saved",
  failed: "Needs Review",
};
```

---

## 12. R2 Storage Keys

```txt
cases/{caseId}/original.jpg
cases/{caseId}/mask.png
cases/{caseId}/preview.jpg
cases/{caseId}/reference-1.jpg
cases/{caseId}/reference-2.jpg
```

Do not expose R2 public URLs in MVP. Stream images through API routes:

```txt
GET /api/cases/:id/image/original
GET /api/cases/:id/image/mask
GET /api/cases/:id/image/preview
GET /api/cases/:id/image/reference/:referenceId
```

---

## 13. API Endpoints

### Case APIs

```txt
POST /api/cases
GET /api/cases
GET /api/cases/:id
PATCH /api/cases/:id
```

### Image APIs

```txt
POST /api/cases/:id/upload
POST /api/cases/:id/references
POST /api/cases/:id/mask
GET  /api/cases/:id/image/:kind
```

### Generation API

```txt
POST /api/cases/:id/generate
```

---

## 14. API Payloads

### Create Case

```http
POST /api/cases
Content-Type: application/json
```

```json
{
  "patientName": "Sarah Johnson",
  "toothNumber": "#11",
  "concern": "Chipped incisal edge",
  "shade": "B1",
  "previewQuality": "standard",
  "imageSize": "0.5K"
}
```

Response:

```json
{
  "caseId": "case_abc123",
  "status": "draft"
}
```

### Upload Original Photo

```http
POST /api/cases/:id/upload
Content-Type: multipart/form-data
```

Form data:

```txt
file = smile-photo.jpg
```

### Upload Mask

```http
POST /api/cases/:id/mask
Content-Type: multipart/form-data
```

Form data:

```txt
file = mask.png
```

### Generate Preview

```http
POST /api/cases/:id/generate
Content-Type: application/json
```

```json
{
  "previewQuality": "standard",
  "model": "gemini-3.1-flash-image-preview",
  "imageSize": "0.5K",
  "aspectRatio": "4:3"
}
```

Response:

```json
{
  "ok": true,
  "status": "preview_ready",
  "previewImageUrl": "/api/cases/case_abc123/image/preview",
  "estimatedCostUsd": 0.045
}
```

---

## 15. Frontend Types

```ts
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
};
```

---

## 16. Cost Helper

```ts
// server/utils/costs.ts

export type GeminiImageModel =
  | "gemini-3.1-flash-image-preview"
  | "gemini-3-pro-image-preview";

export type GeminiImageSize = "0.5K" | "1K" | "2K" | "4K";

export function estimateGeminiImageCostUsd(
  model: GeminiImageModel,
  imageSize: GeminiImageSize
): number {
  if (model === "gemini-3.1-flash-image-preview") {
    const costs: Record<GeminiImageSize, number> = {
      "0.5K": 0.045,
      "1K": 0.067,
      "2K": 0.101,
      "4K": 0.151,
    };
    return costs[imageSize];
  }

  if (model === "gemini-3-pro-image-preview") {
    const costs: Record<GeminiImageSize, number | null> = {
      "0.5K": null,
      "1K": 0.134,
      "2K": 0.134,
      "4K": 0.24,
    };

    const cost = costs[imageSize];
    if (cost === null) {
      throw new Error("Gemini 3 Pro Image does not support 0.5K in this app.");
    }
    return cost;
  }

  throw new Error("Unknown Gemini image model");
}

export function normalizeModelSelection(input: {
  previewQuality: "standard" | "premium";
  imageSize?: GeminiImageSize;
}): { model: GeminiImageModel; imageSize: GeminiImageSize } {
  if (input.previewQuality === "premium") {
    return {
      model: "gemini-3-pro-image-preview",
      imageSize: input.imageSize === "0.5K" ? "1K" : input.imageSize ?? "1K",
    };
  }

  return {
    model: "gemini-3.1-flash-image-preview",
    imageSize: input.imageSize ?? "0.5K",
  };
}
```

---

## 17. Gemini Provider Interface

```ts
// server/ai/provider.ts

export type GeneratePreviewInput = {
  originalImage: ArrayBuffer;
  originalMimeType: string;
  maskImage: ArrayBuffer;
  maskMimeType: string;
  referenceImages?: Array<{
    image: ArrayBuffer;
    mimeType: string;
  }>;
  patientName?: string;
  toothNumber?: string;
  concern?: string;
  shade?: string;
  model: "gemini-3.1-flash-image-preview" | "gemini-3-pro-image-preview";
  imageSize: "0.5K" | "1K" | "2K" | "4K";
  aspectRatio: "1:1" | "4:3" | "3:4" | "16:9" | "9:16";
};

export type GeneratePreviewOutput = {
  image: ArrayBuffer;
  mimeType: "image/jpeg" | "image/png";
  text?: string;
};

export interface ImagePreviewProvider {
  generatePreview(input: GeneratePreviewInput): Promise<GeneratePreviewOutput>;
}
```

---

## 18. Gemini Prompt Template

Keep prompt simple and clinical.

```ts
// server/ai/prompts.ts

export function buildDentalPreviewPrompt(input: {
  toothNumber?: string;
  concern?: string;
  shade?: string;
}) {
  return `
Create a realistic dental treatment preview using the provided smile photo and marked treatment area.

Clinical goal:
- Tooth: ${input.toothNumber ?? "selected tooth"}
- Concern: ${input.concern ?? "restore the marked area"}
- Target shade: ${input.shade ?? "match adjacent teeth"}

Instructions:
- Restore only the marked tooth area.
- Keep the lips, gums, other teeth, lighting, camera angle, and smile shape unchanged.
- Match nearby teeth in shade, shape, translucency, and surface texture.
- Keep the result natural, not overly white.
- Do not add extra teeth.
- Do not change the face, lips, gums, or background.
- The output should be a realistic before/after dental preview for patient discussion.

Important:
- This is for visual communication only, not a guaranteed clinical outcome.
`;
}
```

---

## 19. Gemini REST Payload

Use REST from Cloudflare Pages Functions to avoid Node runtime issues. The Gemini `generateContent` endpoint is:

```txt
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
```

### REST payload shape

```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "Create a realistic dental treatment preview..."
        },
        {
          "inline_data": {
            "mime_type": "image/jpeg",
            "data": "BASE64_ORIGINAL_IMAGE"
          }
        },
        {
          "inline_data": {
            "mime_type": "image/png",
            "data": "BASE64_MASK_IMAGE"
          }
        }
      ]
    }
  ],
  "generationConfig": {
    "responseModalities": ["TEXT", "IMAGE"],
    "imageConfig": {
      "aspectRatio": "4:3",
      "imageSize": "0.5K"
    }
  }
}
```

Notes:

```txt
- Use original smile image as the main visual anchor.
- Use mask image as visual instruction/context.
- Include reference images as additional inline_data parts if available.
- For JavaScript SDK, the field is inlineData; for REST JSON, use inline_data.
- For JavaScript SDK, imageConfig fields are aspectRatio and imageSize.
- For REST JSON, generationConfig.imageConfig can use aspectRatio and imageSize.
```

---

## 20. Gemini Provider Implementation for Cloudflare Pages Functions

```ts
// server/ai/geminiProvider.ts

import type {
  GeneratePreviewInput,
  GeneratePreviewOutput,
  ImagePreviewProvider,
} from "./provider";
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

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

export class GeminiImagePreviewProvider implements ImagePreviewProvider {
  constructor(private apiKey: string) {}

  async generatePreview(input: GeneratePreviewInput): Promise<GeneratePreviewOutput> {
    const prompt = buildDentalPreviewPrompt({
      toothNumber: input.toothNumber,
      concern: input.concern,
      shade: input.shade,
    });

    const parts: any[] = [
      { text: prompt },
      {
        inline_data: {
          mime_type: input.originalMimeType || "image/jpeg",
          data: arrayBufferToBase64(input.originalImage),
        },
      },
      {
        inline_data: {
          mime_type: input.maskMimeType || "image/png",
          data: arrayBufferToBase64(input.maskImage),
        },
      },
    ];

    for (const reference of input.referenceImages ?? []) {
      parts.push({
        inline_data: {
          mime_type: reference.mimeType || "image/jpeg",
          data: arrayBufferToBase64(reference.image),
        },
      });
    }

    const payload = {
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: input.aspectRatio || "4:3",
          imageSize: input.imageSize || "0.5K",
        },
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-goog-api-key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini image generation failed: ${response.status} ${errorText}`);
    }

    const data: any = await response.json();
    const partsOut = data?.candidates?.[0]?.content?.parts ?? [];

    let text = "";
    for (const part of partsOut) {
      if (part.text) text += part.text;

      const inline = part.inlineData ?? part.inline_data;
      if (inline?.data) {
        return {
          image: base64ToArrayBuffer(inline.data),
          mimeType: inline.mimeType ?? inline.mime_type ?? "image/png",
          text,
        };
      }
    }

    throw new Error("Gemini response did not include an image.");
  }
}
```

---

## 21. Provider Factory

```ts
// server/ai/index.ts

import { GeminiImagePreviewProvider } from "./geminiProvider";
import { MockImagePreviewProvider } from "./mockProvider";

export function getImagePreviewProvider(env: Env) {
  if (env.AI_PROVIDER === "mock") {
    return new MockImagePreviewProvider();
  }

  if (env.AI_PROVIDER === "gemini") {
    if (!env.GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY");
    }
    return new GeminiImagePreviewProvider(env.GEMINI_API_KEY);
  }

  return new MockImagePreviewProvider();
}
```

---

## 22. Backend Generate Route

```ts
// inside functions/api/[[path]].ts or separate route file

app.post("/api/cases/:id/generate", async (c) => {
  const caseId = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));

  const normalized = normalizeModelSelection({
    previewQuality: body.previewQuality ?? "standard",
    imageSize: body.imageSize ?? "0.5K",
  });

  const model = body.model ?? normalized.model;
  const imageSize = normalized.imageSize;
  const aspectRatio = body.aspectRatio ?? "4:3";
  const estimatedCostUsd = estimateGeminiImageCostUsd(model, imageSize);

  const row = await c.env.DB.prepare(`
    SELECT id, patient_name, tooth_number, concern, shade,
           original_image_key, mask_image_key
    FROM cases
    WHERE id = ?
  `)
    .bind(caseId)
    .first<any>();

  if (!row) return c.json({ error: "Case not found" }, 404);
  if (!row.original_image_key) return c.json({ error: "Smile photo missing" }, 400);
  if (!row.mask_image_key) return c.json({ error: "Marked tooth area missing" }, 400);

  await c.env.DB.prepare(`
    UPDATE cases
    SET status = ?, preview_model = ?, image_size = ?, aspect_ratio = ?,
        estimated_cost_usd = ?, updated_at = ?
    WHERE id = ?
  `)
    .bind(
      "generating",
      model,
      imageSize,
      aspectRatio,
      estimatedCostUsd,
      new Date().toISOString(),
      caseId
    )
    .run();

  try {
    const original = await c.env.IMAGES.get(row.original_image_key);
    const mask = await c.env.IMAGES.get(row.mask_image_key);

    if (!original || !mask) {
      throw new Error("Image files missing from storage");
    }

    const provider = getImagePreviewProvider(c.env);

    const result = await provider.generatePreview({
      originalImage: await original.arrayBuffer(),
      originalMimeType: original.httpMetadata?.contentType ?? "image/jpeg",
      maskImage: await mask.arrayBuffer(),
      maskMimeType: mask.httpMetadata?.contentType ?? "image/png",
      patientName: row.patient_name,
      toothNumber: row.tooth_number,
      concern: row.concern,
      shade: row.shade,
      model,
      imageSize,
      aspectRatio,
    });

    const previewKey = `cases/${caseId}/preview.jpg`;

    await c.env.IMAGES.put(previewKey, result.image, {
      httpMetadata: {
        contentType: result.mimeType,
      },
    });

    await c.env.DB.prepare(`
      UPDATE cases
      SET status = ?, preview_image_key = ?, updated_at = ?
      WHERE id = ?
    `)
      .bind("preview_ready", previewKey, new Date().toISOString(), caseId)
      .run();

    return c.json({
      ok: true,
      status: "preview_ready",
      previewImageUrl: `/api/cases/${caseId}/image/preview`,
      estimatedCostUsd,
    });
  } catch (error: any) {
    await c.env.DB.prepare(`
      UPDATE cases
      SET status = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `)
      .bind("failed", error.message ?? "Preview generation failed", new Date().toISOString(), caseId)
      .run();

    return c.json({ error: error.message ?? "Preview generation failed" }, 500);
  }
});
```

---

## 23. Frontend Preview Quality Selector

```tsx
// src/components/case/PreviewQualitySelector.tsx

type Props = {
  previewQuality: "standard" | "premium";
  imageSize: "0.5K" | "1K" | "2K" | "4K";
  onChange: (value: {
    previewQuality: "standard" | "premium";
    imageSize: "0.5K" | "1K" | "2K" | "4K";
  }) => void;
};

const COSTS = {
  standard: {
    "0.5K": "$0.045",
    "1K": "$0.067",
    "2K": "$0.101",
    "4K": "$0.151",
  },
  premium: {
    "1K": "$0.134",
    "2K": "$0.134",
    "4K": "$0.240",
  },
};

export function PreviewQualitySelector({ previewQuality, imageSize, onChange }: Props) {
  const allowedSizes = previewQuality === "premium"
    ? ["1K", "2K", "4K"]
    : ["0.5K", "1K", "2K", "4K"];

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold">Preview Quality</h3>
      <p className="mt-1 text-sm text-slate-500">
        Standard is enough for most chairside previews.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          className={previewQuality === "standard" ? "selected-card" : "plain-card"}
          onClick={() => onChange({ previewQuality: "standard", imageSize })}
        >
          <div className="font-medium">Standard</div>
          <div className="text-sm text-slate-500">Fast, lower cost</div>
        </button>

        <button
          type="button"
          className={previewQuality === "premium" ? "selected-card" : "plain-card"}
          onClick={() => onChange({ previewQuality: "premium", imageSize: imageSize === "0.5K" ? "1K" : imageSize })}
        >
          <div className="font-medium">Premium</div>
          <div className="text-sm text-slate-500">Better patient presentation</div>
        </button>
      </div>

      <div className="mt-5">
        <label className="text-sm font-medium">Resolution</label>
        <div className="mt-2 flex gap-2">
          {allowedSizes.map((size) => (
            <button
              type="button"
              key={size}
              className={imageSize === size ? "selected-pill" : "plain-pill"}
              onClick={() => onChange({ previewQuality, imageSize: size as any })}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

Replace `selected-card`, `plain-card`, `selected-pill`, `plain-pill` with Tailwind classes or UI components.

---

## 24. Tooth Marking Implementation

The dentist should see purple marking, but the backend should receive a mask image.

### UX

```txt
- Brush size
- Brush
- Erase
- Reset
- Create Preview
```

### Technical Flow

```txt
1. Load original image.
2. Place transparent canvas over image.
3. Dentist paints selected area with purple overlay.
4. On save, export a mask PNG:
   - white pixels = selected treatment area
   - transparent or black pixels = preserve
5. Upload mask to /api/cases/:id/mask.
```

### Important

For Gemini, the prompt should explicitly say that the mask image indicates the treatment area. The model does not require a formal mask parameter in this MVP; the mask is provided as an additional image input and explained in the text prompt.

---

## 25. Frontend Generation Flow

```ts
async function createPreview(caseId: string, options: {
  previewQuality: "standard" | "premium";
  imageSize: "0.5K" | "1K" | "2K" | "4K";
}) {
  const response = await fetch(`/api/cases/${caseId}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      previewQuality: options.previewQuality,
      imageSize: options.imageSize,
      aspectRatio: "4:3",
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}
```

After success:

```txt
navigate(`/cases/${caseId}/preview`)
```

---

## 26. Error Handling

Keep errors simple for dentists.

| Backend Error | UI Message |
|---|---|
| missing original image | Please upload a smile photo first. |
| missing mask | Please mark the tooth area first. |
| Gemini failed | Preview could not be created. Please try again. |
| file too large | Please upload a smaller image. |
| unsupported format | Please use JPG or PNG. |

Do not show raw Gemini API errors to the dentist.

---

## 27. Implementation Tickets

## Ticket 1 — Project Setup

### Goal
Create the base React + Vite + Cloudflare Pages project.

### Tasks

```txt
- Create Vite React TypeScript app
- Add Tailwind CSS
- Add React Router
- Add Hono for Pages Functions
- Add basic Cloudflare wrangler.toml
- Add AppShell, Sidebar, Topbar
```

### Expected Result

```txt
App runs locally with a clean dentist-friendly shell.
Routes exist but can use static placeholder content.
```

---

## Ticket 2 — Simple UI Screens

### Goal
Build the simplified UI matching the approved mockup direction.

### Tasks

```txt
- Dashboard page
- New Case page
- Mark Tooth page
- Preview Ready page
- Cases List page
- Settings page placeholder
```

### Expected Result

```txt
Dentist can navigate through the product visually.
No backend integration required yet.
No developer-facing UI language.
```

---

## Ticket 3 — D1 Database Setup

### Goal
Create the database schema and migrations.

### Tasks

```txt
- Create D1 database
- Add schema.sql
- Add cases table
- Add reference_images table
- Add local migration command
- Add remote migration command
```

### Expected Result

```txt
D1 has cases and reference_images tables.
API can read/write basic case data.
```

---

## Ticket 4 — R2 Image Storage

### Goal
Store uploaded smile photos and masks in R2.

### Tasks

```txt
- Create R2 bucket dentalsim-images
- Add R2 binding IMAGES
- Implement upload helper
- Implement image streaming route
- Validate JPG/PNG input
- Add file size limit
```

### Expected Result

```txt
Uploaded smile photo is stored in R2.
Frontend can display the stored photo through /api/cases/:id/image/original.
```

---

## Ticket 5 — Case API

### Goal
Implement core case APIs.

### Tasks

```txt
- POST /api/cases
- GET /api/cases
- GET /api/cases/:id
- PATCH /api/cases/:id
- POST /api/cases/:id/upload
- POST /api/cases/:id/references
- GET /api/cases/:id/image/:kind
```

### Expected Result

```txt
Frontend can create a case, upload a photo, fetch case data, and list cases.
```

---

## Ticket 6 — New Case Backend Integration

### Goal
Connect New Case screen to API.

### Tasks

```txt
- Submit patient name, tooth number, concern, shade, quality, resolution
- Create case via API
- Upload original smile photo
- Upload optional references
- Navigate to Mark Tooth page
- Add loading/error states
```

### Expected Result

```txt
Dentist can create a real case and upload images.
Data is stored in D1 and R2.
```

---

## Ticket 7 — Tooth Marker

### Goal
Implement simple tooth marking with canvas.

### Tasks

```txt
- Display original image
- Add overlay canvas
- Brush size slider
- Brush tool
- Erase tool
- Reset tool
- Export mask PNG
- Upload mask to /api/cases/:id/mask
```

### Expected Result

```txt
Dentist can mark only the tooth area and save the mask.
Mask image is stored in R2.
Case status becomes marked.
```

---

## Ticket 8 — Preview Quality + Resolution Selector

### Goal
Allow model and resolution choice while keeping the UI simple.

### Tasks

```txt
- Add PreviewQualitySelector component
- Standard = gemini-3.1-flash-image-preview
- Premium = gemini-3-pro-image-preview
- Default Standard + 0.5K
- If Premium selected and 0.5K is active, switch to 1K
- Show simple internal estimated cost in small text or settings/admin only
```

### Expected Result

```txt
Case stores preview_quality, preview_model, image_size, aspect_ratio, estimated_cost_usd.
Default preview is low-cost.
```

---

## Ticket 9 — Gemini Provider

### Goal
Implement actual Gemini image generation.

### Tasks

```txt
- Add provider interface
- Add GeminiImagePreviewProvider
- Add REST fetch to Gemini generateContent endpoint
- Add base64 conversion helpers for Cloudflare runtime
- Add dental prompt builder
- Parse inline image response
- Store output in R2
```

### Expected Result

```txt
POST /api/cases/:id/generate calls Gemini and stores preview image in R2.
Case status becomes preview_ready.
```

---

## Ticket 10 — Generate Preview Route

### Goal
Connect generation endpoint to D1/R2/Gemini.

### Tasks

```txt
- Validate case exists
- Validate original image exists
- Validate mask exists
- Normalize model/resolution selection
- Estimate cost
- Set status generating
- Call provider
- Save generated image
- Set status preview_ready
- Return preview image URL
- Handle errors and set failed status
```

### Expected Result

```txt
Dentist clicks Create Preview and gets redirected to Preview Ready page after successful generation.
```

---

## Ticket 11 — Preview Ready Screen

### Goal
Show the before/after result simply.

### Tasks

```txt
- Fetch case data
- Show before/after slider
- Show patient, tooth, concern, shade
- Show notes: Restores chipped edge, Matches nearby teeth, For visual discussion only
- Buttons: Try Again, Save Preview, Present to Patient
```

### Expected Result

```txt
Dentist can review the generated result with patient.
No technical model information shown in the main dentist UI.
```

---

## Ticket 12 — Cases List + Dashboard Data

### Goal
Make dashboard and cases list use real backend data.

### Tasks

```txt
- GET /api/cases integration
- Dashboard summary counts
- Today’s Cases table
- Recent Before & After cards
- Cases list page
```

### Expected Result

```txt
Dashboard reflects real cases and previews.
```

---

## Ticket 13 — Final MVP Polish

### Goal
Make the MVP usable in a clinic demo.

### Tasks

```txt
- Loading states
- Empty states
- Friendly error messages
- Image upload compression if needed
- Disable buttons during processing
- Responsive layout for tablet width
- Add disclaimer: For visual discussion only. Final outcome may vary.
```

### Expected Result

```txt
Product is ready for a dentist-facing MVP demo.
```

---

## 28. Expected Final MVP Result

At the end of the implementation, the app should support:

```txt
1. Dentist opens dashboard.
2. Dentist clicks Create New Preview.
3. Dentist enters patient name, tooth number, and concern.
4. Dentist uploads smile photo.
5. Dentist marks the chipped/restoration area.
6. Dentist selects Standard/Premium and resolution.
7. Dentist clicks Create Preview.
8. Backend calls Gemini image model.
9. Generated preview is stored in R2.
10. Dentist sees before/after result.
11. Dentist can save, retry, or present to patient.
```

---

## 29. Agent Guardrails

When implementing, do **not** add extra features unless explicitly requested.

```txt
Do not add billing.
Do not add login initially.
Do not add developer pipeline UI.
Do not show AI model names to dentists unless in Settings/Admin.
Do not show raw Gemini errors to users.
Do not add technical logs to UI.
Do not overcomplicate the dashboard.
Keep UI language simple and clinical.
```

---

## 30. Recommended First Build Order

```txt
1. App shell + simplified UI
2. D1 schema
3. R2 upload + image display
4. Case APIs
5. New Case flow
6. Tooth marker
7. Mock generation route
8. Gemini provider
9. Preview Ready page
10. Dashboard real data
11. Polish and demo readiness
```

---

## 31. Final Architecture Summary

```txt
React + Vite + Tailwind
        ↓
Cloudflare Pages
        ↓
Pages Functions API with Hono
        ↓
D1 for case records
R2 for images
Gemini API for preview generation
        ↓
Before/after preview for dentist and patient discussion
```

This is the leanest practical version of DentalSim Pro while still supporting real Gemini image generation, cost control through resolution selection, and a simple dentist-first workflow.
