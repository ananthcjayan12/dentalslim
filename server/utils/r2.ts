const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png"]);

export function assertImageFile(file: File) {
  if (!ALLOWED.has(file.type)) throw new Error("Please use JPG or PNG.");
  if (file.size > MAX_FILE_SIZE) throw new Error("Please upload a smaller image.");
}

export function imageExtFromMime(mime: string) {
  return mime === "image/png" ? "png" : "jpg";
}
