import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Save,
  ShieldAlert,
  LoaderCircle,
  Image as ImageIcon,
  Box,
  Globe,
  Lock,
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";
import { uploadMedia } from "../lib/uploadMedia";
import { uploadPrivateMedia } from "../lib/uploadPrivateMedia";

// Enabled after XRVERSE privacy access tests.
const PRIVATE_MEDIA_EDITING_ENABLED = true;

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

function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [originalPost, setOriginalPost] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const [error, setError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [visibility, setVisibility] = useState("public");

  const [imageUrl, setImageUrl] = useState("");
  const [modelUrl, setModelUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [modelFile, setModelFile] = useState(null);

  const isPrivate = visibility === "private";

  // =====================================
  // 1. LOAD POST AND VERIFY OWNERSHIP
  // =====================================

  useEffect(() => {
    let active = true;

    async function loadPost() {
      setLoading(true);
      setError("");
      setAccessDenied(false);

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
          setAccessDenied(true);
          return;
        }

        const {
          data: post,
          error: postError,
        } = await supabase
          .from("posts")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (postError) throw postError;

        if (!post) {
          throw new Error(
            "Post not found or access denied."
          );
        }

        if (post.user_id !== currentUser.id) {
          setAccessDenied(true);
          return;
        }

        if (!active) return;

        setUser(currentUser);
        setOriginalPost(post);

        setTitle(post.title || "");
        setContent(post.content || "");
        setCategory(post.category || "General");
        setVisibility(post.visibility || "public");

        setImageUrl(post.image_url || "");
        setModelUrl(post.model_url || "");
        setVideoUrl(post.video_url || "");

        setImageFile(null);
        setModelFile(null);
      } catch (err) {
        console.error("Error loading post:", err);

        if (active) {
          setError(
            err.message || "Unable to load post."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPost();

    return () => {
      active = false;
    };
  }, [id]);

  // =====================================
  // 2. SAVE CHANGES
  // =====================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      saving ||
      loading ||
      accessDenied ||
      !user ||
      !originalPost
    ) {
      return;
    }

    setError("");
    setUploadStatus("");

    if (!title.trim()) {
      setError("Please enter a post title.");
      return;
    }

    // Visibility changes require a separate
    // secure media-migration workflow.
    if (
      visibility !==
      (originalPost.visibility || "public")
    ) {
      setError(
        "Changing visibility is not available yet."
      );
      return;
    }

    if (
      isPrivate &&
      (imageFile || modelFile) &&
      !PRIVATE_MEDIA_EDITING_ENABLED
    ) {
      setError(
        "Private media editing is temporarily disabled."
      );
      return;
    }

    setSaving(true);

    const uploadedPrivatePaths = [];
    let postSaved = false;

    try {
      // Recheck the actual signed-in user.
      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (
        !currentUser ||
        currentUser.is_anonymous === true ||
        currentUser.id !== user.id ||
        currentUser.id !== originalPost.user_id
      ) {
        setAccessDenied(true);
        return;
      }

      // Fetch the latest post before updating.
      const {
        data: latestPost,
        error: latestError,
      } = await supabase
        .from("posts")
        .select(
          "id, user_id, visibility, image_url, " +
          "model_url, video_url, " +
          "private_image_path, private_model_path"
        )
        .eq("id", id)
        .maybeSingle();

      if (latestError) throw latestError;

      if (
        !latestPost ||
        latestPost.user_id !== currentUser.id
      ) {
        setAccessDenied(true);
        return;
      }

      const currentVisibility =
        latestPost.visibility || "public";

      if (currentVisibility !== visibility) {
        throw new Error(
          "This post's visibility changed. " +
          "Refresh before saving."
        );
      }

      let finalImageUrl = latestPost.image_url || null;
      let finalModelUrl = latestPost.model_url || null;
      let finalVideoUrl = latestPost.video_url || null;

      let privateImagePath =
        latestPost.private_image_path || null;

      let privateModelPath =
        latestPost.private_model_path || null;

      // ===================================
      // PRIVATE POST EDITING
      // ===================================

      if (isPrivate) {
        // Private posts never save public URLs.
        finalImageUrl = null;
        finalModelUrl = null;
        finalVideoUrl = null;

        if (imageFile) {
          setUploadStatus(
            "Uploading replacement private image..."
          );

          const uploaded = await uploadPrivateMedia(
            imageFile,
            currentUser.id,
            "image"
          );

          if (!uploaded?.path) {
            throw new Error(
              "Private image upload returned no path."
            );
          }

          privateImagePath = uploaded.path;
          uploadedPrivatePaths.push(uploaded.path);
        }

        if (modelFile) {
          setUploadStatus(
            "Uploading replacement private GLB..."
          );

          const uploaded = await uploadPrivateMedia(
            modelFile,
            currentUser.id,
            "model"
          );

          if (!uploaded?.path) {
            throw new Error(
              "Private model upload returned no path."
            );
          }

          privateModelPath = uploaded.path;
          uploadedPrivatePaths.push(uploaded.path);
        }
      } else {
        // ===================================
        // PUBLIC POST EDITING
        // ===================================

        finalImageUrl = imageUrl.trim() || null;
        finalModelUrl = modelUrl.trim() || null;
        finalVideoUrl = videoUrl.trim() || null;

        if (imageFile) {
          setUploadStatus(
            "Uploading replacement public image..."
          );

          finalImageUrl = await uploadMedia(
            imageFile,
            currentUser.id,
            "image"
          );

          if (!finalImageUrl) {
            throw new Error(
              "Public image upload returned no URL."
            );
          }
        }

        if (modelFile) {
          setUploadStatus(
            "Uploading replacement public GLB..."
          );

          finalModelUrl = await uploadMedia(
            modelFile,
            currentUser.id,
            "model"
          );

          if (!finalModelUrl) {
            throw new Error(
              "Public model upload returned no URL."
            );
          }
        }

        // Public posts should not point to files
        // in the private Storage bucket.
        privateImagePath = null;
        privateModelPath = null;
      }

      // ===================================
      // UPDATE POSTS TABLE
      // ===================================

      setUploadStatus("Saving your changes...");

      const {
        data: updatedPost,
        error: updateError,
      } = await supabase
        .from("posts")
        .update({
          title: title.trim(),
          content: content.trim() || null,
          category,

          visibility: currentVisibility,

          image_url: finalImageUrl,
          model_url: finalModelUrl,
          video_url: finalVideoUrl,

          private_image_path: privateImagePath,
          private_model_path: privateModelPath,
        })
        .eq("id", id)
        .eq("user_id", currentUser.id)
        .eq("visibility", currentVisibility)
        .select("id")
        .maybeSingle();

      if (updateError) throw updateError;

      if (!updatedPost?.id) {
        throw new Error(
          "Post update was not permitted."
        );
      }

      postSaved = true;
      navigate(`/post/${updatedPost.id}`);
    } catch (err) {
      console.error("Edit Post error:", err);

      // Delete newly uploaded private files
      // only when the database update fails.
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
              "Private media cleanup failed:",
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
        err.message || "Unable to save your changes."
      );
    } finally {
      setSaving(false);
      setUploadStatus("");
    }
  }

  // =====================================
  // 3. LOADING
  // =====================================

  if (loading) {
    return (
      <main className="edit-post-page">
        <LoaderCircle size={30} />
        <p>Checking creator permissions...</p>
      </main>
    );
  }

  // =====================================
  // 4. ACCESS DENIED
  // =====================================

  if (accessDenied) {
    return (
      <main className="edit-post-page">
        <div className="edit-access-denied">
          <ShieldAlert size={48} />

          <h1>Access Denied</h1>

          <p>
            Only the original registered creator
            can edit this post.
          </p>

          <Link
            to={`/post/${id}`}
            className="primary-button"
          >
            Return to Post
          </Link>
        </div>
      </main>
    );
  }

  if (error && !originalPost) {
    return (
      <main className="edit-post-page">
        <h2>Unable to load post</h2>
        <p role="alert">{error}</p>
        <Link to="/">Return to Community</Link>
      </main>
    );
  }

  // =====================================
  // 5. EDIT POST FORM
  // =====================================

  return (
    <main className="edit-post-page">
      <Link
        to={`/post/${id}`}
        className="details-back-link"
      >
        <ArrowLeft size={18} />
        Back to Post
      </Link>

      <div className="edit-post-container">
        <h1>Edit Your Creation</h1>

        <p>
          Update your artwork details
          and creative media.
        </p>

        <div className="form-group">
          <p>
            {isPrivate ? (
              <>
                <Lock size={17} />
                <strong> Private Post</strong>
              </>
            ) : (
              <>
                <Globe size={17} />
                <strong> Public Post</strong>
              </>
            )}
          </p>

          <p className="media-description">
            Visibility is preserved while editing.
            Switching between Public and Private
            requires a separate media-migration step.
          </p>
        </div>

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* TITLE */}

          <div className="form-group">
            <label htmlFor="edit-title">
              Title
            </label>

            <input
              id="edit-title"
              type="text"
              value={title}
              maxLength={150}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              required
            />
          </div>

          {/* DESCRIPTION */}

          <div className="form-group">
            <label htmlFor="edit-content">
              Description
            </label>

            <textarea
              id="edit-content"
              value={content}
              onChange={(event) =>
                setContent(event.target.value)
              }
              rows={6}
            />
          </div>

          {/* CATEGORY */}

          <div className="form-group">
            <label htmlFor="edit-category">
              Category
            </label>

            <select
              id="edit-category"
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

          {/* PUBLIC URL FIELDS */}

          {!isPrivate && (
            <>
              <div className="form-group">
                <label htmlFor="edit-image">
                  Artwork Image URL
                </label>

                <input
                  id="edit-image"
                  type="url"
                  value={imageUrl}
                  onChange={(event) =>
                    setImageUrl(event.target.value)
                  }
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-model">
                  3D Model URL
                </label>

                <input
                  id="edit-model"
                  type="url"
                  value={modelUrl}
                  onChange={(event) =>
                    setModelUrl(event.target.value)
                  }
                  placeholder="https://example.com/model.glb"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-video">
                  Video URL
                </label>

                <input
                  id="edit-video"
                  type="url"
                  value={videoUrl}
                  onChange={(event) =>
                    setVideoUrl(event.target.value)
                  }
                  placeholder="https://example.com/video.mp4"
                />
              </div>
            </>
          )}

          {/* IMAGE REPLACEMENT */}

          <div className="form-group">
            <label htmlFor="edit-image-upload">
              <ImageIcon size={17} />
              Upload Replacement Artwork
            </label>

            <input
              id="edit-image-upload"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif"
              disabled={
                saving ||
                (isPrivate &&
                  !PRIVATE_MEDIA_EDITING_ENABLED)
              }
              onChange={(event) =>
                setImageFile(
                  event.target.files?.[0] || null
                )
              }
            />

            <p className="media-description">
              JPG, PNG, WEBP, or GIF.
              Maximum 10 MB.
            </p>

            {imageFile && (
              <p>Selected: {imageFile.name}</p>
            )}
          </div>

          {/* GLB REPLACEMENT */}

          <div className="form-group">
            <label htmlFor="edit-model-upload">
              <Box size={17} />
              Upload Replacement 3D Model
            </label>

            <input
              id="edit-model-upload"
              type="file"
              accept=".glb,model/gltf-binary"
              disabled={
                saving ||
                (isPrivate &&
                  !PRIVATE_MEDIA_EDITING_ENABLED)
              }
              onChange={(event) =>
                setModelFile(
                  event.target.files?.[0] || null
                )
              }
            />

            <p className="media-description">
              GLB format only.
              Maximum 25 MB.
            </p>

            {modelFile && (
              <p>Selected: {modelFile.name}</p>
            )}
          </div>

          {isPrivate && (
            <p className="media-description">
              Replacement images and models will
              be stored in your protected private
              Storage folder.
            </p>
          )}

          {uploadStatus && (
            <div
              className="upload-progress"
              role="status"
            >
              <LoaderCircle size={18} />
              {uploadStatus}
            </div>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            <Save size={18} />
            {saving
              ? "Saving Changes..."
              : "Save Changes"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default EditPost;
