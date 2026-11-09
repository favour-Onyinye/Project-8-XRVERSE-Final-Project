
import { useEffect, useState } from "react";
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
import { uploadMedia } from "../lib/uploadMedia";
import TurnstileCheck from "../components/TurnstileCheck";

const categories = [
  "3D Art",
  "Virtual Reality",
  "Augmented Reality",
  "Animation",
  "Game Design",
  "Digital Sculpture",
  "General",
];

function CreatePost() {
  const navigate = useNavigate();

  // =====================================
  // 1. POST INFORMATION
  // =====================================

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [modelUrl, setModelUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [category, setCategory] = useState("3D Art");

  // =====================================
  // 2. MEDIA UPLOADS
  // =====================================

  const [imageFile, setImageFile] = useState(null);
  const [modelFile, setModelFile] = useState(null);

  // =====================================
  // 3. FORM STATUS
  // =====================================

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  // =====================================
  // 4. CLOUDFLARE TURNSTILE
  // =====================================

  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [needsCaptcha, setNeedsCaptcha] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  // =====================================
  // 5. CHECK EXISTING SUPABASE SESSION
  // =====================================

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const { data, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (active) {
          setNeedsCaptcha(!data.session);
        }
      } catch (err) {
        console.error("Session check error:", err);

        if (active) {
          setNeedsCaptcha(true);
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  // =====================================
  // 6. CREATE AND PUBLISH POST
  // =====================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading || authLoading) {
      return;
    }

    setError("");
    setUploadStatus("");

    if (!title.trim()) {
      setError("Please enter a post title.");
      return;
    }

    setLoading(true);

    try {
      // CHECK FOR AN EXISTING SESSION

      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      let user = null;

      // RETURNING USER

      if (sessionData.session) {
        const {
          data,
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        user = data.user;
      } else {
        // NEW VISITOR — REQUIRE TURNSTILE

        setNeedsCaptcha(true);

        if (!captchaToken) {
          throw new Error(
            "Please complete human verification before publishing."
          );
        }

        // SEND CAPTCHA TOKEN TO SUPABASE

        const {
          data,
          error: signInError,
        } = await supabase.auth.signInAnonymously({
          options: {
            captchaToken,
          },
        });

        // RESET CAPTCHA IF VERIFICATION FAILS

        if (signInError) {
          setCaptchaToken(null);

          setCaptchaResetKey(
            (previous) => previous + 1
          );

          throw signInError;
        }

        user = data.user;

        // NEW ANONYMOUS SESSION CREATED

        setNeedsCaptcha(false);
        setCaptchaToken(null);
      }

      if (!user) {
        throw new Error(
          "Unable to create or verify your user session."
        );
      }

      // =====================================
      // 7. PREPARE MEDIA URLS
      // =====================================

      let finalImageUrl = imageUrl.trim() || null;
      let finalModelUrl = modelUrl.trim() || null;

      // UPLOAD IMAGE

      if (imageFile) {
        setUploadStatus("Uploading your artwork...");

        finalImageUrl = await uploadMedia(
          imageFile,
          user.id,
          "image"
        );
      }

      // UPLOAD 3D MODEL

      if (modelFile) {
        setUploadStatus("Uploading your 3D model...");

        finalModelUrl = await uploadMedia(
          modelFile,
          user.id,
          "model"
        );
      }

      // =====================================
      // 8. SAVE POST TO SUPABASE
      // =====================================

      setUploadStatus(
        "Publishing your creation..."
      );

      const {
        data: postData,
        error: insertError,
      } = await supabase
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

      if (insertError) {
        throw insertError;
      }

      // OPEN THE NEWLY CREATED POST

      navigate(`/post/${postData.id}`);
    } catch (err) {
      console.error(
        "XRVERSE publish error:",
        err
      );

      setError(
        err.message ||
          "Unable to publish your creation."
      );
    } finally {
      setLoading(false);
      setUploadStatus("");
    }
  };

  // =====================================
  // 9. CREATE POST PAGE
  // =====================================

  return (
    <motion.main
      className="create-page"
      initial={{ opacity: 0, y: 35 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* BACK BUTTON */}

      <button
        className="back-link"
        onClick={() => navigate("/")}
        type="button"
      >
        <ArrowLeft size={18} />
        Back to Community
      </button>

      {/* PAGE HEADER */}

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

      {/* CREATE POST FORM */}

      <form
        onSubmit={handleSubmit}
        className="create-form"
      >
        {/* POST INFORMATION */}

        <div className="form-section-heading">
          <FileText size={21} />
          <h2>Post Information</h2>
        </div>

        {/* POST TITLE */}

        <div className="form-group">
          <label htmlFor="post-title">
            Post Title
            <span className="required"> *</span>
          </label>

          <input
            id="post-title"
            type="text"
            placeholder="Give your creation an amazing title..."
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
          <label htmlFor="post-content">
            Description
          </label>

          <textarea
            id="post-content"
            placeholder="Tell the community about your work..."
            value={content}
            onChange={(event) =>
              setContent(event.target.value)
            }
            rows={6}
          />
        </div>

        {/* CREATIVE CATEGORY */}

        <div className="form-group">
          <label htmlFor="post-category">
            Creative Category
          </label>

          <select
            id="post-category"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
          >
            {categories.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="form-divider" />

        {/* CREATIVE MEDIA */}

        <div className="form-section-heading">
          <Image size={21} />
          <h2>Creative Media</h2>
        </div>

        <p className="media-description">
          Make your post more immersive by adding
          artwork, 3D models, or videos.
        </p>

        {/* IMAGE UPLOAD */}

        <div className="form-group">
          <label htmlFor="image-upload">
            <Image size={17} />
            Upload Artwork from Your Device
          </label>

          <div className="creative-upload-area">
            <input
              id="image-upload"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif"
              onChange={(event) =>
                setImageFile(
                  event.target.files?.[0] || null
                )
              }
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
            onChange={(event) =>
              setImageUrl(event.target.value)
            }
          />
        </div>

        {/* IMAGE PREVIEW */}

        {imageUrl && (
          <div className="image-preview">
            <p>Artwork Preview</p>

            <img
              src={imageUrl}
              alt="Artwork preview"
              onError={(event) => {
                event.currentTarget.style.display =
                  "none";
              }}
              onLoad={(event) => {
                event.currentTarget.style.display =
                  "block";
              }}
            />
          </div>
        )}

        {/* 3D MODEL UPLOAD */}

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
              onChange={(event) =>
                setModelFile(
                  event.target.files?.[0] || null
                )
              }
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

        {/* MODEL URL */}

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
            onChange={(event) =>
              setModelUrl(event.target.value)
            }
          />
        </div>

        {/* VIDEO URL */}

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
            onChange={(event) =>
              setVideoUrl(event.target.value)
            }
          />
        </div>

        {/* =====================================
            CLOUDFLARE CAPTCHA — BOTTOM OF FORM
            ===================================== */}

        {!authLoading && needsCaptcha && (
          <TurnstileCheck
            key={captchaResetKey}
            onTokenChange={setCaptchaToken}
          />
        )}

        {/* ERROR MESSAGE */}

        {error && (
          <div
            className="form-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* UPLOAD PROGRESS */}

        {uploadStatus && (
          <div
            className="upload-progress"
            role="status"
          >
            <div className="xr-loader" />
            <span>{uploadStatus}</span>
          </div>
        )}

        {/* PUBLISH BUTTON */}

        <motion.button
          type="submit"
          className="publish-button"
          whileHover={{
            scale: loading ? 1 : 1.02,
          }}
          whileTap={{
            scale: loading ? 1 : 0.98,
          }}
          disabled={
            loading ||
            authLoading ||
            (needsCaptcha && !captchaToken)
          }
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
