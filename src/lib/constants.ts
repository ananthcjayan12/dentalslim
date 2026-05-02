import type { CaseStatus } from "./types";

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  draft: "Draft",
  photo_uploaded: "Photo Added",
  marked: "Marked",
  generating: "Creating Preview",
  preview_ready: "Ready",
  saved: "Saved",
  failed: "Needs Review",
};

export const DISCLAIMER = "For visual discussion only. Final outcome may vary.";
