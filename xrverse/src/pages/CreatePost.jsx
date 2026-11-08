import { uploadMedia } from "../lib/uploadMedia";
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

  const [imageFile, setImageFile] = useState(null);
  const [modelFile, setModelFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");

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
    setUploadStatus("");

    if (!title.trim()) {
      setError("Please enter a post title.");
      return;
    }

    setLoading(true);

    try {
      // 1. Reuse the current session or sign in anonymously.
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      let user;

      if (sessionData.session) {
        const { data, error: userError } =
          await supabase.auth.getUser();

        if (userError) throw userError;
        user = data.user;
      } else {
        const { data, error: authError } =
          await supabase.auth.signInAnonymously();

        if (authError) throw authError;
        user = data.user;
      }

      if (!user) {
        throw new Error("Unable to create a user session.");
      }

      // 2. Start with optional external URLs.
      let finalImageUrl = imageUrl.trim() || null;
      let finalModelUrl = modelUrl.trim() || null;

      // 3. Upload the selected image, if provided.
      if (imageFile) {
        setUploadStatus("Uploading your artwork...");

        finalImageUrl = await uploadMedia(
          imageFile,
          user.id,
          "image"
        );
      }

      // 4. Upload the selected 3D model, if provided.
      if (modelFile) {
        setUploadStatus("Uploading your 3D model...");

        finalModelUrl = await uploadMedia(
          modelFile,
          user.id,
          "model"
        );
      }

      // 5. Save the post and uploaded file URLs.
      setUploadStatus("Publishing your creation...");

      const { data: postData, error: insertError } = await supabase
          .from("posts")
          .insert({
            user_id: user.id,
            title: title.trim(),
            content: content.trim() || null,
            image_url: finalImageUrl,
            model_url: finalModelUrl,
            video_url: videoUrl.trim() || null,
            category,
          })
          .select("id")
          .single();

      if (insertError) throw insertError;

      // 6. Open the finished post.
      navigate(`/post/${postData.id}`);

    } catch (err) {
        console.error("XRVERSE upload error:", err);

      setError(
        err.message || "Unable to publish your creation."
      );
    } finally {
        setLoading(false);
        setUploadStatus("");
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
        
        {/* DIRECT IMAGE UPLOAD */}

        <div className="form-group">
          <label htmlFor="image-upload">
            <Image size={17} />
            Upload Artwork from Your Device
          </label>

          <div className="creative-upload-area">
            <input
              id="image-upload"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
              onChange={(event) => {
                setImageFile(event.target.files?.[0] || null);
              }}
            />

            <p>
              Choose a JPG, PNG, WEBP, or GIF image.
              Maximum 10 MB.
            </p>

            {imageFile && (
              <span className="selected-file">
                Selected: {imageFile.name}
              </span>
            )}
          </div>
        </div>

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

        {/* DIRECT 3D MODEL UPLOAD */}

        <div className="form-group">
          <label htmlFor="model-upload">
            <Box size={17} />
            Upload Your 3D Model
          </label>

          <div className="creative-upload-area">
            <input
              id="model-upload"
              type="file"
              accept=".glb,model/gltf-binary"
              onChange={(event) => {
                setModelFile(event.target.files?.[0] || null);
              }}
            />

            <p>
              Choose a GLB 3D model.
              Maximum 25 MB.
            </p>

            {modelFile && (
              <span className="selected-file">
                Selected: {modelFile.name}
              </span>
            )}
          </div>
        </div>

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

        {/* UPLOAD MESSAGE */}

        {uploadStatus && (
          <div className="upload-progress" role="status">
            <div className="xr-loader" />
            <span>{uploadStatus}</span>
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
