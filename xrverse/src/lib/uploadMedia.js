
import { supabase } from "./supabaseClient";

const BUCKET = "xrverse-media";

const MEDIA_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  glb: "model/gltf-binary",
};

export async function uploadMedia(file, userId, kind) {
  if (!file) return null;

  const extension = file.name
    .split(".")
    .pop()
    ?.toLowerCase();

  const contentType = MEDIA_TYPES[extension];

  const isImage = [
    "jpg", "jpeg", "png", "webp", "gif"
  ].includes(extension);

  const isModel = extension === "glb";

  if (!contentType) {
    throw new Error(
      "Unsupported file. Upload JPG, PNG, WEBP, GIF, or GLB."
    );
  }

  if (kind === "image" && !isImage) {
    throw new Error("Please select an image file.");
  }

  if (kind === "model" && !isModel) {
    throw new Error("Please select a GLB 3D model.");
  }

  const maximumSize =
    kind === "model" ? 25 * 1024 * 1024 : 10 * 1024 * 1024;

  if (file.size > maximumSize) {
    throw new Error(
      kind === "model"
        ? "3D models must be 25 MB or smaller."
        : "Images must be 10 MB or smaller."
    );
  }

  // Create a unique filename inside the user's folder.
  const filePath =
    `${userId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
  .from("xrverse-media")
  .upload(filePath, file, {
    contentType,
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}
