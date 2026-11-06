
import { Link } from "react-router-dom";
import {
  ArrowUp,
  Clock3,
  ArrowUpRight,
} from "lucide-react";

function PostCard({ post }) {
  const createdAt = new Date(post.created_at);

  const formattedDate = createdAt.toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  return (
    <Link
      to={`/post/${post.id}`}
      className="post-card"
    >
      <div className="post-card-top">
        <span className="post-date">
          <Clock3 size={15} />
          {formattedDate}
        </span>
      </div>

      <h3>{post.title}</h3>

      <div className="post-card-bottom">
        <span className="upvote-count">
          <ArrowUp size={17} />
          {post.upvotes ?? 0} upvotes
        </span>

        <span className="post-arrow">
          <ArrowUpRight size={22} />
        </span>
      </div>
    </Link>
  );
}

export default PostCard;
