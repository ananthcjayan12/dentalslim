import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Stepper } from "../components/ui/Stepper";
import { ToothMarker } from "../components/case/ToothMarker";
import { api } from "../lib/api";
import type { DentalCase } from "../lib/types";

export default function MarkTooth() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<DentalCase | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api.getCase(id).then((d) => setCaseData(d.case)).catch((e) => setError(e.message)); }, [id]);
  if (error) return <p className="text-red-600">{error}</p>;
  if (!caseData) return <p>Loading...</p>;
  if (!caseData.originalImageUrl) return <p>Please upload a smile photo first.</p>;
  return (
    <div>
      <Stepper step={2} />
      <h2 className="mb-4 text-2xl font-bold">Mark Tooth Area</h2>
      <ToothMarker imageUrl={caseData.originalImageUrl} onSave={async (file) => {
        await api.uploadCaseImage(id, file, "mask");
        navigate(`/cases/${id}/preview`);
      }} />
    </div>
  );
}
