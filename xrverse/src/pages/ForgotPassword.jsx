
import { useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowLeft,
  Mail,
  Send,
  ShieldCheck,
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // =====================================
  // REQUEST PASSWORD RECOVERY
  // =====================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setSuccess(false);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      // Redirect to the same XRVERSE environment
      // where the recovery was requested.
      const redirectUrl =
        `${window.location.origin}/reset-password`;

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo: redirectUrl,
          }
        );

      if (resetError) throw resetError;

      // Avoid exposing whether an email
      // exists in the account database.
      setSuccess(true);
    } catch (err) {
      console.error(
        "XRVERSE password recovery error:",
        err
      );

      setError(
        err.message ||
        "Unable to request password recovery."
      );
    } finally {
      setLoading(false);
    }
  }

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
          <Mail size={38} />

          <h1>Forgot Your Password?</h1>

          <p>
            Enter your registered XRVERSE email
            address to request a password reset.
          </p>
        </div>

        {error && (
          <div
            className="form-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {success ? (
          <div
            className="auth-success"
            role="status"
          >
            <ShieldCheck size={34} />

            <h2>Check Your Email</h2>

            <p>
              If an account exists for that email,
              you will receive password reset
              instructions.
            </p>

            <p>
              Check your inbox and spam folder.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={() => setSuccess(false)}
            >
              Request Another Link
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >
            <div className="form-group">
              <label htmlFor="recovery-email">
                Email Address
              </label>

              <input
                id="recovery-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
              />
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              <Send size={18} />

              {loading
                ? "Sending Recovery Link..."
                : "Send Password Reset Link"}
            </button>
          </form>
        )}

        <p className="auth-footer">
          Remember your password?{" "}
          <Link to="/login">Log In</Link>
        </p>
      </div>
    </main>
  );
}

export default ForgotPassword;
