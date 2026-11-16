
import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  Compass,
  Home,
  PlusCircle,
  UserRound,
  Images,
  LogIn,
  LogOut,
  UserPlus,
  Menu,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";

function Navbar() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const isRegistered =
    Boolean(user?.id) &&
    user.is_anonymous !== true;

  // =====================================
  // 1. TRACK AUTHENTICATION
  // =====================================

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return;

        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    async function loadUser() {
      try {
        const { data, error } =
          await supabase.auth.getUser();

        if (!active) return;

        if (error) {
          console.error(
            "Navbar authentication error:",
            error
          );
          return;
        }

        setUser(data.user ?? null);
      } catch (error) {
        console.error(
          "Navbar authentication error:",
          error
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUser();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // =====================================
  // 2. LOG OUT
  // =====================================

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setLogoutError("");

    try {
      const { error } =
        await supabase.auth.signOut();

      if (error) throw error;

      setUser(null);
      setMenuOpen(false);

      // Return directly to the updated Login page
      // where Continue with Google is displayed.
      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "XRVERSE logout error:",
        error
      );

      setLogoutError(
        error.message ||
        "Unable to log out. Please try again."
      );
    } finally {
      setLoggingOut(false);
    }
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  function navClass({ isActive }) {
    return isActive
      ? "nav-link active"
      : "nav-link";
  }

  // =====================================
  // 3. NAVBAR INTERFACE
  // =====================================

  return (
    <header className="navbar">
      <div className="navbar-container">

        {/* XRVERSE LOGO */}

        <Link
          to="/"
          className="navbar-logo"
          onClick={closeMenu}
        >
          XR<span>VERSE</span>
        </Link>

        {/* MOBILE MENU */}

        <button
          type="button"
          className="navbar-menu-toggle"
          aria-label={
            menuOpen ? "Close menu" : "Open menu"
          }
          aria-expanded={menuOpen}
          aria-controls="xrverse-navigation"
          onClick={() =>
            setMenuOpen((previous) => !previous)
          }
        >
          {menuOpen ? (
            <X size={24} />
          ) : (
            <Menu size={24} />
          )}
        </button>

        {/* NAVIGATION */}

        <nav
          id="xrverse-navigation"
          className={
            menuOpen
              ? "navbar-links open"
              : "navbar-links"
          }
          aria-label="Main navigation"
        >

          {/* HOME */}

          <NavLink
            to="/"
            end
            className={navClass}
            onClick={closeMenu}
          >
            <Home size={18} />
            Home
          </NavLink>

          {/* EXPLORE */}

          <NavLink
            to="/explore"
            className={navClass}
            onClick={closeMenu}
          >
            <Compass size={18} />
            Explore
          </NavLink>

          {/* REGISTERED CREATOR LINKS */}

          {!loading && isRegistered && (
            <>

              {/* CREATE POST */}

              <NavLink
                to="/create"
                className={navClass}
                onClick={closeMenu}
              >
                <PlusCircle size={18} />
                Create Post
              </NavLink>

              {/* MY ARTWORK */}

              <NavLink
                to="/my-artwork"
                className={navClass}
                onClick={closeMenu}
              >
                <Images size={18} />
                My Artwork
              </NavLink>

              {/* PROMINENT MY PROFILE BUTTON */}

              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  isActive
                    ? "nav-link navbar-profile-button active"
                    : "nav-link navbar-profile-button"
                }
                onClick={closeMenu}
              >
                <UserRound size={18} />
                My Profile
              </NavLink>

              {/* LOG OUT */}

              <button
                type="button"
                className="nav-link navbar-logout"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                <LogOut size={18} />

                {loggingOut
                  ? "Logging Out..."
                  : "Log Out"}
              </button>

            </>
          )}

          {/* GUEST NAVIGATION */}

          {!loading && !isRegistered && (
            <>

              <NavLink
                to="/login"
                className={navClass}
                onClick={closeMenu}
              >
                <LogIn size={18} />
                Log In
              </NavLink>

              <NavLink
                to="/signup"
                className={navClass}
                onClick={closeMenu}
              >
                <UserPlus size={18} />
                Sign Up
              </NavLink>

            </>
          )}

        </nav>
      </div>

      {/* LOGOUT ERROR */}

      {logoutError && (
        <p
          className="navbar-error"
          role="alert"
        >
          {logoutError}
        </p>
      )}
    </header>
  );
}

export default Navbar;


