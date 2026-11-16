
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function SignUp() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSignUp(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo:
              `${window.location.origin}/login`,
          },
        });

      if (signUpError) throw signUpError;

      if (data.session) {
        navigate("/");
      } else {
        setMessage(
          "Check your email for a confirmation link. " +
          "After confirming your account, return to log in."
        );
      }
    } catch (err) {
      setError(
        err.message || "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-container">
        <h1>Create Your XRVERSE Account</h1>

        <p>
          Join a community of digital creators,
          artists, and immersive developers.
        </p>

        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}

        {message && (
          <p role="status">{message}</p>
        )}

        <form onSubmit={handleSignUp}>
          <div className="form-group">
            <label htmlFor="signup-email">
              Email address
            </label>

            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-password">
              Password
            </label>

            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-confirm">
              Confirm password
            </label>

            <input
              id="signup-confirm"
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>
        </form>

        <p>
          Already have an account?{" "}
          <Link to="/login">Log In</Link>
        </p>

        <p>
          <Link to="/">Continue as Guest</Link>
        </p>
      </div>
    </main>
  );
}

export default SignUp;
