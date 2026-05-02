export function buildDentalPreviewPrompt(input: { toothNumber?: string; concern?: string; shade?: string }) {
  return `Create a realistic dental treatment preview using the provided smile photo and marked treatment area.

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
- This is for visual communication only, not a guaranteed clinical outcome.`;
}
