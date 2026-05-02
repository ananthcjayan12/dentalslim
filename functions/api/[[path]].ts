import { Hono } from "hono";
import { cors } from "hono/cors";
import { getImagePreviewProvider } from "../../server/ai";
import { estimateGeminiImageCostUsd, normalizeModelSelection } from "../../server/utils/costs";
import { assertImageFile, imageExtFromMime } from "../../server/utils/r2";

type CaseRow = {
  id: string;
  patient_name: string;
  tooth_number: string | null;
  concern: string | null;
  shade: string | null;
  status: string;
  preview_model: string;
  preview_quality: string;
  image_size: string;
  aspect_ratio: string;
  estimated_cost_usd: number | null;
  original_image_key: string | null;
  mask_image_key: string | null;
  preview_image_key: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

declare global {
  interface Env {
    DB: D1Database;
    IMAGES: R2Bucket;
    GEMINI_API_KEY?: string;
    AI_PROVIDER: "gemini" | "mock";
    DEFAULT_IMAGE_MODEL: "gemini-3.1-flash-image-preview";
    DEFAULT_IMAGE_SIZE: "0.5K" | "1K" | "2K" | "4K";
    DEFAULT_ASPECT_RATIO: "1:1" | "4:3" | "3:4" | "16:9" | "9:16";
  }
}

const app = new Hono<{ Bindings: Env }>();
app.use("*", cors());

app.onError((error, c) => {
  console.error("Pages Function error", error);
  return c.json(
    {
      error: "Server configuration issue. Please verify Cloudflare bindings and deploy settings.",
    },
    500
  );
});

app.use("/api/*", async (c, next) => {
  if (!c.env.DB) {
    return c.json({ error: "Missing Cloudflare D1 binding: DB" }, 500);
  }

  if (!c.env.IMAGES) {
    return c.json({ error: "Missing Cloudflare R2 binding: IMAGES" }, 500);
  }

  await next();
});

function toCase(row: CaseRow) {
  return {
    id: row.id,
    patientName: row.patient_name,
    toothNumber: row.tooth_number || undefined,
    concern: row.concern || undefined,
    shade: row.shade || undefined,
    status: row.status,
    previewModel: row.preview_model,
    previewQuality: row.preview_quality,
    imageSize: row.image_size,
    aspectRatio: row.aspect_ratio,
    estimatedCostUsd: row.estimated_cost_usd ?? 0,
    originalImageUrl: row.original_image_key ? `/api/cases/${row.id}/image/original` : undefined,
    maskImageUrl: row.mask_image_key ? `/api/cases/${row.id}/image/mask` : undefined,
    previewImageUrl: row.preview_image_key ? `/api/cases/${row.id}/image/preview` : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    notes: row.notes || undefined,
  };
}

async function getCaseRow(c: any, id: string) {
  return (await c.env.DB.prepare("SELECT * FROM cases WHERE id = ?").bind(id).first()) as CaseRow | null;
}

app.post("/api/cases", async (c) => {
  const body: any = await c.req.json().catch(() => ({}));
  if (!body.patientName) return c.json({ error: "Patient name is required" }, 400);
  const id = `case_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const now = new Date().toISOString();
  const normalized = normalizeModelSelection({ previewQuality: body.previewQuality ?? "standard", imageSize: body.imageSize ?? "0.5K" });
  await c.env.DB.prepare(`INSERT INTO cases (
      id, patient_name, tooth_number, concern, shade, status, preview_model, preview_quality,
      image_size, aspect_ratio, estimated_cost_usd, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, body.patientName, body.toothNumber ?? null, body.concern ?? null, body.shade ?? "B1", "draft", normalized.model, body.previewQuality ?? "standard", normalized.imageSize, "4:3", 0, now, now)
    .run();
  return c.json({ caseId: id, status: "draft" });
});

app.get("/api/cases", async (c) => {
  const rows = await c.env.DB.prepare("SELECT * FROM cases ORDER BY created_at DESC").all<CaseRow>();
  return c.json({ cases: (rows.results || []).map(toCase) });
});

app.get("/api/cases/:id", async (c) => {
  const row = await getCaseRow(c, c.req.param("id"));
  if (!row) return c.json({ error: "Case not found" }, 404);
  return c.json({ case: toCase(row) });
});

app.patch("/api/cases/:id", async (c) => {
  const id = c.req.param("id");
  const body: any = await c.req.json().catch(() => ({}));
  const row = await getCaseRow(c, id);
  if (!row) return c.json({ error: "Case not found" }, 404);
  await c.env.DB.prepare("UPDATE cases SET patient_name=?, tooth_number=?, concern=?, shade=?, status=?, updated_at=? WHERE id=?")
    .bind(body.patientName ?? row.patient_name, body.toothNumber ?? row.tooth_number, body.concern ?? row.concern, body.shade ?? row.shade, body.status ?? row.status, new Date().toISOString(), id)
    .run();
  return c.json({ ok: true });
});

app.post("/api/cases/:id/upload", async (c) => {
  const id = c.req.param("id");
  const row = await getCaseRow(c, id);
  if (!row) return c.json({ error: "Case not found" }, 404);
  const form = await c.req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return c.json({ error: "Missing file" }, 400);
  try { assertImageFile(file); } catch (e: any) { return c.json({ error: e.message }, 400); }
  const key = `cases/${id}/original.${imageExtFromMime(file.type)}`;
  await c.env.IMAGES.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  await c.env.DB.prepare("UPDATE cases SET original_image_key=?, status=?, updated_at=? WHERE id=?").bind(key, "photo_uploaded", new Date().toISOString(), id).run();
  return c.json({ ok: true });
});

app.post("/api/cases/:id/references", async (c) => {
  const id = c.req.param("id");
  const row = await getCaseRow(c, id);
  if (!row) return c.json({ error: "Case not found" }, 404);
  const form = await c.req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  let i = 1;
  for (const file of files.slice(0, 3)) {
    try { assertImageFile(file); } catch { continue; }
    const key = `cases/${id}/reference-${i}.${imageExtFromMime(file.type)}`;
    await c.env.IMAGES.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
    await c.env.DB.prepare("INSERT INTO reference_images (id, case_id, image_key, created_at) VALUES (?, ?, ?, ?)").bind(`ref_${crypto.randomUUID().slice(0, 10)}`, id, key, new Date().toISOString()).run();
    i += 1;
  }
  return c.json({ ok: true });
});

app.post("/api/cases/:id/mask", async (c) => {
  const id = c.req.param("id");
  const row = await getCaseRow(c, id);
  if (!row) return c.json({ error: "Case not found" }, 404);
  const form = await c.req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return c.json({ error: "Missing file" }, 400);
  if (file.type !== "image/png") return c.json({ error: "Mask must be PNG." }, 400);
  if (file.size > 8 * 1024 * 1024) return c.json({ error: "Please upload a smaller image." }, 400);
  const key = `cases/${id}/mask.png`;
  await c.env.IMAGES.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  await c.env.DB.prepare("UPDATE cases SET mask_image_key=?, status=?, updated_at=? WHERE id=?").bind(key, "marked", new Date().toISOString(), id).run();
  return c.json({ ok: true });
});

app.get("/api/cases/:id/image/:kind", async (c) => {
  const id = c.req.param("id");
  const kind = c.req.param("kind");
  const row = await getCaseRow(c, id);
  if (!row) return c.json({ error: "Case not found" }, 404);
  const key = kind === "original" ? row.original_image_key : kind === "mask" ? row.mask_image_key : kind === "preview" ? row.preview_image_key : null;
  if (!key) return c.json({ error: "Image not found" }, 404);
  const object = await c.env.IMAGES.get(key);
  if (!object) return c.json({ error: "Image not found" }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("cache-control", "private, max-age=60");
  return new Response(object.body, { headers });
});

app.post("/api/cases/:id/generate", async (c) => {
  const caseId = c.req.param("id");
  const body: any = await c.req.json().catch(() => ({}));
  const normalized = normalizeModelSelection({ previewQuality: body.previewQuality ?? "standard", imageSize: body.imageSize ?? "0.5K" });
  const model = body.model ?? normalized.model;
  const imageSize = normalized.imageSize;
  const aspectRatio = body.aspectRatio ?? "4:3";
  const estimatedCostUsd = estimateGeminiImageCostUsd(model, imageSize);

  const row = await c.env.DB.prepare(`SELECT id, patient_name, tooth_number, concern, shade, original_image_key, mask_image_key FROM cases WHERE id=?`).bind(caseId).first<any>();
  if (!row) return c.json({ error: "Case not found" }, 404);
  if (!row.original_image_key) return c.json({ error: "Please upload a smile photo first." }, 400);
  if (!row.mask_image_key) return c.json({ error: "Please mark the tooth area first." }, 400);

  await c.env.DB.prepare("UPDATE cases SET status=?, preview_model=?, preview_quality=?, image_size=?, aspect_ratio=?, estimated_cost_usd=?, updated_at=? WHERE id=?")
    .bind("generating", model, body.previewQuality ?? "standard", imageSize, aspectRatio, estimatedCostUsd, new Date().toISOString(), caseId)
    .run();

  try {
    const original = await c.env.IMAGES.get(row.original_image_key);
    const mask = await c.env.IMAGES.get(row.mask_image_key);
    if (!original || !mask) throw new Error("Image files missing from storage");

    const refsRows = await c.env.DB.prepare("SELECT image_key FROM reference_images WHERE case_id=? ORDER BY created_at ASC").bind(caseId).all<{ image_key: string }>();
    const referenceImages: Array<{ image: ArrayBuffer; mimeType: string }> = [];
    for (const ref of refsRows.results || []) {
      const obj = await c.env.IMAGES.get(ref.image_key);
      if (obj) referenceImages.push({ image: await obj.arrayBuffer(), mimeType: obj.httpMetadata?.contentType || "image/jpeg" });
    }

    const provider = getImagePreviewProvider(c.env);
    const result = await provider.generatePreview({
      originalImage: await original.arrayBuffer(),
      originalMimeType: original.httpMetadata?.contentType ?? "image/jpeg",
      maskImage: await mask.arrayBuffer(),
      maskMimeType: mask.httpMetadata?.contentType ?? "image/png",
      referenceImages,
      patientName: row.patient_name,
      toothNumber: row.tooth_number,
      concern: row.concern,
      shade: row.shade,
      model,
      imageSize,
      aspectRatio,
    });

    const previewKey = `cases/${caseId}/preview.jpg`;
    await c.env.IMAGES.put(previewKey, result.image, { httpMetadata: { contentType: result.mimeType } });
    await c.env.DB.prepare("UPDATE cases SET status=?, preview_image_key=?, updated_at=? WHERE id=?").bind("preview_ready", previewKey, new Date().toISOString(), caseId).run();

    return c.json({ ok: true, status: "preview_ready", previewImageUrl: `/api/cases/${caseId}/image/preview`, estimatedCostUsd });
  } catch {
    await c.env.DB.prepare("UPDATE cases SET status=?, notes=?, updated_at=? WHERE id=?").bind("failed", "Preview could not be created. Please try again.", new Date().toISOString(), caseId).run();
    return c.json({ error: "Preview could not be created. Please try again." }, 500);
  }
});

export const onRequest = app.fetch;
