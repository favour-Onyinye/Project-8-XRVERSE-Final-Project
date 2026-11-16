
import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  Plus,
  Images,
  Globe,
  Lock,
  Box,
  Pencil,
  Eye,
  CalendarDays,
  Search,
  RefreshCw,
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";

const FILTERS = [
  { value: "all", label: "All Creations" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
];

function MyArtwork() {
  const navigate = useNavigate();

  // =====================================
  // AUTHENTICATION AND DATA
  // =====================================

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // =====================================
  // GALLERY CONTROLS
  // =====================================

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  // =====================================
  // 1. LOAD THE CREATOR'S ARTWORK
  // =====================================

  useEffect(() => {
    let active = true;

    async function loadArtwork() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (!active) return;

        if (
          authError ||
          !currentUser ||
          currentUser.is_anonymous === true
        ) {
          navigate("/login", { replace: true });
          return;
        }

        const {
          data: artwork,
          error: postsError,
        } = await supabase
          .from("posts")
          .select(
            "id, user_id, title, content, " +
            "category, visibility, image_url, " +
            "model_url, created_at"
          )
          .eq("user_id", currentUser.id)
          .order("created_at", {
            ascending: false,
          });

        if (postsError) throw postsError;

        if (!active) return;

        setUser(currentUser);
        setPosts(artwork || []);
      } catch (err) {
        console.error("My Artwork load error:", err);

        if (active) {
          setError(
            err.message ||
            "Unable to load your artwork."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadArtwork();

    return () => {
      active = false;
    };
  }, [navigate]);

  // =====================================
  // 2. REFRESH THE GALLERY
  // =====================================

  async function handleRefresh() {
    if (!user || refreshing) return;

    setRefreshing(true);
    setError("");

    try {
      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (
        authError ||
        !currentUser ||
        currentUser.is_anonymous === true ||
        currentUser.id !== user.id
      ) {
        setUser(null);
        setPosts([]);
        navigate("/login", { replace: true });
        return;
      }

      const { data, error: postsError } =
        await supabase
          .from("posts")
          .select(
            "id, user_id, title, content, " +
            "category, visibility, image_url, " +
            "model_url, created_at"
          )
          .eq("user_id", currentUser.id)
          .order("created_at", {
            ascending: false,
          });

      if (postsError) throw postsError;

      setPosts(data || []);
    } catch (err) {
      console.error("Gallery refresh error:", err);

      setError(
        err.message || "Unable to refresh the gallery."
      );
    } finally {
      setRefreshing(false);
    }
  }

  // =====================================
  // 3. COUNTS
  // =====================================

  const publicPosts = posts.filter(
    (post) => post.visibility === "public"
  );

  const privatePosts = posts.filter(
    (post) => post.visibility === "private"
  );

  // =====================================
  // 4. FILTER AND SEARCH
  // =====================================

  const filteredPosts = posts.filter((post) => {
    const matchesVisibility =
      activeFilter === "all" ||
      post.visibility === activeFilter;

    const query = searchText.trim().toLowerCase();

    const searchableText = [
      post.title,
      post.content,
      post.category,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      matchesVisibility &&
      searchableText.includes(query)
    );
  });

  // =====================================
  // 5. AUTHENTICATION LOADING
  // =====================================

  if (loading) {
    return (
      <main className="my-artwork-page">
        <p role="status">
          Loading your XRVERSE artwork...
        </p>
      </main>
    );
  }

  if (!user && !error) return null;

  if (error && !user) {
    return (
      <main className="my-artwork-page">
        <h1>Unable to load artwork</h1>
        <p role="alert">{error}</p>
        <Link to="/">Return to Community</Link>
      </main>
    );
  }

  // =====================================
  // 6. MY ARTWORK PAGE
  // =====================================

  return (
    <main className="my-artwork-page">

      {/* BACK NAVIGATION */}

      <Link
        to="/profile"
        className="details-back-link"
      >
        <ArrowLeft size={18} />
        Back to My Profile
      </Link>

      {/* PAGE HEADER */}

      <header className="my-artwork-header">
        <div>
          <div className="create-eyebrow">
            <Images size={18} />
            XRVERSE CREATOR STUDIO
          </div>

          <h1>My Artwork</h1>

          <p>
            Manage your public creations and
            private digital artwork in one place.
          </p>
        </div>

        <Link
          to="/create"
          className="primary-button"
        >
          <Plus size={18} />
          Create New Post
        </Link>
      </header>

      {/* GALLERY COUNTS */}

      <section
        className="my-artwork-stats"
        aria-label="Artwork statistics"
      >
        <div className="my-artwork-stat">
          <Images size={22} />
          <strong>{posts.length}</strong>
          <span>Total Creations</span>
        </div>

        <div className="my-artwork-stat">
          <Globe size={22} />
          <strong>{publicPosts.length}</strong>
          <span>Public Posts</span>
        </div>

        <div className="my-artwork-stat">
          <Lock size={22} />
          <strong>{privatePosts.length}</strong>
          <span>Private Posts</span>
        </div>
      </section>

      {/* SEARCH AND REFRESH */}

      <div className="my-artwork-toolbar">
        <div className="my-artwork-search">
          <Search size={19} />

          <input
            type="search"
            value={searchText}
            onChange={(event) =>
              setSearchText(event.target.value)
            }
            placeholder="Search your creations..."
            aria-label="Search my artwork"
          />
        </div>

        <button
          type="button"
          className="my-artwork-refresh"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={18} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* FILTER TABS */}

      <div
        className="my-artwork-tabs"
        role="group"
        aria-label="Filter artwork by visibility"
      >
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={
              activeFilter === filter.value
                ? "my-artwork-tab active"
                : "my-artwork-tab"
            }
            aria-pressed={
              activeFilter === filter.value
            }
            onClick={() =>
              setActiveFilter(filter.value)
            }
          >
            {filter.label}

            <span>
              {filter.value === "public"
                ? publicPosts.length
                : filter.value === "private"
                ? privatePosts.length
                : posts.length}
            </span>
          </button>
        ))}
      </div>

      {/* ERROR MESSAGE */}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {/* ARTWORK GRID */}

      {filteredPosts.length === 0 ? (
        <div className="my-artwork-empty">
          <Images size={44} />

          <h2>No artwork found</h2>

          <p>
            {posts.length === 0
              ? "You haven't created any artwork yet."
              : "No creations match your current filter or search."}
          </p>

          {posts.length === 0 && (
            <Link
              to="/create"
              className="primary-button"
            >
              <Plus size={18} />
              Create Your First Post
            </Link>
          )}
        </div>
      ) : (
        <div className="my-artwork-grid">
          {filteredPosts.map((post) => {
            const privatePost =
              post.visibility === "private";

            return (
              <article
                key={post.id}
                className="my-artwork-card"
              >
                {/* ARTWORK PREVIEW */}

                <Link
                  to={`/post/${post.id}`}
                  className="my-artwork-preview"
                  aria-label={`View ${post.title}`}
                >
                  {privatePost ? (
                    <div className="my-artwork-private-preview">
                      <Lock size={36} />

                      <span>
                        Private Artwork
                      </span>
                    </div>
                  ) : post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className="my-artwork-placeholder">
                      {post.model_url ? (
                        <Box size={40} />
                      ) : (
                        <Images size={40} />
                      )}

                      <span>
                        {post.model_url
                          ? "3D Creation"
                          : "Creative Post"}
                      </span>
                    </div>
                  )}
                </Link>

                {/* CARD CONTENT */}

                <div className="my-artwork-card-body">

                  <div className="my-artwork-card-top">
                    <span className="my-artwork-category">
                      {post.category || "General"}
                    </span>

                    <span
                      className={
                        privatePost
                          ? "my-artwork-visibility private"
                          : "my-artwork-visibility public"
                      }
                    >
                      {privatePost ? (
                        <Lock size={14} />
                      ) : (
                        <Globe size={14} />
                      )}

                      {privatePost ? "Private" : "Public"}
                    </span>
                  </div>

                  <h2>{post.title}</h2>

                  {post.content && (
                    <p className="my-artwork-description">
                      {post.content}
                    </p>
                  )}

                  <p className="my-artwork-date">
                    <CalendarDays size={15} />

                    {new Date(
                      post.created_at
                    ).toLocaleDateString()}
                  </p>

                  {/* OWNER ACTIONS */}

                  <div className="my-artwork-actions">
                    <Link
                      to={`/post/${post.id}`}
                      className="my-artwork-action"
                    >
                      <Eye size={17} />
                      View
                    </Link>

                    <Link
                      to={`/edit/${post.id}`}
                      className="my-artwork-action"
                    >
                      <Pencil size={17} />
                      Edit
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default MyArtwork;
