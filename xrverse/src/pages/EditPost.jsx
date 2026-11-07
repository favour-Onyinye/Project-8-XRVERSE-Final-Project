
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Save,
  Sparkles,
  Image,
  Box,
  Video,
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";

function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    content: "",
    image_url: "",
    model_url: "",
    video_url: "",
    category: "General",
  });

  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [authorized, setAuthorized] = useState(false);

  const categories = [
    "3D Art",
    "Virtual Reality",
    "Augmented Reality",
    "Animation",
    "Game Design",
    "Digital Sculpture",
    "General",
  ];

  useEffect(() => {
    let cancelled = false;

    async function loadPost() {
      setLoading(true);
      setError("");
      setAuthorized(false);

      try {
        // Get the existing user session.
        // Do not create a new identity for editing.
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!sessionData.session) {
          throw new Error(
            "Your original author session is unavailable."
          );
        }

        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError) throw userError;

        const user = userData.user;

        if (!user) {
          throw new Error("Unable to verify your identity.");
        }

        // Retrieve the post.
        const { data: post, error: postError } =
          await supabase
            .from("posts")
            .select("*")
            .eq("id", id)
            .single();

        if (postError) throw postError;

        // Only the original author can edit.

        if (!cancelled) {
          setUserId(user.id);
          setAuthorized(true);

          setForm({
            title: post.title || "",
            content: post.content || "",
            image_url: post.image_url || "",
            model_url: post.model_url || "",
            video_url: post.video_url || "",
            category: post.category || "General",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load post.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPost();

    return () => {
      cancelled = true;
    };
  }, [id]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!authorized || saving || !userId) return;

    if (!form.title.trim()) {
      setError("Post title is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Verify session again before submitting.
      const { data: userData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      if (userData.user?.id !== userId) {
        throw new Error("Your author session has changed.");
      }

      const updates = {
        title: form.title.trim(),
        content: form.content.trim() || null,
        image_url: form.image_url.trim() || null,
        model_url: form.model_url.trim() || null,
        video_url: form.video_url.trim() || null,
        category: form.category,
      };

      const { data, error: updateError } =
        await supabase
          .from("posts")
          .update(updates)
          .eq("id", id)
          .select("id")
          .maybeSingle();


      if (updateError) throw updateError;

      if (!data) {
        throw new Error(
          "Post could not be updated. Check ownership."
        );
      }

      navigate(`/post/${data.id}`);
    } catch (err) {
      console.error("XRVERSE update error:", err);
      setError(err.message || "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="post-details-loading" role="status">
        <div className="xr-loader" />
        <p>Loading your creation...</p>
      </main>
    );
  }

  if (error && !authorized) {
    return (
      <main className="post-details-error">
        <h2>Unable to edit post</h2>
        <p>{error}</p>
        <Link to="/" className="primary-button">
          Back to Community
        </Link>
      </main>
    );
  }

  return (
    <motion.main
      className="edit-page"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Link
        to={`/post/${id}`}
        className="details-back-link"
      >
        <ArrowLeft size={18} />
        Back to Post
      </Link>

      <div className="create-header">
        <span className="create-eyebrow">
          <Sparkles size={16} />
          XRVERSE CREATOR STUDIO
        </span>

        <h1>
          Refine Your
          <span> Creation.</span>
        </h1>

        <p>
          Update your artwork, description,
          and creative project details.
        </p>
      </div>

      <form
        className="create-form"
        onSubmit={handleSubmit}
      >
        <div className="form-section-heading">
          <Sparkles size={22} />
          <h2>Edit Post Information</h2>
        </div>

        <div className="form-group">
          <label htmlFor="edit-title">
            Post Title *
          </label>

          <input
            id="edit-title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            maxLength={150}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-content">
            Description
          </label>

          <textarea
            id="edit-content"
            name="content"
            value={form.content}
            onChange={handleChange}
            rows={6}
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-category">
            Creative Category
          </label>

          <select
            id="edit-category"
            name="category"
            value={form.category}
            onChange={handleChange}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="form-divider" />

        <div className="form-section-heading">
          <Image size={22} />
          <h2>Creative Media</h2>
        </div>

        <div className="form-group">
          <label htmlFor="edit-image">
            <Image size={17} />
            Artwork Image URL
          </label>

          <input
            id="edit-image"
            name="image_url"
            type="url"
            value={form.image_url}
            onChange={handleChange}
            placeholder="https://example.com/artwork.jpg"
          />
        </div>

        {form.image_url && (
          <div className="image-preview">
            <p>Artwork Preview</p>
            <img
              key={form.image_url}
              src={form.image_url}
              alt="Artwork preview"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="edit-model">
            <Box size={17} />
            3D Model URL
          </label>

          <input
            id="edit-model"
            name="model_url"
            type="url"
            value={form.model_url}
            onChange={handleChange}
            placeholder="https://example.com/model.glb"
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-video">
            <Video size={17} />
            Animation or Video URL
          </label>

          <input
            id="edit-video"
            name="video_url"
            type="url"
            value={form.video_url}
            onChange={handleChange}
            placeholder="https://example.com/video.mp4"
          />
        </div>

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="publish-button"
          disabled={saving}
        >
          <Save size={19} />
          {saving ? "Saving Changes..." : "Save Changes"}
        </button>
      </form>
    </motion.main>
  );
}

export default EditPost;
