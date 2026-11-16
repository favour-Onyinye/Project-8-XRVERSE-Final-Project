import { Routes, Route } from "react-router-dom";

// XRVERSE COMPONENTS
import Navbar from "./components/Navbar";

// EXISTING PAGES
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import CreatePost from "./pages/CreatePost";
import PostDetails from "./pages/PostDetails";
import EditPost from "./pages/EditPost";

// NEW AUTHENTICATION PAGES
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";

// STYLES
import "./App.css";

function App() {
  return (
    <div className="app">
      {/* MAIN NAVIGATION */}
      <Navbar />

      {/* XRVERSE ROUTES */}
      <Routes>
        {/* PUBLIC PAGES */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/explore"
          element={<Explore />}
        />

        <Route
          path="/post/:id"
          element={<PostDetails />}
        />

        {/* POST MANAGEMENT */}

        <Route
          path="/create"
          element={<CreatePost />}
        />

        <Route
          path="/edit/:id"
          element={<EditPost />}
        />

        {/* AUTHENTICATION */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<SignUp />}
        />

        {/* UNKNOWN ROUTES */}

        <Route
          path="*"
          element={
            <main className="post-details-error">
              <h1>Page Not Found</h1>
              <p>
                This XRVERSE page does not exist.
              </p>
              <a href="/">
                Return to Community
              </a>
            </main>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
