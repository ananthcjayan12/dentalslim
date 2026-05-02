import { useNavigate } from "react-router-dom";
import { Stepper } from "../components/ui/Stepper";
import { CaseForm } from "../components/case/CaseForm";
import { api } from "../lib/api";

export default function NewCase() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-3xl">
      <Stepper step={1} />
      <h2 className="mb-4 text-2xl font-bold">New Case</h2>
      <CaseForm onSubmit={async (data) => {
        const created = await api.createCase({ patientName: data.patientName, toothNumber: data.toothNumber, concern: data.concern, shade: data.shade, previewQuality: data.previewQuality, imageSize: data.imageSize });
        await api.uploadCaseImage(created.caseId, data.file, "upload");
        if (data.refs.length > 0) await api.uploadReferenceImages(created.caseId, data.refs);
        navigate(`/cases/${created.caseId}/mark`);
      }} />
    </div>
  );
}
