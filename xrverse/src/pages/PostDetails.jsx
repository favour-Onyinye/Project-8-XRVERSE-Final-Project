
import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import { motion } from "motion/react";

import {
  ArrowLeft,
  ArrowUp,
  CalendarDays,
  MessageCircle,
  Send,
  Box,
  Video,
  ExternalLink,
  Sparkles,
  Pencil,
  Trash2,
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";
import ModelViewer from "../components/ModelViewer";
import TurnstileCheck from "../components/TurnstileCheck";

function PostDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // =====================================
  // STATE
  // =====================================

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);

  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const [commentText, setCommentText] = useState("");

  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  // =====================================
  // 1. LOAD POST AND COMMENTS
  // =====================================

  useEffect(() => {
    let active = true;

    async function loadPost() {
      try {
        setLoading(true);

        const {
          data: postData,
          error: postError,
        } = await supabase
          .from("posts")
          .select("*")
          .eq("id", id)
          .single();

        if (postError) throw postError;

        const {
          data: commentData,
          error: commentError,
        } = await supabase
          .from("comments")
          .select("id, content, created_at, user_id")
          .eq("post_id", id)
          .order("created_at", {
            ascending: true,
          });

        if (commentError) throw commentError;

        if (active) {
          setPost(postData);
          setComments(commentData || []);
          setError("");
        }
      } catch (err) {
        console.error("Error loading post:", err);

        if (active) {
          setError(
            err.message || "Unable to load this post."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPost();

    return () => {
      active = false;
    };
  }, [id]);

  // =====================================
  // 2. IDENTIFY CURRENT VISITOR
  // =====================================

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (active) {
          setCurrentUser(session?.user ?? null);
          setAuthLoading(false);
        }
      }
    );

    async function loadCurrentUser() {
      try {
        const {
          data,
          error: authError,
        } = await supabase.auth.getUser();

        if (!active) return;

        if (authError) {
          setCurrentUser(null);
        } else {
          setCurrentUser(data.user ?? null);
        }
      } catch (err) {
        console.error("Auth check error:", err);

        if (active) {
          setCurrentUser(null);
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // =====================================
  // 3. GET OR CREATE ANONYMOUS SESSION
  // =====================================

  const getCurrentUser = async () => {
    const {
      data: sessionData,
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;

    // NEW VISITOR — REQUIRE CAPTCHA
    if (!sessionData.session) {
      if (!captchaToken) {
        throw new Error(
          "Please complete human verification before participating."
        );
      }

      const {
        data: authData,
        error: authError,
      } = await supabase.auth.signInAnonymously({
        options: {
          captchaToken,
        },
      });

      if (authError) {
        setCaptchaToken(null);
        setCaptchaResetKey((previous) => previous + 1);
        throw authError;
      }

      if (!authData.user) {
        throw new Error(
          "Unable to create an anonymous session."
        );
      }

      setCurrentUser(authData.user);
      setCaptchaToken(null);

      return authData.user;
    }

    // RETURNING USER — EXISTING SESSION
    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;

    if (!userData.user) {
      throw new Error(
        "Unable to verify the current user."
      );
    }

    setCurrentUser(userData.user);
    return userData.user;
  };

  // =====================================
  // 4. CHECK POST OWNERSHIP
  // =====================================

  const isOwner =
    Boolean(currentUser?.id) &&
    Boolean(post?.user_id) &&
    currentUser.id === post.user_id;

  // =====================================
  // 5. UPVOTE
  // =====================================

  const handleUpvote = async () => {
    if (!post || upvoting || authLoading) return;

    setUpvoting(true);
    setActionError("");

    try {
      await getCurrentUser();

      const {
        data,
        error: voteError,
      } = await supabase.rpc("upvote_post", {
        target_post_id: post.id,
      });

      if (voteError) throw voteError;

      setPost((previous) => {
        if (!previous) return previous;

        return {
          ...previous,
          upvotes: data,
        };
      });
    } catch (err) {
      console.error("Upvote error:", err);

      setActionError(
        err.message || "Unable to upvote this post."
      );
    } finally {
      setUpvoting(false);
    }
  };

  // =====================================
  // 6. ADD COMMENT
  // =====================================

  const handleComment = async (event) => {
    event.preventDefault();

    if (
      !post ||
      !commentText.trim() ||
      commenting ||
      authLoading
    ) {
      return;
    }

    setCommenting(true);
    setActionError("");

    try {
      const user = await getCurrentUser();

      const {
        data,
        error: commentError,
      } = await supabase
        .from("comments")
        .insert({
          post_id: post.id,
          user_id: user.id,
          content: commentText.trim(),
        })
        .select("id, content, created_at, user_id")
        .single();

      if (commentError) throw commentError;

      setComments((previous) => [
        ...previous,
        data,
      ]);

      setCommentText("");
    } catch (err) {
      console.error("Comment error:", err);

      setActionError(
        err.message || "Unable to post your comment."
      );
    } finally {
      setCommenting(false);
    }
  };

  // =====================================
  // 7. DELETE POST — CREATOR ONLY
  // =====================================

  const handleDelete = async () => {
    if (!post || deleting || !isOwner) return;

    const confirmed = window.confirm(
      "Are you sure you want to permanently delete " +
      "this post? This action cannot be undone."
    );

    if (!confirmed) return;

    setDeleting(true);
    setActionError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user || user.id !== post.user_id) {
        throw new Error(
          "Access denied. Only the creator can delete this post."
        );
      }

      const {
        data,
        error: deleteError,
      } = await supabase
        .from("posts")
        .delete()
        .eq("id", post.id)
        .eq("user_id", user.id)
        .select("id")
        .maybeSingle();

      if (deleteError) throw deleteError;

      if (!data) {
        throw new Error(
          "The post was not deleted. Permission denied."
        );
      }

      navigate("/");
    } catch (err) {
      console.error("Delete error:", err);

      setActionError(
        err.message || "Unable to delete this post."
      );
    } finally {
      setDeleting(false);
    }
  };

  // =====================================
  // 8. LOADING
  // =====================================

  if (loading) {
    return (
      <main
        className="post-details-loading"
        role="status"
      >
        <div className="xr-loader" />
        <p>Loading your creative universe...</p>
      </main>
    );
  }

  // =====================================
  // 9. POST ERROR
  // =====================================

  if (error || !post) {
    return (
      <main className="post-details-error">
        <h2>Unable to display this post</h2>

        <p>{error || "Post not found."}</p>

        <Link to="/" className="primary-button">
          Return to Community
        </Link>
      </main>
    );
  }

  // =====================================
  // 10. DATE
  // =====================================

  const formattedDate = new Date(
    post.created_at
  ).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // =====================================
  // 11. POST DETAILS PAGE
  // =====================================

  return (
    <motion.main
      className="post-details-page"
      key={id}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* BACK NAVIGATION */}

      <Link to="/" className="details-back-link">
        <ArrowLeft size={18} />
        Back to Community
      </Link>

      {/* POST CARD */}

      <article className="post-details-card">

        {/* CATEGORY */}

        <div className="post-details-category">
          <Sparkles size={15} />
          {post.category || "General"}
        </div>

        {/* TITLE */}

        <h1>{post.title}</h1>

        {/* POST METADATA */}

        <div className="post-details-meta">
          <span>
            <CalendarDays size={17} />
            {formattedDate}
          </span>

          <span>
            <ArrowUp size={17} />
            {post.upvotes ?? 0} upvotes
          </span>
        </div>

        {/* DESCRIPTION */}

        {post.content && (
          <div className="post-description">
            <p>{post.content}</p>
          </div>
        )}

        {/* IMAGE */}

        {post.image_url && (
          <div className="post-artwork">
            <img
              src={post.image_url}
              alt={`Artwork for ${post.title}`}
              loading="lazy"
            />
          </div>
        )}

        {/* INTERACTIVE 3D MODEL */}

        {post.model_url && (
          <section className="post-3d-section">
            <div className="post-3d-heading">
              <Box size={22} />
              <h2>Explore in 3D</h2>
            </div>

            <p>
              Rotate, zoom, and explore this creation
              from different perspectives.
            </p>

            <ModelViewer url={post.model_url} />

            <a
              className="model-source-link"
              href={post.model_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Original Model
              <ExternalLink size={16} />
            </a>
          </section>
        )}

        {/* VIDEO */}

        {post.video_url && (
          <div className="post-media-link">
            <Video size={22} />

            <div>
              <h3>Watch the Animation</h3>
              <p>Explore this motion design project.</p>
            </div>

            <a
              href={post.video_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open video in a new tab"
            >
              <ExternalLink size={20} />
            </a>
          </div>
        )}

        {/* CAPTCHA FOR NEW VISITORS */}

        {!authLoading && !currentUser && (
          <TurnstileCheck
            key={captchaResetKey}
            onTokenChange={setCaptchaToken}
          />
        )}

        {/* UPVOTE AND COMMENT COUNT */}

        <div className="post-interactions">
          <button
            type="button"
            className="upvote-button"
            onClick={handleUpvote}
            disabled={
              upvoting ||
              authLoading ||
              (!currentUser && !captchaToken)
            }
          >
            <ArrowUp size={21} />

            {upvoting ? "Voting..." : "Upvote"}

            <span>{post.upvotes ?? 0}</span>
          </button>

          <div className="comment-indicator">
            <MessageCircle size={19} />
            {comments.length} comments
          </div>
        </div>

        {/* CREATOR-ONLY EDIT AND DELETE */}

        {!authLoading && isOwner && (
          <div className="post-owner-actions">
            <Link
              to={`/edit/${post.id}`}
              className="edit-post-button"
            >
              <Pencil size={18} />
              Edit Post
            </Link>

            <button
              type="button"
              className="delete-post-button"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 size={18} />
              {deleting ? "Deleting..." : "Delete Post"}
            </button>
          </div>
        )}

      </article>

      {/* =====================================
          COMMENTS
          ===================================== */}

      <section className="comments-section">
        <div className="comments-heading">
          <MessageCircle size={23} />
          <h2>Creative Discussions</h2>
          <span>{comments.length}</span>
        </div>

        <p className="comments-intro">
          Share your thoughts, ask questions,
          and connect with other digital creators.
        </p>

        {/* ERROR MESSAGE */}

        {actionError && (
          <div className="form-error" role="alert">
            {actionError}
          </div>
        )}

        {/* COMMENT FORM */}

        <form
          className="comment-form"
          onSubmit={handleComment}
        >
          <label htmlFor="new-comment">
            Join the conversation
          </label>

          <textarea
            id="new-comment"
            value={commentText}
            onChange={(event) =>
              setCommentText(event.target.value)
            }
            placeholder="What do you think about this creation?"
            rows={4}
            required
          />

          <button
            type="submit"
            disabled={
              commenting ||
              authLoading ||
              !commentText.trim() ||
              (!currentUser && !captchaToken)
            }
          >
            <Send size={18} />

            {commenting
              ? "Posting..."
              : "Post Comment"}
          </button>
        </form>

        {/* COMMENT LIST */}

        <div className="comments-list">
          {comments.length === 0 ? (
            <div className="no-comments">
              <MessageCircle size={35} />

              <p>
                No comments yet.
                Start the conversation!
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                className="comment-card"
                key={comment.id}
              >
                <div className="comment-avatar">
                  XR
                </div>

                <div className="comment-body">
                  <div className="comment-info">
                    <strong>XR Creator</strong>

                    <span>
                      {new Date(
                        comment.created_at
                      ).toLocaleString()}
                    </span>
                  </div>

                  <p>{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </motion.main>
  );
}

export default PostDetails;
