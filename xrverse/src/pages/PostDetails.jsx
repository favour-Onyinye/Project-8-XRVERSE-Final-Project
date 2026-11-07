
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";

function PostDetails() {
  const { id } = useParams();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  // Retrieve the post and its comments.
  const fetchPost = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data: postData, error: postError } =
        await supabase
          .from("posts")
          .select("*")
          .eq("id", id)
          .single();

      if (postError) throw postError;

      const { data: commentData, error: commentError } =
        await supabase
          .from("comments")
          .select("id, content, created_at, user_id")
          .eq("post_id", id)
          .order("created_at", { ascending: true });

      if (commentError) throw commentError;

      setPost(postData);
      setComments(commentData || []);
    } catch (err) {
      console.error("Error loading post:", err);
      setError(err.message || "Unable to load this post.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // Create an anonymous session if necessary.
 
const getCurrentUser = async () => {
  // Step 1: Check whether a session already exists.
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) throw sessionError;

  // Step 2: If there is no session, sign in anonymously.
  if (!sessionData.session) {
    const { data: authData, error: authError } =
      await supabase.auth.signInAnonymously();

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error("Unable to create anonymous user.");
    }

    return authData.user;
  }

    // Step 3: Verify the existing user.
    const { data: userData, error: userError } =
        await supabase.auth.getUser();

    if (userError) throw userError;

    if (!userData.user) {
        throw new Error("Unable to verify user session.");
    }

    return userData.user;
    };


  // Each click increases the count by one.
  const handleUpvote = async () => {
    if (!post || upvoting) return;

    setUpvoting(true);
    setActionError("");

    try {
      await getCurrentUser();

      const { data, error: voteError } =
        await supabase.rpc("upvote_post", {
          target_post_id: post.id,
        });

      if (voteError) throw voteError;

      setPost((previous) => ({
        ...previous,
        upvotes: data,
      }));
    } catch (err) {
      console.error("Upvote error:", err);
      setActionError(
        err.message || "Unable to upvote this post."
      );
    } finally {
      setUpvoting(false);
    }
  };

  // Add a new community comment.
  const handleComment = async (event) => {
    event.preventDefault();

    if (!commentText.trim() || commenting) return;

    setCommenting(true);
    setActionError("");

    try {
      const user = await getCurrentUser();

      const { data, error: commentError } =
        await supabase
          .from("comments")
          .insert({
            post_id: post.id,
            user_id: user.id,
            content: commentText.trim(),
          })
          .select("id, content, created_at, user_id")
          .single();

      if (commentError) throw commentError;

      setComments((previous) => [...previous, data]);
      setCommentText("");
    } catch (err) {
      console.error("Comment error:", err);
      setActionError(
        err.message || "Unable to post comment."
      );
    } finally {
      setCommenting(false);
    }
  };

  if (loading) {
    return (
      <main className="post-details-loading" role="status">
        <div className="xr-loader" />
        <p>Loading your creative universe...</p>
      </main>
    );
  }

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

  const formattedDate = new Date(
    post.created_at
  ).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <motion.main
      className="post-details-page"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Link to="/" className="details-back-link">
        <ArrowLeft size={18} />
        Back to Community
      </Link>

      <article className="post-details-card">
        <div className="post-details-category">
          <Sparkles size={15} />
          {post.category || "General"}
        </div>

        <h1>{post.title}</h1>

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

        {/* FULL POST DESCRIPTION */}
        {post.content && (
          <div className="post-description">
            <p>{post.content}</p>
          </div>
        )}

        {/* ARTWORK IMAGE */}
        {post.image_url && (
          <div className="post-artwork">
            <img
              src={post.image_url}
              alt={`Artwork for ${post.title}`}
              loading="lazy"
            />
          </div>
        )}

        {/* 3D MODEL LINK */}
        {post.model_url && (
          <div className="post-media-link">
            <Box size={22} />

            <div>
              <h3>Explore the 3D Model</h3>
              <p>View the creator's 3D artwork.</p>
            </div>

            <a
              href={post.model_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open 3D model in a new tab"
            >
              <ExternalLink size={20} />
            </a>
          </div>
        )}

        {/* VIDEO LINK */}
        {post.video_url && (
          <div className="post-media-link">
            <Video size={22} />

            <div>
              <h3>Watch the Animation</h3>
              <p>Discover this motion design project.</p>
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

        {/* UPVOTE BUTTON */}
        <div className="post-interactions">
          <button
            type="button"
            className="upvote-button"
            onClick={handleUpvote}
            disabled={upvoting}
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
      </article>

      {/* COMMENTS SECTION */}
      <section className="comments-section">
        <div className="comments-heading">
          <MessageCircle size={23} />

          <h2>Creative Discussions</h2>

          <span>{comments.length}</span>
        </div>

        <p className="comments-intro">
          Share your thoughts, ask questions, and
          connect with other digital creators.
        </p>

        {actionError && (
          <div className="form-error" role="alert">
            {actionError}
          </div>
        )}

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
            disabled={commenting || !commentText.trim()}
          >
            <Send size={18} />
            {commenting ? "Posting..." : "Post Comment"}
          </button>
        </form>

        <div className="comments-list">
          {comments.length === 0 ? (
            <div className="no-comments">
              <MessageCircle size={35} />
              <p>
                No comments yet. Start the conversation!
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
