
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  UserPlus,
  Compass,
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";
import GoogleSignInButton from "../components/GoogleSignInButton";

function Login() {
  const navigate = useNavigate();

  // =====================================
  // FORM STATE
  // =====================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================
  // 1. EMAIL/PASSWORD LOGIN
  // =====================================

  async function handleLogin(event) {
    event.preventDefault();

    if (loading) return;

    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    setLoading(true);

    try {
      const {
        data,
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (loginError) throw loginError;

      const user = data?.user;

      if (
        !user ||
        user.is_anonymous === true
      ) {
        throw new Error(
          "Please sign in with a registered account."
        );
      }

      // Remove password from component state.
      setPassword("");

      // Go to the creator profile.
      navigate("/profile", {
        replace: true,
      });
    } catch (err) {
      console.error("XRVERSE login error:", err);

      setError(
        err.message ||
        "Unable to log in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================
  // 2. GUEST BROWSING
  // =====================================

  function handleGuest() {
    // Navigate without creating an anonymous
    // Supabase account.
    navigate("/");
  }

  // =====================================
  // 3. LOGIN PAGE
  // =====================================

  return (
    <main className="auth-page">
      <div className="auth-container">

        {/* BACK TO COMMUNITY */}

        <Link
          to="/"
          className="details-back-link"
        >
          <ArrowLeft size={18} />
          Back to Community
        </Link>

        {/* LOGIN HEADER */}

        <div className="auth-header">
          <LogIn size={38} />

          <h1>Welcome Back to XRVERSE</h1>

          <p>
            Log in to manage your creations,
            explore digital artwork,
            and connect with other creators.
          </p>
        </div>

        {/* ERROR MESSAGE */}

        {error && (
          <div
            className="form-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* EMAIL/PASSWORD LOGIN */}

        <form
          className="auth-form"
          onSubmit={handleLogin}
        >

          {/* EMAIL */}

          <div className="form-group">
            <label htmlFor="login-email">
              <Mail size={17} />
              Email Address
            </label>

            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              disabled={loading}
              required
            />
          </div>

          {/* PASSWORD */}

          <div className="form-group">
            <label htmlFor="login-password">
              <Lock size={17} />
              Password
            </label>

            <div className="password-input-wrap">

              <input
                id="login-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                disabled={loading}
                required
              />

              <button
                type="button"
                className="password-visibility-button"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>

            </div>
          </div>

          {/* FORGOT PASSWORD */}

          <div className="forgot-password-link">
            <Link to="/forgot-password">
              Forgot your password?
            </Link>
          </div>

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            <LogIn size={18} />

            {loading
              ? "Logging In..."
              : "Log In to XRVERSE"}
          </button>
        </form>

        {/* =====================================
            GOOGLE SIGN-IN
            ===================================== */}

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <GoogleSignInButton />

        {/* CREATE ACCOUNT */}

        <div className="auth-footer">
          <p>
            Don't have an account?{" "}
            <Link to="/signup">
              <UserPlus size={16} />
              Create an Account
            </Link>
          </p>
        </div>

        {/* =====================================
            CONTINUE AS GUEST
            ===================================== */}

        <div className="auth-guest-section">

          <div className="auth-divider">
            <span>OR CONTINUE WITHOUT AN ACCOUNT</span>
          </div>

          <button
            type="button"
            className="auth-guest-button"
            onClick={handleGuest}
          >
            <Compass size={19} />
            Continue as Guest
          </button>

          <p className="media-description">
            Guests can explore public XRVERSE
            creations without registering.
          </p>

        </div>

        {/* SECURITY MESSAGE */}

        <p className="auth-security-note">
          <ShieldCheck size={16} />
          Your private artwork remains protected
          by your account permissions.
        </p>

      </div>
    </main>
  );
}

export default Login;

