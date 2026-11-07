
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Sparkles,
  Search,
  Box,
  Image as ImageIcon,
  Video,
  ArrowUpRight,
  Plus,
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";

const filters = [
  "All Artworks",
  "3D Models",
  "Images",
  "Videos",
];

function validMediaUrl(value) {
  if (!value) return null;

  try {
    const url = new URL(value, window.location.origin);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

function Explore() {
  const [artworks, setArtworks] = useState([]);
  const [selectedFilter, setSelectedFilter] =
    useState("All Artworks");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchArtworks() {
      try {
        setLoading(true);

        const { data, error: fetchError } =
          await supabase
            .from("posts")
            .select(
              "id, title, category, image_url, model_url, video_url"
            )
            .order("created_at", { ascending: false })
            .limit(100);

        if (fetchError) throw fetchError;

        if (active) {
          // Only include posts containing visual media.
          setArtworks(
            (data || []).filter(
              (post) =>
                validMediaUrl(post.image_url) ||
                validMediaUrl(post.model_url) ||
                validMediaUrl(post.video_url)
            )
          );
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load gallery.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchArtworks();

    return () => {
      active = false;
    };
  }, []);

  const filteredArtworks = useMemo(() => {
    return artworks.filter((post) => {
      const matchesSearch = post.title
        .toLowerCase()
        .includes(search.toLowerCase());

      let matchesType = true;

      if (selectedFilter === "3D Models") {
        matchesType = Boolean(validMediaUrl(post.model_url));
      }

      if (selectedFilter === "Images") {
        matchesType = Boolean(validMediaUrl(post.image_url));
      }

      if (selectedFilter === "Videos") {
        matchesType = Boolean(validMediaUrl(post.video_url));
      }

      return matchesSearch && matchesType;
    });
  }, [artworks, search, selectedFilter]);

  return (
    <motion.main
      className="explore-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <section className="explore-hero">
        <div className="explore-eyebrow">
          <Sparkles size={17} />
          XRVERSE DIGITAL GALLERY
        </div>

        <h1>
          Art Beyond
          <span> Dimensions.</span>
        </h1>

        <p>
          Discover immersive 3D creations, futuristic
          artworks, virtual worlds, and motion design
          from the XRVERSE community.
        </p>

        <Link to="/create" className="primary-button">
          <Plus size={18} />
          Share Your Artwork
        </Link>
      </section>

      <section className="explore-content">
        <div className="explore-heading">
          <div>
            <span className="eyebrow">
              THE CREATIVE COLLECTION
            </span>

            <h2>Explore the Gallery</h2>
            <p>
              A universe of imagination and innovation.
            </p>
          </div>
        </div>

        <div className="explore-toolbar">
          <div className="feed-search">
            <Search size={19} />

            <input
              type="search"
              placeholder="Search artworks..."
              aria-label="Search artworks"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>
        </div>

        <div className="gallery-filters">
          {filters.map((filter) => (
            <button
              type="button"
              key={filter}
              className={
                selectedFilter === filter
                  ? "gallery-filter active"
                  : "gallery-filter"
              }
              aria-pressed={selectedFilter === filter}
              onClick={() => setSelectedFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        {loading && (
          <div className="feed-loading" role="status">
            <div className="xr-loader" />
            <p>Loading the creative universe...</p>
          </div>
        )}

        {!loading && error && (
          <div className="feed-error" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <p className="gallery-count">
              {filteredArtworks.length} artworks found
            </p>

            {filteredArtworks.length === 0 ? (
              <div className="feed-empty">
                <Sparkles size={38} />
                <h3>The gallery is waiting for its first artwork</h3>
                <p>
                  Create a post with an image, 3D model,
                  or video URL to display it here.
                </p>
                <Link to="/create" className="primary-button">
                  Add Artwork
                </Link>
              </div>
            ) : (
              <div className="gallery-grid">
                {filteredArtworks.map((post, index) => {
                  const imageUrl = validMediaUrl(post.image_url);
                  const modelUrl = validMediaUrl(post.model_url);
                  const videoUrl = validMediaUrl(post.video_url);

                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 25 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.4,
                        delay: Math.min(index, 8) * 0.05,
                      }}
                    >
                      <Link
                        to={`/post/${post.id}`}
                        className="gallery-card"
                      >
                        <div className="gallery-image">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={post.title}
                              loading="lazy"
                              onError={(event) => {
                                event.currentTarget.style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <div className="gallery-placeholder">
                              {modelUrl ? (
                                <Box size={65} />
                              ) : (
                                <Video size={65} />
                              )}
                              <span>
                                {modelUrl
                                  ? "3D Creation"
                                  : "Motion Artwork"}
                              </span>
                            </div>
                          )}

                          <span className="gallery-card-icon">
                            {modelUrl ? (
                              <Box size={19} />
                            ) : imageUrl ? (
                              <ImageIcon size={19} />
                            ) : (
                              <Video size={19} />
                            )}
                          </span>
                        </div>

                        <div className="gallery-card-content">
                          <span className="gallery-category">
                            {post.category || "Digital Art"}
                          </span>

                          <div className="gallery-title-row">
                            <h3>{post.title}</h3>
                            <ArrowUpRight size={21} />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </motion.main>
  );
}

export default Explore;
