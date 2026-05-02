export async function canvasToPngFile(canvas: HTMLCanvasElement, filename: string): Promise<File> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to create mask"))), "image/png");
  });
  return new File([blob], filename, { type: "image/png" });
}
