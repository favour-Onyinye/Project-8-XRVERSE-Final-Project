
import { supabase } from "./supabaseClient";

const PRIVATE_BUCKET = "xrverse-private-media";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_MODEL_SIZE = 25 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function uploadPrivateMedia(
  file,
  userId,
  type
) {
  if (!(file instanceof File)) {
    throw new Error("Please select a valid file.");
  }

  // Verify the signed-in account.
  const {
    data,
    error: authError,
  } = await supabase.auth.getUser();

  const user = data?.user;

  if (
    authError ||
    !user ||
    user.is_anonymous === true
  ) {
    throw new Error(
      "Please log in with a registered account."
    );
  }

  // Prevent uploads into another user's folder.
  if (user.id !== userId) {
    throw new Error(
      "You can only upload files to your own account."
    );
  }

  const extension = file.name
    .split(".")
    .pop()
    ?.toLowerCase();

  let contentType;

  if (type === "image") {
    contentType = ALLOWED_IMAGE_TYPES[extension];

    if (!contentType || file.type !== contentType) {
      throw new Error(
        "Only JPG, PNG, WEBP, and GIF images are supported."
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error(
        "Images must be 10 MB or smaller."
      );
    }
  } else if (type === "model") {
    if (extension !== "glb") {
      throw new Error(
        "Only GLB 3D models are supported."
      );
    }

    if (
      file.type &&
      ![
        "model/gltf-binary",
        "application/octet-stream",
      ].includes(file.type)
    ) {
      throw new Error(
        "This file is not recognized as a GLB model."
      );
    }

    if (file.size > MAX_MODEL_SIZE) {
      throw new Error(
        "3D models must be 25 MB or smaller."
      );
    }

    contentType = "model/gltf-binary";
  } else {
    throw new Error(
      "Unsupported media type."
    );
  }

  // Generate a unique storage path.
  const filePath =
    `${user.id}/${crypto.randomUUID()}.${extension}`;

  // Upload to the PRIVATE bucket.
  const {
    data: uploadData,
    error: uploadError,
  } = await supabase.storage
    .from(PRIVATE_BUCKET)
    .upload(filePath, file, {
      contentType,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  // Return the storage location, NOT a public URL.
  return {
    bucket: PRIVATE_BUCKET,
    path: uploadData.path,
  };
}
