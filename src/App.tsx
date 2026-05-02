import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import Dashboard from "./routes/Dashboard";
import NewCase from "./routes/NewCase";
import MarkTooth from "./routes/MarkTooth";
import PreviewReady from "./routes/PreviewReady";
import Cases from "./routes/Cases";
import Settings from "./routes/Settings";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/new" element={<NewCase />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/cases/:id/mark" element={<MarkTooth />} />
        <Route path="/cases/:id/preview" element={<PreviewReady />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
