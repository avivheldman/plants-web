import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Post, User } from '../types';
import { useAuth } from '../contexts';

interface PostCardProps {
  post: Post;
  onLikeUpdate?: (postId: string, liked: boolean, likesCount: number) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const PostCard = ({ post, onLikeUpdate }: PostCardProps) => {
  const { isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isLiking, setIsLiking] = useState(false);

  const author = typeof post.author === 'object' ? post.author : null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleLike = async () => {
    if (!isAuthenticated || isLiking) return;

    setIsLiking(true);
    const wasLiked = liked;
    const prevCount = likesCount;

    // Optimistic update
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);

    try {
      if (wasLiked) {
        await axios.delete(`${API_URL}/posts/${post._id}/like`);
      } else {
        await axios.post(`${API_URL}/posts/${post._id}/like`);
      }
      onLikeUpdate?.(post._id, !wasLiked, wasLiked ? prevCount - 1 : prevCount + 1);
    } catch (error) {
      // Revert on error
      setLiked(wasLiked);
      setLikesCount(prevCount);
      console.error('Failed to update like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <article className="post-card">
      <header className="post-header">
        <Link to={`/profile/${author?._id || ''}`} className="author-info">
          {author?.photoUrl ? (
            <img src={author.photoUrl} alt={author.displayName} className="author-avatar" />
          ) : (
            <div className="author-avatar-placeholder">
              {author?.displayName?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <div className="author-details">
            <span className="author-name">{author?.displayName || 'Unknown'}</span>
            <span className="post-date">{formatDate(post.createdAt)}</span>
          </div>
        </Link>
      </header>

      <Link to={`/posts/${post._id}`} className="post-content-link">
        <h2 className="post-title">{post.title}</h2>
        <p className="post-content">{post.content}</p>

        {post.image && (
          <div className="post-image-container">
            <img src={post.image} alt={post.title} className="post-image" />
          </div>
        )}

        {post.plantName && (
          <span className="plant-tag">{post.plantName}</span>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map((tag, index) => (
              <span key={index} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </Link>

      <footer className="post-footer">
        <button
          className={`like-button ${liked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={!isAuthenticated || isLiking}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={liked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span>{likesCount}</span>
        </button>

        <Link to={`/posts/${post._id}`} className="comments-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{post.commentsCount}</span>
        </Link>
      </footer>
    </article>
  );
};

export default PostCard;
