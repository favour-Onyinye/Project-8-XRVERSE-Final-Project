
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) throw loginError;

      navigate("/");
    } catch (err) {
      setError(
        err.message ||
          "Unable to log in. Check your credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-container">
        <h1>Welcome Back to XRVERSE</h1>

        <p>
          Log in to access your creative account.
        </p>

        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="login-email">
              Email address
            </label>

            <input
              id="login-email"
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
            <label htmlFor="login-password">
              Password
            </label>

            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading ? "Logging In..." : "Log In"}
          </button>
        </form>

        <p>
          Don't have an account?{" "}
          <Link to="/signup">Create Account</Link>
        </p>

        <p>
          <Link to="/">Continue as Guest</Link>
        </p>
      </div>
    </main>
  );
}

export default Login;
