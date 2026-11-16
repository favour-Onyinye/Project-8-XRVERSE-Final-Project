
import { supabase } from "./supabaseClient";

const PRIVATE_BUCKET = "xrverse-private-media";

// Signed URLs expire after 5 minutes.
const URL_EXPIRATION_SECONDS = 300;

export async function getPrivateMediaUrl(filePath) {
  if (
    typeof filePath !== "string" ||
    !filePath.trim()
  ) {
    throw new Error(
      "A valid private media path is required."
    );
  }

  // Verify the current account.
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
      "Please log in to view private artwork."
    );
  }

  // Private files must be inside the owner's folder.
  const normalizedPath = filePath.trim();

  if (
    !normalizedPath.startsWith(`${user.id}/`) ||
    normalizedPath.includes("..") ||
    normalizedPath.includes("\\")
  ) {
    throw new Error(
      "You do not have permission to access this file."
    );
  }

  // Ask Supabase to generate a temporary URL.
  const {
    data: signedData,
    error: signedError,
  } = await supabase.storage
    .from(PRIVATE_BUCKET)
    .createSignedUrl(
      normalizedPath,
      URL_EXPIRATION_SECONDS
    );

  if (signedError) {
    throw signedError;
  }

  if (!signedData?.signedUrl) {
    throw new Error(
      "Unable to retrieve this private artwork."
    );
  }

  return signedData.signedUrl;
}
