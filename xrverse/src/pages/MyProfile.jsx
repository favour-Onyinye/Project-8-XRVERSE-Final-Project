import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  UserRound,
  Mail,
  CalendarDays,
  Images,
  Globe,
  Lock,
  Plus,
  ArrowLeft,
  ShieldCheck,
  Pencil,
  Sparkles,
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";

function MyProfile() {
  const navigate = useNavigate();

  // =====================================
  // 1. AUTHENTICATION AND POSTS
  // =====================================

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================
  // 2. LOAD CREATOR PROFILE
  // =====================================

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        // Get the signed-in user.
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (!active) return;

        // Require a permanent registered account.
        if (
          authError ||
          !currentUser ||
          currentUser.is_anonymous === true
        ) {
          setUser(null);
          setPosts([]);
          navigate("/login", { replace: true });
          return;
        }

        // Load posts owned by this creator only.
        const {
          data: creatorPosts,
          error: postsError,
        } = await supabase
          .from("posts")
          .select(
            "id, title, category, visibility, created_at"
          )
          .eq("user_id", currentUser.id)
          .order("created_at", {
            ascending: false,
          });

        if (postsError) {
          throw postsError;
        }

        if (!active) return;

        setUser(currentUser);
        setPosts(creatorPosts || []);
      } catch (err) {
        console.error(
          "XRVERSE profile loading error:",
          err
        );

        if (active) {
          setError(
            err.message ||
            "Unable to load your creator profile."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [navigate]);

  // =====================================
  // 3. PROFILE INFORMATION
  // =====================================

  const metadata = user?.user_metadata || {};

  const displayName =
    metadata.display_name ||
    user?.email?.split("@")[0] ||
    "XRVERSE Creator";

  const biography = metadata.bio || "";
  const specialty = metadata.specialty || "";

  // =====================================
  // 4. ARTWORK STATISTICS
  // =====================================

  const publicPosts = posts.filter(
    (post) => post.visibility === "public"
  );

  const privatePosts = posts.filter(
    (post) => post.visibility === "private"
  );

  const recentPosts = posts.slice(0, 5);

  // =====================================
  // 5. LOADING STATE
  // =====================================

  if (loading) {
    return (
      <main className="profile-page">
        <p role="status">
          Loading your XRVERSE creator profile...
        </p>
      </main>
    );
  }

  // =====================================
  // 6. ERROR STATE
  // =====================================

  if (error) {
    return (
      <main className="profile-page">
        <h1>Unable to load profile</h1>

        <p role="alert">{error}</p>

        <Link
          to="/"
          className="primary-button"
        >
          Return to Community
        </Link>
      </main>
    );
  }

  if (!user) return null;

  // =====================================
  // 7. CREATOR PROFILE PAGE
  // =====================================

  return (
    <main className="profile-page">

      {/* BACK NAVIGATION */}

      <Link
        to="/"
        className="details-back-link"
      >
        <ArrowLeft size={18} />
        Back to Community
      </Link>

      {/* =====================================
          PROFILE HEADER
          ===================================== */}

      <section className="profile-header">

        <div className="profile-avatar">
          <UserRound size={42} />
        </div>

        <div className="profile-info">

          {/* DISPLAY NAME */}

          <h1>{displayName}</h1>

          {/* ACCOUNT EMAIL */}

          <p>
            <Mail size={17} />
            {user.email}
          </p>

          {/* JOIN DATE */}

          <p>
            <CalendarDays size={17} />
            Joined{" "}
            {new Date(
              user.created_at
            ).toLocaleDateString()}
          </p>

          {/* REGISTERED CREATOR STATUS */}

          <p>
            <ShieldCheck size={17} />
            Registered XRVERSE Creator
          </p>

          {/* CREATIVE SPECIALTY */}

          {specialty && (
            <p>
              <Sparkles size={17} />
              {specialty}
            </p>
          )}

          {/* CREATOR BIOGRAPHY */}

          {biography && (
            <p className="profile-bio">
              {biography}
            </p>
          )}

          {/* EDIT PROFILE BUTTON */}

          <Link
            to="/profile/edit"
            className="primary-button"
          >
            <Pencil size={18} />
            Edit Profile
          </Link>

        </div>
      </section>

      {/* =====================================
          CREATOR STATISTICS
          ===================================== */}

      <section className="profile-stats">

        {/* TOTAL CREATIONS */}

        <div className="profile-stat-card">
          <Images size={24} />
          <h2>{posts.length}</h2>
          <p>Total Creations</p>
        </div>

        {/* PUBLIC POSTS */}

        <div className="profile-stat-card">
          <Globe size={24} />
          <h2>{publicPosts.length}</h2>
          <p>Public Posts</p>
        </div>

        {/* PRIVATE POSTS */}

        <div className="profile-stat-card">
          <Lock size={24} />
          <h2>{privatePosts.length}</h2>
          <p>Private Posts</p>
        </div>

      </section>

      {/* =====================================
          CREATOR ACTIONS
          ===================================== */}

      <section className="profile-actions">

        <h2>Creator Studio</h2>

        <div className="profile-action-links">

          {/* CREATE POST */}

          <Link
            to="/create"
            className="primary-button"
          >
            <Plus size={18} />
            Create New Post
          </Link>

          {/* MY ARTWORK */}

          <Link
            to="/my-artwork"
            className="primary-button"
          >
            <Images size={18} />
            My Artwork
          </Link>

          {/* EDIT PROFILE */}

          <Link
            to="/profile/edit"
            className="primary-button"
          >
            <Pencil size={18} />
            Edit Profile
          </Link>

        </div>
      </section>

      {/* =====================================
          RECENT CREATIONS
          ===================================== */}

      <section className="profile-recent">

        <h2>Recent Creations</h2>

        {posts.length === 0 ? (

          <div className="profile-empty">
            <p>
              You haven't created any posts yet.
              Start sharing your imagination!
            </p>

            <Link
              to="/create"
              className="primary-button"
            >
              <Plus size={18} />
              Create Your First Post
            </Link>
          </div>

        ) : (

          <div className="profile-post-list">

            {recentPosts.map((post) => (

              <Link
                key={post.id}
                to={`/post/${post.id}`}
                className="profile-post-item"
              >

                <div>
                  <h3>{post.title}</h3>

                  <p>
                    {post.category || "General"}
                  </p>
                </div>

                <span>
                  {post.visibility === "private" ? (
                    <>
                      <Lock size={15} />
                      Private
                    </>
                  ) : (
                    <>
                      <Globe size={15} />
                      Public
                    </>
                  )}
                </span>

              </Link>

            ))}

          </div>

        )}

      </section>

    </main>
  );
}

export default MyProfile;

