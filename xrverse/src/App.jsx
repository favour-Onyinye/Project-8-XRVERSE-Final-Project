
import {
  Routes,
  Route,
  Link,
} from "react-router-dom";

// =====================================
// XRVERSE GLOBAL NAVIGATION
// =====================================

import Navbar from "./components/Navbar";

// =====================================
// PUBLIC PAGES
// =====================================

import Home from "./pages/Home";
import Explore from "./pages/Explore";

// =====================================
// POST MANAGEMENT
// =====================================

import CreatePost from "./pages/CreatePost";
import PostDetails from "./pages/PostDetails";
import EditPost from "./pages/EditPost";

// =====================================
// AUTHENTICATION PAGES
// =====================================

import Login from "./pages/Login";
import SignUp from "./pages/SignUp";

// Password recovery
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Google login is rendered inside
// Login.jsx and SignUp.jsx using
// GoogleSignInButton.jsx.
// It does not require a separate route.

// =====================================
// CREATOR ACCOUNT PAGES
// =====================================

import MyProfile from "./pages/MyProfile";
import EditProfile from "./pages/EditProfile";
import MyArtwork from "./pages/MyArtwork";

// =====================================
// GLOBAL STYLES
// =====================================

import "./App.css";

// =====================================
// 404 PAGE
// =====================================

function NotFound() {
  return (
    <main className="not-found-page">
      <h1>404 — Page Not Found</h1>

      <p>
        The page you're looking for
        doesn't exist in XRVERSE.
      </p>

      <Link
        to="/"
        className="primary-button"
      >
        Return to Community
      </Link>
    </main>
  );
}

// =====================================
// MAIN APPLICATION
// =====================================

function App() {
  return (
    <div className="app">

      {/* =====================================
          GLOBAL NAVBAR
          ===================================== */}

      <Navbar />

      {/* =====================================
          APPLICATION ROUTES
          ===================================== */}

      <Routes>

        {/* =====================================
            1. PUBLIC COMMUNITY PAGES
            ===================================== */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/explore"
          element={<Explore />}
        />

        {/* =====================================
            2. POST DETAILS
            ===================================== */}

        <Route
          path="/post/:id"
          element={<PostDetails />}
        />

        {/* =====================================
            3. CREATE POST
            ===================================== */}

        <Route
          path="/create"
          element={<CreatePost />}
        />

        {/* =====================================
            4. EDIT POST
            ===================================== */}

        <Route
          path="/edit/:id"
          element={<EditPost />}
        />

        {/* =====================================
            5. LOGIN
            ===================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        {/* =====================================
            6. SIGN UP
            ===================================== */}

        <Route
          path="/signup"
          element={<SignUp />}
        />

        {/* =====================================
            7. FORGOT PASSWORD
            ===================================== */}

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        {/* =====================================
            8. RESET PASSWORD
            ===================================== */}

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        {/* =====================================
            9. MY PROFILE
            ===================================== */}

        <Route
          path="/profile"
          element={<MyProfile />}
        />

        {/* =====================================
            10. EDIT MY PROFILE
            ===================================== */}

        <Route
          path="/profile/edit"
          element={<EditProfile />}
        />

        {/* =====================================
            11. MY ARTWORK GALLERY
            ===================================== */}

        <Route
          path="/my-artwork"
          element={<MyArtwork />}
        />

        {/* =====================================
            12. PAGE NOT FOUND
            ===================================== */}

        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>

    </div>
  );
}

export default App;

