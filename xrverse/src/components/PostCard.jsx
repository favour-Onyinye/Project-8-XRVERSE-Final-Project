
import { Link } from "react-router-dom";
import { ArrowUp, Clock3 } from "lucide-react";

function PostCard({ post }) {
  return (
    <Link to={`/post/${post.id}`} className="post-card">
      <div className="post-card-top">
        <span className="post-date">
          <Clock3 size={15} />
          {new Date(post.created_at).toLocaleDateString()}
        </span>
      </div>

      <h3>{post.title}</h3>

      <div className="post-card-bottom">
        <span className="upvote-count">
          <ArrowUp size={17} />
          {post.upvotes} upvotes
        </span>
        <span className="post-arrow">↗</span>
      </div>
    </Link>
  );
}

export default PostCard;
