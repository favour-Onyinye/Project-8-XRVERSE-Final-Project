import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

// =====================================
// GOOGLE LOGO
// =====================================

function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.24c0-.7-.06-1.37-.18-2.02H12v3.83h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.2Z"
      />
      <path
        fill="#34A853"
        d="M12 21.5c2.62 0 4.82-.87 6.44-2.36l-3.14-2.45c-.87.59-1.98.94-3.3.94-2.54 0-4.69-1.72-5.46-4.03H3.3v2.52A9.75 9.75 0 0 0 12 21.5Z"
      />
      <path
        fill="#FBBC05"
        d="M6.54 13.6a5.84 5.84 0 0 1 0-3.2V7.88H3.3a9.75 9.75 0 0 0 0 8.24l3.24-2.52Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.37c1.43 0 2.72.49 3.73 1.46l2.79-2.79A9.35 9.35 0 0 0 12 2.5a9.75 9.75 0 0 0-8.7 5.38l3.24 2.52C7.31 8.09 9.46 6.37 12 6.37Z"
      />
    </svg>
  );
}

// =====================================
// GOOGLE SIGN-IN BUTTON
// =====================================

function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================
  // START GOOGLE OAUTH
  // =====================================

  async function handleGoogleSignIn() {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const redirectUrl =
        `${window.location.origin}/profile`;

      const {
        data,
        error: oauthError,
      } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (oauthError) throw oauthError;

      if (!data?.url) {
        throw new Error(
          "Google authentication did not return a redirect URL."
        );
      }

      // With skipBrowserRedirect omitted,
      // Supabase handles the browser redirect.
      // The component stays loading until navigation.
    } catch (err) {
      console.error(
        "XRVERSE Google authentication error:",
        err
      );

      setError(
        err.message ||
        "Unable to continue with Google. Please try again."
      );

      setLoading(false);
    }
  }

  // =====================================
  // BUTTON INTERFACE
  // =====================================

  return (
    <div className="google-signin-container">
      <button
        type="button"
        className="google-signin-button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        aria-busy={loading}
      >
        <GoogleIcon />

        <span>
          {loading
            ? "Connecting to Google..."
            : "Continue with Google"}
        </span>
      </button>

      {error && (
        <p
          className="form-error"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default GoogleSignInButton;

