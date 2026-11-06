
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function SupabaseCheck() {
  const [status, setStatus] = useState(
    "Connecting to Supabase..."
  );

  useEffect(() => {
    let cancelled = false;

    async function checkConnection() {
      try {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!sessionData.session) {
          const { error: signInError } =
            await supabase.auth.signInAnonymously();

          if (signInError) throw signInError;
        }

        const { count, error } = await supabase
          .from("posts")
          .select("*", {
            count: "exact",
            head: true,
          });

        if (error) throw error;

        if (!cancelled) {
          setStatus(
            `Connected to Supabase! ${count ?? 0} posts found.`
          );
        }
        }  catch (error) {
            console.error("XRVERSE Supabase Error:", error);

            if (!cancelled) {
                setStatus(
                `Connection failed: ${
                    error?.message || JSON.stringify(error) || "Unknown error"
                }`
                );
            }
            }
                }

    checkConnection();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      role="status"
      style={{
        padding: "18px",
        margin: "20px 7%",
        borderRadius: "12px",
        background: "rgba(124,58,237,0.15)",
        color: "#c4b5fd",
      }}
    >
      {status}
    </div>
  );
}

export default SupabaseCheck;
