
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
  Lock,
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";
import ModelViewer from "../components/ModelViewer";
import PrivatePostMedia from "../components/PrivatePostMedia";

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

  const [commentText, setCommentText] = useState("");

  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  // =====================================
  // 1. IDENTIFY CURRENT USER
  // =====================================

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      try {
        const { data, error: authError } =
          await supabase.auth.getUser();

        if (!active) return;

        if (authError) {
          setCurrentUser(null);
        } else {
          setCurrentUser(data.user ?? null);
        }
      } catch (err) {
        console.error("XRVERSE auth error:", err);

        if (active) {
          setCurrentUser(null);
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return;

        setCurrentUser(session?.user ?? null);
        setAuthLoading(false);
      }
    );

    loadCurrentUser();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // =====================================
  // 2. LOAD POST AND COMMENTS
  // =====================================

  useEffect(() => {
    let active = true;

    async function loadPost() {
      setLoading(true);
      setError("");
      setPost(null);
      setComments([]);

      try {
        const {
          data: postData,
          error: postError,
        } = await supabase
          .from("posts")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (postError) throw postError;

        if (!postData) {
          throw new Error(
            "Post not found or you do not have permission to view it."
          );
        }

        const {
          data: commentData,
          error: commentError,
        } = await supabase
          .from("comments")
          .select(
            "id, content, created_at, user_id"
          )
          .eq("post_id", id)
          .order("created_at", {
            ascending: true,
          });

        if (commentError) throw commentError;

        if (active) {
          setPost(postData);
          setComments(commentData || []);
        }
      } catch (err) {
        console.error("XRVERSE post loading error:", err);

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
  }, [id, currentUser?.id]);

  // =====================================
  // 3. REGISTERED ACCOUNT AND OWNERSHIP
  // =====================================

  const isRegistered =
    Boolean(currentUser?.id) &&
    currentUser.is_anonymous !== true;

  const isOwner =
    isRegistered &&
    Boolean(post?.user_id) &&
    currentUser.id === post.user_id;

  const isPrivate = post?.visibility === "private";

  // =====================================
  // 4. REQUIRE REGISTERED ACCOUNT
  // =====================================

  async function requireRegisteredUser() {
    const {
      data,
      error: authError,
    } = await supabase.auth.getUser();

    const user = data?.user;

    if (
      authError ||
      !user ||
      user.is_anonymous === true
    ) {
      throw new Error(
        "Please log in with your registered XRVERSE account."
      );
    }

    setCurrentUser(user);

    return user;
  }

  // =====================================
  // 5. UPVOTE POST
  // =====================================

  async function handleUpvote() {
    if (
      !post ||
      upvoting ||
      !isRegistered
    ) {
      return;
    }

    setUpvoting(true);
    setActionError("");

    try {
      await requireRegisteredUser();

      const {
        data,
        error: voteError,
      } = await supabase.rpc("upvote_post", {
        target_post_id: post.id,
      });

      if (voteError) throw voteError;

      if (typeof data === "number") {
        setPost((previous) => {
          if (!previous) return previous;

          return {
            ...previous,
            upvotes: data,
          };
        });
      }
    } catch (err) {
      console.error("XRVERSE upvote error:", err);

      setActionError(
        err.message || "Unable to upvote this post."
      );
    } finally {
      setUpvoting(false);
    }
  }

  // =====================================
  // 6. ADD COMMENT
  // =====================================

  async function handleComment(event) {
    event.preventDefault();

    if (
      !post ||
      !commentText.trim() ||
      commenting ||
      !isRegistered
    ) {
      return;
    }

    setCommenting(true);
    setActionError("");

    try {
      const user = await requireRegisteredUser();

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
        .select(
          "id, content, created_at, user_id"
        )
        .single();

      if (commentError) throw commentError;

      setComments((previous) => [
        ...previous,
        data,
      ]);

      setCommentText("");
    } catch (err) {
      console.error("XRVERSE comment error:", err);

      setActionError(
        err.message || "Unable to post your comment."
      );
    } finally {
      setCommenting(false);
    }
  }

  // =====================================
  // 7. DELETE POST — OWNER ONLY
  // =====================================

  async function handleDelete() {
    if (
      !post ||
      deleting ||
      !isOwner
    ) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to permanently delete " +
      "this post? This action cannot be undone."
    );

    if (!confirmed) return;

    setDeleting(true);
    setActionError("");

    try {
      const user = await requireRegisteredUser();

      if (user.id !== post.user_id) {
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
          "The post was not deleted. Check your account permissions."
        );
      }

      navigate("/");
    } catch (err) {
      console.error("XRVERSE delete error:", err);

      setActionError(
        err.message || "Unable to delete this post."
      );
    } finally {
      setDeleting(false);
    }
  }

  // =====================================
  // 8. LOADING STATE
  // =====================================

  if (loading || authLoading) {
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

        <p>
          {error || "Post not found."}
        </p>

        <Link
          to="/"
          className="primary-button"
        >
          Return to Community
        </Link>
      </main>
    );
  }

  // =====================================
  // 10. FORMAT DATE
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

      <Link
        to="/"
        className="details-back-link"
      >
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

        {/* VISIBILITY */}

        {isPrivate && isOwner && (
          <p className="media-description">
            <Lock size={16} />
            Private Post — Only your account can view
            this post.
          </p>
        )}

        {/* DESCRIPTION */}

        {post.content && (
          <div className="post-description">
            <p>{post.content}</p>
          </div>
        )}

        {/* PUBLIC ARTWORK IMAGE */}

        {!isPrivate && post.image_url && (
          <div className="post-artwork">
            <img
              src={post.image_url}
              alt={`Artwork for ${post.title}`}
              loading="lazy"
            />
          </div>
        )}

        {/* PUBLIC INTERACTIVE 3D MODEL */}

        {!isPrivate && post.model_url && (
          <section className="post-3d-section">
            <div className="post-3d-heading">
              <Box size={22} />
              <h2>Explore in 3D</h2>
            </div>

            <p>
              Rotate, zoom, and explore this
              creation from different perspectives.
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

        {/* PRIVATE ARTWORK — OWNER ONLY */}

        {isPrivate && isOwner && (
          <PrivatePostMedia
            imagePath={post.private_image_path}
            modelPath={post.private_model_path}
            title={post.title}
          />
        )}

        {/* PUBLIC VIDEO */}

        {!isPrivate && post.video_url && (
          <div className="post-media-link">
            <Video size={22} />

            <div>
              <h3>Watch the Animation</h3>
              <p>
                Explore this motion design project.
              </p>
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

        {/* UPVOTES AND COMMENT COUNT */}

        <div className="post-interactions">
          <button
            type="button"
            className="upvote-button"
            onClick={handleUpvote}
            disabled={
              upvoting ||
              !isRegistered
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

        {isOwner && (
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
              {deleting
                ? "Deleting..."
                : "Delete Post"}
            </button>
          </div>
        )}

        {/* GUEST MESSAGE */}

        {!isRegistered && (
          <p className="media-description">
            Want to participate in XRVERSE?{" "}
            <Link to="/login">Log In</Link>
            {" or "}
            <Link to="/signup">
              Create an Account
            </Link>
            .
          </p>
        )}

        {/* ACTION ERROR */}

        {actionError && (
          <div
            className="form-error"
            role="alert"
          >
            {actionError}
          </div>
        )}

      </article>

      {/* =====================================
          COMMENTS SECTION
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

        {/* COMMENT FORM — REGISTERED USERS */}

        {isRegistered && (
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
                !commentText.trim()
              }
            >
              <Send size={18} />

              {commenting
                ? "Posting..."
                : "Post Comment"}
            </button>
          </form>
        )}

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
