
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowLeft,
  KeyRound,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [checkingSession, setCheckingSession] =
    useState(true);

  const [canReset, setCanReset] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // =====================================
  // 1. CHECK AUTHENTICATED SESSION
  // =====================================

  useEffect(() => {
    let active = true;

    // Recovery links establish a session through
    // the Supabase client after their verification.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!active) return;

        if (
          event === "PASSWORD_RECOVERY" ||
          event === "SIGNED_IN" ||
          event === "INITIAL_SESSION"
        ) {
          setCanReset(Boolean(session?.user));
          setCheckingSession(false);
        }

        if (event === "SIGNED_OUT") {
          setCanReset(false);
          setCheckingSession(false);
        }
      }
    );

    async function checkSession() {
      try {
        const { data, error: sessionError } =
          await supabase.auth.getSession();

        if (!active) return;

        if (sessionError) throw sessionError;

        setCanReset(Boolean(data.session?.user));
      } catch (err) {
        console.error(
          "Password recovery session error:",
          err
        );

        if (active) {
          setCanReset(false);
          setError(
            "This recovery session could not be verified."
          );
        }
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    }

    checkSession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // =====================================
  // 2. UPDATE PASSWORD
  // =====================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading || !canReset) return;

    setError("");
    setSuccess(false);

    if (password.length < 12) {
      setError(
        "Please use a password with at least 12 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Your recovery session has expired. " +
          "Please request another reset link."
        );
      }

      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) throw updateError;

      setPassword("");
      setConfirmPassword("");
      setSuccess(true);
      setCanReset(false);

      // End the recovery session so the creator
      // signs in again with the new password.
      const { error: signOutError } =
        await supabase.auth.signOut();

      if (signOutError) {
        console.error(
          "Post-reset sign-out error:",
          signOutError
        );
      }
    } catch (err) {
      console.error("Password update error:", err);

      setError(
        err.message ||
        "Unable to reset your password."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================
  // 3. LOADING
  // =====================================

  if (checkingSession) {
    return (
      <main className="auth-page">
        <p role="status">
          Verifying your password recovery link...
        </p>
      </main>
    );
  }

  // =====================================
  // 4. SUCCESS
  // =====================================

  if (success) {
    return (
      <main className="auth-page">
        <div className="auth-container">
          <ShieldCheck size={42} />

          <h1>Password Updated</h1>

          <p>
            Your XRVERSE password has been
            updated successfully.
          </p>

          <p>
            Sign in using your new password.
          </p>

          <Link
            to="/login"
            className="primary-button"
          >
            Go to Log In
          </Link>
        </div>
      </main>
    );
  }

  // =====================================
  // 5. INVALID OR EXPIRED SESSION
  // =====================================

  if (!canReset) {
    return (
      <main className="auth-page">
        <div className="auth-container">
          <Lock size={38} />

          <h1>Recovery Link Required</h1>

          <p>
            Your recovery link may be expired,
            invalid, or already used.
          </p>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <Link
            to="/forgot-password"
            className="primary-button"
          >
            Request a New Link
          </Link>

          <p>
            <Link to="/login">
              Return to Log In
            </Link>
          </p>
        </div>
      </main>
    );
  }

  // =====================================
  // 6. NEW PASSWORD FORM
  // =====================================

  return (
    <main className="auth-page">
      <div className="auth-container">

        <Link
          to="/login"
          className="details-back-link"
        >
          <ArrowLeft size={18} />
          Back to Log In
        </Link>

        <div className="auth-header">
          <KeyRound size={38} />

          <h1>Create a New Password</h1>

          <p>
            Enter a strong new password
            for your XRVERSE account.
          </p>
        </div>

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >
          {/* NEW PASSWORD */}

          <div className="form-group">
            <label htmlFor="new-password">
              New Password
            </label>

            <div className="password-input-wrap">
              <input
                id="new-password"
                type={
                  showPassword ? "text" : "password"
                }
                autoComplete="new-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="At least 12 characters"
                minLength={12}
                required
              />

              <button
                type="button"
                className="password-visibility-button"
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* CONFIRM PASSWORD */}

          <div className="form-group">
            <label htmlFor="confirm-password">
              Confirm New Password
            </label>

            <input
              id="confirm-password"
              type={
                showPassword ? "text" : "password"
              }
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              minLength={12}
              required
            />
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            <KeyRound size={18} />

            {loading
              ? "Updating Password..."
              : "Reset Password"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default ResetPassword;
