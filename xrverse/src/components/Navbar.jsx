import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Orbit,
  PlusCircle,
  Compass,
  LogIn,
  UserPlus,
  LogOut,
  UserRound,
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";

function Navbar() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // CHECK AUTHENTICATION STATUS
  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const { data, error } =
          await supabase.auth.getUser();

        if (!active) return;

        if (error) {
          setUser(null);
        } else {
          setUser(data.user ?? null);
        }
      } catch (error) {
        console.error("Authentication error:", error);

        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return;

        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    loadUser();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Only permanent accounts are considered creators.
  const isRegistered =
    Boolean(user) && user.is_anonymous !== true;

  // LOG OUT
  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setUser(null);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      window.alert(
        error.message || "Unable to log out."
      );
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="navbar">
      {/* XRVERSE LOGO */}
      <Link to="/" className="logo">
        <Orbit size={28} />
        <span>XRVERSE</span>
      </Link>

      {/* MAIN NAVIGATION */}
      <nav className="nav-links">
        <NavLink to="/" end>
          Community
        </NavLink>

        <NavLink to="/explore">
          <Compass size={17} />
          Explore
        </NavLink>
      </nav>

      {/* ACCOUNT NAVIGATION */}
      <div className="navbar-account">
        {!loading && isRegistered ? (
          <>
            <Link
              to="/create"
              className="create-button"
            >
              <PlusCircle size={18} />
              Create Post
            </Link>

            <span
              className="navbar-user"
              title={user.email || "XRVERSE Creator"}
            >
              <UserRound size={18} />
              <span>
                {user.email || "Creator"}
              </span>
            </span>

            <button
              type="button"
              className="navbar-logout"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut size={17} />
              {loggingOut ? "Logging out..." : "Log Out"}
            </button>
          </>
        ) : (
          <>
            <Link
              to="/"
              className="navbar-guest"
            >
              Continue as Guest
            </Link>

            <Link
              to="/login"
              className="navbar-login"
            >
              <LogIn size={17} />
              Log In
            </Link>

            <Link
              to="/signup"
              className="navbar-signup"
            >
              <UserPlus size={17} />
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;


