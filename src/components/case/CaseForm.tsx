import { useState } from "react";
import type { GeminiImageSize, PreviewQuality } from "../../lib/types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { PreviewQualitySelector } from "./PreviewQualitySelector";

export function CaseForm({ onSubmit }: { onSubmit: (data: { patientName: string; toothNumber: string; concern: string; shade: string; previewQuality: PreviewQuality; imageSize: GeminiImageSize; file: File; refs: File[]; }) => Promise<void> }) {
  const [patientName, setPatientName] = useState("");
  const [toothNumber, setToothNumber] = useState("");
  const [concern, setConcern] = useState("");
  const [shade, setShade] = useState("B1");
  const [previewQuality, setPreviewQuality] = useState<PreviewQuality>("standard");
  const [imageSize, setImageSize] = useState<GeminiImageSize>("0.5K");
  const [file, setFile] = useState<File | null>(null);
  const [refs, setRefs] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault();
      if (!file) return;
      setBusy(true);
      try { await onSubmit({ patientName, toothNumber, concern, shade, previewQuality, imageSize, file, refs }); } finally { setBusy(false); }
    }}>
      <Input required placeholder="Patient name" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
      <Input placeholder="Tooth number (e.g., #11)" value={toothNumber} onChange={(e) => setToothNumber(e.target.value)} />
      <Input placeholder="Concern" value={concern} onChange={(e) => setConcern(e.target.value)} />
      <Input placeholder="Shade" value={shade} onChange={(e) => setShade(e.target.value)} />
      <div><label className="mb-1 block text-sm">Smile Photo (JPG/PNG)</label><input required type="file" accept="image/png,image/jpeg" onChange={(e) => setFile(e.target.files?.[0] || null)} /></div>
      <div><label className="mb-1 block text-sm">Reference Photos (optional)</label><input multiple type="file" accept="image/png,image/jpeg" onChange={(e) => setRefs(Array.from(e.target.files || []))} /></div>
      <PreviewQualitySelector previewQuality={previewQuality} imageSize={imageSize} onChange={(v) => { setPreviewQuality(v.previewQuality); setImageSize(v.imageSize); }} />
      <Button type="submit" disabled={busy || !file}>{busy ? "Creating case..." : "Continue to Mark Tooth"}</Button>
    </form>
  );
}
