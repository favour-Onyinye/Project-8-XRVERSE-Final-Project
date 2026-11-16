import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

import {
  ArrowLeft,
  Image as ImageIcon,
  Box,
  Video,
  Sparkles,
  Send,
  FileText,
  Globe,
  Lock,
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";
import { uploadMedia } from "../lib/uploadMedia";
import { uploadPrivateMedia } from "../lib/uploadPrivateMedia";

// Enabled after the XRVERSE RLS and Storage access tests.
const PRIVATE_PUBLISHING_ENABLED = true;

const categories = [
  "General",
  "3D Art",
  "Virtual Reality",
  "Augmented Reality",
  "VR/AR",
  "Animation",
  "Game Design",
  "Digital Sculpture",
  "Digital Art",
];

function CreatePost() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("3D Art");
  const [visibility, setVisibility] = useState("public");

  const [imageUrl, setImageUrl] = useState("");
  const [modelUrl, setModelUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [modelFile, setModelFile] = useState(null);

  const [creator, setCreator] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  const isPrivate = visibility === "private";

  // =====================================
  // 1. VERIFY REGISTERED CREATOR
  // =====================================

  useEffect(() => {
    let active = true;

    async function checkCreator() {
      try {
        const { data, error: authError } =
          await supabase.auth.getUser();

        if (!active) return;

        const user = data?.user;

        if (
          authError ||
          !user ||
          user.is_anonymous === true
        ) {
          setCreator(null);
          navigate("/login", { replace: true });
          return;
        }

        setCreator(user);
      } catch (err) {
        console.error("Creator authentication error:", err);

        if (active) {
          setCreator(null);
          navigate("/login", { replace: true });
        }
      } finally {
        if (active) setCheckingAuth(false);
      }
    }

    checkCreator();

    return () => {
      active = false;
    };
  }, [navigate]);

  // =====================================
  // 2. PUBLISH A POST
  // =====================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading || checkingAuth) return;

    setError("");
    setUploadStatus("");

    if (!title.trim()) {
      setError("Please enter a post title.");
      return;
    }

    if (!["public", "private"].includes(visibility)) {
      setError("Please select valid post visibility.");
      return;
    }

    if (isPrivate && !PRIVATE_PUBLISHING_ENABLED) {
      setError(
        "Private publishing is temporarily unavailable."
      );
      return;
    }

    // A private post must never reference
    // externally hosted, potentially public media.
    if (
      isPrivate &&
      (
        imageUrl.trim() ||
        modelUrl.trim() ||
        videoUrl.trim()
      )
    ) {
      setError(
        "Private posts cannot use external image, " +
        "model, or video URLs. Upload files directly."
      );
      return;
    }

    setLoading(true);

    const uploadedPrivatePaths = [];
    let postSaved = false;

    try {
      const { data, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      const user = data?.user;

      if (!user || user.is_anonymous === true) {
        navigate("/login", { replace: true });
        return;
      }

      let finalImageUrl = null;
      let finalModelUrl = null;

      let privateImagePath = null;
      let privateModelPath = null;

      // ===================================
      // PRIVATE MEDIA STORAGE
      // ===================================

      if (isPrivate) {
        if (imageFile) {
          setUploadStatus(
            "Uploading private artwork..."
          );

          const uploaded = await uploadPrivateMedia(
            imageFile,
            user.id,
            "image"
          );

          if (!uploaded?.path) {
            throw new Error(
              "Private image upload did not return a path."
            );
          }

          privateImagePath = uploaded.path;
          uploadedPrivatePaths.push(uploaded.path);
        }

        if (modelFile) {
          setUploadStatus(
            "Uploading private 3D model..."
          );

          const uploaded = await uploadPrivateMedia(
            modelFile,
            user.id,
            "model"
          );

          if (!uploaded?.path) {
            throw new Error(
              "Private model upload did not return a path."
            );
          }

          privateModelPath = uploaded.path;
          uploadedPrivatePaths.push(uploaded.path);
        }
      } else {
        // ===================================
        // PUBLIC MEDIA STORAGE
        // ===================================

        finalImageUrl = imageUrl.trim() || null;
        finalModelUrl = modelUrl.trim() || null;

        if (imageFile) {
          setUploadStatus(
            "Uploading public artwork..."
          );

          finalImageUrl = await uploadMedia(
            imageFile,
            user.id,
            "image"
          );

          if (!finalImageUrl) {
            throw new Error(
              "Public image upload did not return a URL."
            );
          }
        }

        if (modelFile) {
          setUploadStatus(
            "Uploading public 3D model..."
          );

          finalModelUrl = await uploadMedia(
            modelFile,
            user.id,
            "model"
          );

          if (!finalModelUrl) {
            throw new Error(
              "Public model upload did not return a URL."
            );
          }
        }
      }

      // ===================================
      // SAVE TO POSTS TABLE
      // ===================================

      setUploadStatus("Saving your creation...");

      const {
        data: newPost,
        error: insertError,
      } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: content.trim() || null,
          category,
          visibility,

          image_url: finalImageUrl,
          model_url: finalModelUrl,
          video_url: isPrivate
            ? null
            : videoUrl.trim() || null,

          private_image_path: privateImagePath,
          private_model_path: privateModelPath,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      if (!newPost?.id) {
        throw new Error(
          "Post creation did not return an ID."
        );
      }

      postSaved = true;
      navigate(`/post/${newPost.id}`);
    } catch (err) {
      console.error("Create Post error:", err);

      // Clean up newly uploaded private files
      // if database insertion failed.
      if (
        !postSaved &&
        uploadedPrivatePaths.length > 0
      ) {
        try {
          const { error: cleanupError } =
            await supabase.storage
              .from("xrverse-private-media")
              .remove(uploadedPrivatePaths);

          if (cleanupError) {
            console.error(
              "Private upload cleanup failed:",
              cleanupError
            );
          }
        } catch (cleanupError) {
          console.error(
            "Private cleanup error:",
            cleanupError
          );
        }
      }

      setError(
        err.message || "Unable to create the post."
      );
    } finally {
      setLoading(false);
      setUploadStatus("");
    }
  }

  // =====================================
  // 3. AUTHENTICATION LOADING
  // =====================================

  if (checkingAuth) {
    return (
      <main className="create-page">
        <p role="status">
          Checking your creator account...
        </p>
      </main>
    );
  }

  if (!creator) return null;

  // =====================================
  // 4. CREATE POST FORM
  // =====================================

  return (
    <motion.main
      className="create-page"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <button
        type="button"
        className="back-link"
        onClick={() => navigate("/")}
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
          Share Your <span>Imagination.</span>
        </h1>

        <p>
          Share your digital artwork, 3D creations,
          and immersive experiences.
        </p>

        <p>
          Signed in as:{" "}
          <strong>{creator.email}</strong>
        </p>
      </div>

      <form
        className="create-form"
        onSubmit={handleSubmit}
      >
        {/* POST INFORMATION */}

        <div className="form-section-heading">
          <FileText size={21} />
          <h2>Post Information</h2>
        </div>

        <div className="form-group">
          <label htmlFor="post-title">
            Post Title *
          </label>

          <input
            id="post-title"
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="Name your creative project..."
            maxLength={150}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="post-content">
            Description
          </label>

          <textarea
            id="post-content"
            value={content}
            onChange={(event) =>
              setContent(event.target.value)
            }
            placeholder="Describe your creative work..."
            rows={6}
          />
        </div>

        <div className="form-group">
          <label htmlFor="post-category">
            Category
          </label>

          <select
            id="post-category"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {/* VISIBILITY */}

        <div className="form-section-heading">
          {isPrivate ? (
            <Lock size={21} />
          ) : (
            <Globe size={21} />
          )}
          <h2>Post Visibility</h2>
        </div>

        <div className="form-group">
          <label htmlFor="post-visibility">
            Who can view this post?
          </label>

          <select
            id="post-visibility"
            value={visibility}
            disabled={loading}
            onChange={(event) => {
              setVisibility(event.target.value);
              setError("");

              // Clear hidden URLs so a private
              // post never retains public links.
              if (event.target.value === "private") {
                setImageUrl("");
                setModelUrl("");
                setVideoUrl("");
              }
            }}
          >
            <option value="public">
              Public — Everyone can view
            </option>
            <option
              value="private"
              disabled={!PRIVATE_PUBLISHING_ENABLED}
            >
              Private — Only I can view
            </option>
          </select>

          <p className="media-description">
            {isPrivate
              ? "Private posts are visible only to your account. Uploaded files use protected Storage."
              : "Public posts are visible to registered users and guests."}
          </p>
        </div>

        <div className="form-divider" />

        {/* IMAGE UPLOAD */}

        <div className="form-section-heading">
          <ImageIcon size={21} />
          <h2>Creative Media</h2>
        </div>

        <div className="form-group">
          <label htmlFor="image-upload">
            <ImageIcon size={17} />
            Upload Artwork
          </label>

          <div className="creative-upload-area">
            <input
              id="image-upload"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif"
              disabled={loading}
              onChange={(event) =>
                setImageFile(
                  event.target.files?.[0] || null
                )
              }
            />

            <p>
              JPG, PNG, WEBP or GIF.
              Maximum 10 MB.
            </p>

            {imageFile && (
              <span className="selected-file">
                Selected: {imageFile.name}
              </span>
            )}
          </div>
        </div>

        {/* PUBLIC IMAGE URL */}

        {!isPrivate && (
          <div className="form-group">
            <label htmlFor="image-url">
              Artwork Image URL (Optional)
            </label>

            <input
              id="image-url"
              type="url"
              value={imageUrl}
              disabled={loading}
              onChange={(event) =>
                setImageUrl(event.target.value)
              }
              placeholder="https://example.com/image.jpg"
            />
          </div>
        )}

        {/* GLB UPLOAD */}

        <div className="form-group">
          <label htmlFor="model-upload">
            <Box size={17} />
            Upload 3D Model
          </label>

          <div className="creative-upload-area">
            <input
              id="model-upload"
              type="file"
              accept=".glb,model/gltf-binary"
              disabled={loading}
              onChange={(event) =>
                setModelFile(
                  event.target.files?.[0] || null
                )
              }
            />

            <p>
              GLB format only. Maximum 25 MB.
            </p>

            {modelFile && (
              <span className="selected-file">
                Selected: {modelFile.name}
              </span>
            )}
          </div>
        </div>

        {/* PUBLIC MODEL URL */}

        {!isPrivate && (
          <div className="form-group">
            <label htmlFor="model-url">
              3D Model URL (Optional)
            </label>

            <input
              id="model-url"
              type="url"
              value={modelUrl}
              disabled={loading}
              onChange={(event) =>
                setModelUrl(event.target.value)
              }
              placeholder="https://example.com/model.glb"
            />
          </div>
        )}

        {/* PUBLIC VIDEO URL */}

        {!isPrivate && (
          <div className="form-group">
            <label htmlFor="video-url">
              <Video size={17} />
              Video URL (Optional)
            </label>

            <input
              id="video-url"
              type="url"
              value={videoUrl}
              disabled={loading}
              onChange={(event) =>
                setVideoUrl(event.target.value)
              }
              placeholder="https://example.com/video.mp4"
            />
          </div>
        )}

        {/* PRIVACY MESSAGE */}

        <p className="media-description">
          {isPrivate
            ? "Private uploads save protected file paths, not permanent public URLs."
            : "Public artwork and models can be viewed by visitors."}
        </p>

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        {uploadStatus && (
          <div
            className="upload-progress"
            role="status"
          >
            <div className="xr-loader" />
            <span>{uploadStatus}</span>
          </div>
        )}

        <motion.button
          type="submit"
          className="publish-button"
          disabled={
            loading ||
            checkingAuth ||
            (isPrivate && !PRIVATE_PUBLISHING_ENABLED)
          }
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
        >
          {loading ? (
            "Publishing Your Creation..."
          ) : (
            <>
              <Send size={19} />
              {isPrivate
                ? "Save Private Post"
                : "Publish to XRVERSE"}
            </>
          )}
        </motion.button>
      </form>
    </motion.main>
  );
}

export default CreatePost;


