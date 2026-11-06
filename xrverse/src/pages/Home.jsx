
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Sparkles,
  AlertCircle,
} from "lucide-react";

import Hero from "../components/Hero";
import PostCard from "../components/PostCard";
import { supabase } from "../lib/supabaseClient";

const categories = [
  "All",
  "3D Art",
  "Virtual Reality",
  "Augmented Reality",
  "Animation",
  "Game Design",
  "Digital Sculpture",
  "General",
];

function Home() {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderBy, setOrderBy] = useState("created_at");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch posts from Supabase whenever sorting changes.
  useEffect(() => {
    let cancelled = false;

    async function fetchPosts() {
      setLoading(true);
      setError("");

      try {
        const { data, error: fetchError } = await supabase
          .from("posts")
          .select("id, title, created_at, upvotes, category")
          .order(orderBy, { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        if (!cancelled) {
          setPosts(data || []);
        }
      } catch (err) {
        console.error("Error fetching posts:", err);

        if (!cancelled) {
          setError(
            err.message || "Unable to load community posts."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPosts();

    return () => {
      cancelled = true;
    };
  }, [orderBy]);

  // Search and category filtering.
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch = post.title
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase());

      const matchesCategory =
        selectedCategory === "All" ||
        post.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [posts, searchQuery, selectedCategory]);

  return (
    <>
      <Hero />

      <main className="community-section">
        {/* COMMUNITY HEADING */}

        <motion.div
          className="section-heading"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <span className="eyebrow">
              <Sparkles size={15} />
              THE XRVERSE COMMUNITY
            </span>

            <h2>Explore Creative Discussions</h2>

            <p>
              Discover ideas, share inspiration, and connect
              with creators exploring digital worlds.
            </p>
          </div>

          <Link to="/create" className="feed-create-button">
            <Plus size={18} />
            New Post
          </Link>
        </motion.div>

        {/* SEARCH AND SORT */}

        <div className="feed-toolbar">
          <div className="feed-search">
            <Search size={20} />

            <input
              type="search"
              placeholder="Search creative discussions..."
              aria-label="Search posts by title"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
            />
          </div>

          <div className="feed-sort">
            <SlidersHorizontal size={19} />

            <label htmlFor="sort-posts">
              Sort by
            </label>

            <select
              id="sort-posts"
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value)}
            >
              <option value="created_at">
                Newest
              </option>

              <option value="upvotes">
                Most Upvoted
              </option>
            </select>
          </div>
        </div>

        {/* CATEGORY FILTERS */}

        <div className="category-filters">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={
                selectedCategory === category
                  ? "category-button active"
                  : "category-button"
              }
              aria-pressed={selectedCategory === category}
            >
              {category}
            </button>
          ))}
        </div>

        {/* POST COUNT */}

        <div className="feed-results">
          <span>
            {loading
              ? "Loading discussions..."
              : `${filteredPosts.length} discussions found`}
          </span>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="feed-loading" role="status">
            <div className="xr-loader" />

            <p>Exploring the XRVERSE...</p>
          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="feed-error" role="alert">
            <AlertCircle size={22} />
            <p>{error}</p>
          </div>
        )}

        {/* EMPTY STATE */}

        {!loading &&
          !error &&
          filteredPosts.length === 0 && (
            <div className="feed-empty">
              <Sparkles size={40} />

              <h3>No discussions found</h3>

              <p>
                Be the first to share something creative,
                or try a different search or category.
              </p>

              <Link to="/create" className="primary-button">
                Create a Post
              </Link>
            </div>
          )}

        {/* COMMUNITY POSTS */}

        {!loading &&
          !error &&
          filteredPosts.length > 0 && (
            <div className="post-grid">
              {filteredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: Math.min(index, 10) * 0.06,
                  }}
                >
                  <PostCard post={post} />
                </motion.div>
              ))}
            </div>
          )}
      </main>
    </>
  );
}

export default Home;

