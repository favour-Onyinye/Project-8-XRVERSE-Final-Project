
import { Turnstile } from "@marsidev/react-turnstile";

const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

function TurnstileCheck({ onTokenChange }) {
  if (!siteKey) {
    return (
      <p className="form-error" role="alert">
        Cloudflare Turnstile Site Key is missing.
        Check your environment variables.
      </p>
    );
  }

  return (
    <div className="turnstile-check">
      <p>
        Please complete human verification to
        participate in the XRVERSE community.
      </p>

      <Turnstile
        siteKey={siteKey}
        options={{
          theme: "auto",
          refreshExpired: "auto",
        }}
        onSuccess={(token) => onTokenChange(token)}
        onExpire={() => onTokenChange(null)}
        onError={() => onTokenChange(null)}
      />
    </div>
  );
}

export default TurnstileCheck;

