const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface UploadOptions {
  maxWidth: number;
  maxHeight: number;
  quality?: number;
}

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Unsupported file type. Please upload a JPG, PNG, or WebP image.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Please choose an image smaller than 10 MB.";
  }
  return null;
}

function resizeImage(file: File, opts: UploadOptions): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > opts.maxWidth) {
        height = Math.round(height * (opts.maxWidth / width));
        width = opts.maxWidth;
      }
      if (height > opts.maxHeight) {
        width = Math.round(width * (opts.maxHeight / height));
        height = opts.maxHeight;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Image compression failed"));
        },
        "image/jpeg",
        opts.quality ?? 0.8,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

export interface UploadResult {
  storageId: string;
}

export async function uploadProfileImage(
  file: File,
  generateUploadUrl: () => Promise<string>,
): Promise<string> {
  const validationError = validateFile(file);
  if (validationError) throw new Error(validationError);

  const resized = await resizeImage(file, { maxWidth: 512, maxHeight: 512 });

  const uploadUrl = await generateUploadUrl();
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": resized.type },
    body: resized,
  });
  if (!response.ok) {
    throw new Error("Unable to upload your profile picture.\nPlease try again.");
  }
  const result: UploadResult = await response.json();
  return result.storageId;
}

export async function uploadBannerImage(
  file: File,
  generateUploadUrl: () => Promise<string>,
): Promise<string> {
  const validationError = validateFile(file);
  if (validationError) throw new Error(validationError);

  const resized = await resizeImage(file, { maxWidth: 1600, maxHeight: 400 });

  const uploadUrl = await generateUploadUrl();
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": resized.type },
    body: resized,
  });
  if (!response.ok) {
    throw new Error("Banner upload failed.\nPlease check your internet connection.");
  }
  const result: UploadResult = await response.json();
  return result.storageId;
}
