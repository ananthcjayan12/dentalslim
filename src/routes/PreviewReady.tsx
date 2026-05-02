import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BeforeAfterSlider } from "../components/case/BeforeAfterSlider";
import { PreviewQualitySelector } from "../components/case/PreviewQualitySelector";
import { Stepper } from "../components/ui/Stepper";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { api } from "../lib/api";
import { DISCLAIMER } from "../lib/constants";
import type { DentalCase, GeminiImageSize, PreviewQuality } from "../lib/types";

export default function PreviewReady() {
  const { id = "" } = useParams();
  const [caseData, setCaseData] = useState<DentalCase | null>(null);
  const [quality, setQuality] = useState<PreviewQuality>("standard");
  const [size, setSize] = useState<GeminiImageSize>("0.5K");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const data = await api.getCase(id);
    setCaseData(data.case);
    setQuality(data.case.previewQuality);
    setSize(data.case.imageSize);
  };

  useEffect(() => { load().catch((e) => setError(e.message)); }, [id]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!caseData) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      <Stepper step={caseData.previewImageUrl ? 4 : 3} />
      <h2 className="text-2xl font-bold">{caseData.previewImageUrl ? "Preview Ready" : "Create Preview"}</h2>
      <PreviewQualitySelector previewQuality={quality} imageSize={size} onChange={(v) => { setQuality(v.previewQuality); setSize(v.imageSize); }} />
      <Button disabled={busy} onClick={async () => {
        setBusy(true); setError("");
        try { await api.generatePreview(id, { previewQuality: quality, imageSize: size }); await load(); }
        catch (e: any) { setError(e.message.includes("Smile photo") ? "Please upload a smile photo first." : e.message.includes("Marked") ? "Please mark the tooth area first." : "Preview could not be created. Please try again."); }
        finally { setBusy(false); }
      }}>{busy ? "Creating Preview..." : "Create Preview"}</Button>
      {caseData.originalImageUrl && caseData.previewImageUrl && <BeforeAfterSlider before={caseData.originalImageUrl} after={caseData.previewImageUrl} />}
      <Card>
        <div className="font-semibold">Case Notes</div>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
          <li>Restores chipped edge</li><li>Matches nearby teeth</li><li>{DISCLAIMER}</li>
        </ul>
      </Card>
    </div>
  );
}
