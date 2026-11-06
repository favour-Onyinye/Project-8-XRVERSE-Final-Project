
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Image,
  Box,
  Video,
  Sparkles,
  Send,
  FileText,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

function CreatePost() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [modelUrl, setModelUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [category, setCategory] = useState("3D Art");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const categories = [
    "3D Art",
    "Virtual Reality",
    "Augmented Reality",
    "Animation",
    "Game Design",
    "Digital Sculpture",
    "General",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");

    if (!title.trim()) {
      setError("Please enter a post title.");
      return;
    }

    setLoading(true);

    try {
      // Get the current Supabase user session.
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      // Create anonymous user if needed.
      let currentUser = user;

      if (!currentUser) {
        const { data, error: authError } =
          await supabase.auth.signInAnonymously();

        if (authError) throw authError;

        currentUser = data.user;
      }

      if (!currentUser) {
        throw new Error("Unable to create user session.");
      }

      // Save the new post.
      const { data, error: insertError } = await supabase
        .from("posts")
        .insert([
          {
            user_id: currentUser.id,
            title: title.trim(),
            content: content.trim() || null,
            image_url: imageUrl.trim() || null,
            model_url: modelUrl.trim() || null,
            video_url: videoUrl.trim() || null,
            category,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Navigate to the newly created post.
      navigate(`/post/${data.id}`);
    } catch (err) {
      console.error("XRVERSE INSERT ERROR:", {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
      });
      setError(
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.main
      className="create-page"
      initial={{ opacity: 0, y: 35 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <button
        className="back-link"
        onClick={() => navigate("/")}
        type="button"
      >
        <ArrowLeft size={18} />
        Back to Community
      </button>

      <div className="create-header">
        <div className="create-eyebrow">
          <Sparkles size={16} />
          XRVERSE CREATOR STUDIO
        </div>

        <h1>
          Share Your
          <span> Imagination.</span>
        </h1>

        <p>
          Have an amazing 3D design, immersive VR
          experience, or creative idea? Share it
          with the XRVERSE community.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="create-form"
      >
        <div className="form-section-heading">
          <FileText size={21} />
          <h2>Post Information</h2>
        </div>

        {/* POST TITLE */}

        <div className="form-group">
          <label htmlFor="post-title">
            Post Title <span className="required">*</span>
          </label>

          <input
            id="post-title"
            type="text"
            placeholder="Give your creation an amazing title..."
            value={title}
            maxLength={150}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* DESCRIPTION */}

        <div className="form-group">
          <label htmlFor="post-content">
            Description
          </label>

          <textarea
            id="post-content"
            placeholder="Tell the community about your work, inspiration, creative process, or questions..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
          />
        </div>

        {/* CATEGORY */}

        <div className="form-group">
          <label htmlFor="post-category">
            Creative Category
          </label>

          <select
            id="post-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="form-divider" />

        <div className="form-section-heading">
          <Image size={21} />
          <h2>Creative Media</h2>
        </div>

        <p className="media-description">
          Make your post more immersive by adding
          artwork, 3D models, or videos.
        </p>

        {/* IMAGE URL */}

        <div className="form-group">
          <label htmlFor="post-image">
            <Image size={17} />
            Artwork Image URL
          </label>

          <input
            id="post-image"
            type="url"
            placeholder="https://example.com/artwork.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>

        {/* IMAGE PREVIEW */}

        {imageUrl && (
          <div className="image-preview">
            <p>Artwork Preview</p>

            <img
              src={imageUrl}
              alt="Artwork preview"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              onLoad={(e) => {
                e.currentTarget.style.display = "block";
              }}
            />
          </div>
        )}

        {/* 3D MODEL */}

        <div className="form-group">
          <label htmlFor="post-model">
            <Box size={17} />
            3D Model URL (Optional)
          </label>

          <input
            id="post-model"
            type="url"
            placeholder="https://example.com/model.glb"
            value={modelUrl}
            onChange={(e) => setModelUrl(e.target.value)}
          />
        </div>

        {/* VIDEO */}

        <div className="form-group">
          <label htmlFor="post-video">
            <Video size={17} />
            Animation or Video URL (Optional)
          </label>

          <input
            id="post-video"
            type="url"
            placeholder="https://example.com/video.mp4"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
        </div>

        {/* ERROR */}

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        {/* SUBMIT */}

        <motion.button
          type="submit"
          className="publish-button"
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          disabled={loading}
        >
          {loading ? (
            "Publishing Your Creation..."
          ) : (
            <>
              <Send size={19} />
              Publish to XRVERSE
            </>
          )}
        </motion.button>
      </form>
    </motion.main>
  );
}

export default CreatePost;
