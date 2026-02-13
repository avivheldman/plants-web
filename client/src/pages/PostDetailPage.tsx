import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts';
import { Post, Comment, User } from '../types';
import '../styles/PostDetailPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true);
        const [postResponse, commentsResponse] = await Promise.all([
          axios.get(`${API_URL}/posts/${id}`),
          axios.get(`${API_URL}/posts/${id}/comments?page=1&limit=20`),
        ]);

        if (postResponse.data.success) {
          setPost(postResponse.data.data);
          setLikesCount(postResponse.data.data.likesCount);
        }

        if (commentsResponse.data.success) {
          setComments(commentsResponse.data.data);
          setHasMoreComments(commentsResponse.data.hasMore);
        }

        // Check if user liked the post
        if (isAuthenticated) {
          try {
            const likeResponse = await axios.get(`${API_URL}/posts/${id}/liked`);
            setLiked(likeResponse.data.liked);
          } catch {
            // Ignore error
          }
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load post');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id, isAuthenticated]);

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
        await axios.delete(`${API_URL}/posts/${id}/like`);
      } else {
        await axios.post(`${API_URL}/posts/${id}/like`);
      }
    } catch {
      // Revert on error
      setLiked(wasLiked);
      setLikesCount(prevCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const response = await axios.post(`${API_URL}/posts/${id}/comments`, {
        text: commentText.trim(),
      });

      if (response.data.success) {
        setComments((prev) => [response.data.data, ...prev]);
        setCommentText('');
        if (post) {
          setPost({ ...post, commentsCount: post.commentsCount + 1 });
        }
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await axios.delete(`${API_URL}/posts/${id}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      if (post) {
        setPost({ ...post, commentsCount: Math.max(0, post.commentsCount - 1) });
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const loadMoreComments = async () => {
    try {
      const nextPage = commentsPage + 1;
      const response = await axios.get(
        `${API_URL}/posts/${id}/comments?page=${nextPage}&limit=20`
      );

      if (response.data.success) {
        setComments((prev) => [...prev, ...response.data.data]);
        setCommentsPage(nextPage);
        setHasMoreComments(response.data.hasMore);
      }
    } catch (err) {
      console.error('Error loading more comments:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await axios.delete(`${API_URL}/posts/${id}`);
      navigate('/feed');
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="post-detail-page">
        <div className="loading">Loading post...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="post-detail-page">
        <div className="error">{error || 'Post not found'}</div>
        <Link to="/feed" className="back-link">
          Back to Feed
        </Link>
      </div>
    );
  }

  const author = typeof post.author === 'object' ? post.author as User : null;
  const isOwner = user && author && user._id === author._id;

  return (
    <div className="post-detail-page">
      <div className="post-detail-container">
        <article className="post-detail">
          <header className="post-detail-header">
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

            {isOwner && (
              <div className="post-actions">
                <Link to={`/posts/${post._id}/edit`} className="edit-button">
                  Edit
                </Link>
                <button onClick={handleDelete} className="delete-button">
                  Delete
                </button>
              </div>
            )}
          </header>

          <h1 className="post-title">{post.title}</h1>

          {post.image && (
            <div className="post-image-container">
              <img src={post.image} alt={post.title} className="post-image" />
            </div>
          )}

          <div className="post-content">{post.content}</div>

          {post.plantName && <span className="plant-tag">{post.plantName}</span>}

          {post.tags && post.tags.length > 0 && (
            <div className="post-tags">
              {post.tags.map((tag, index) => (
                <span key={index} className="tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <footer className="post-detail-footer">
            <button
              className={`like-button ${liked ? 'liked' : ''}`}
              onClick={handleLike}
              disabled={!isAuthenticated || isLiking}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill={liked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>{likesCount} likes</span>
            </button>
            <span className="comments-count">{post.commentsCount} comments</span>
          </footer>
        </article>

        <section className="comments-section">
          <h2>Comments</h2>

          {isAuthenticated ? (
            <form onSubmit={handleCommentSubmit} className="comment-form">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                maxLength={1000}
                disabled={isSubmittingComment}
              />
              <button type="submit" disabled={!commentText.trim() || isSubmittingComment}>
                {isSubmittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          ) : (
            <p className="login-prompt">
              <Link to="/login">Log in</Link> to leave a comment.
            </p>
          )}

          <div className="comments-list">
            {comments.length === 0 ? (
              <p className="no-comments">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment) => {
                const commentAuthor = comment.author as User | undefined;
                const isCommentOwner = user && commentAuthor && user._id === commentAuthor._id;

                return (
                  <div key={comment._id} className="comment">
                    <div className="comment-header">
                      <Link
                        to={`/profile/${commentAuthor?._id || ''}`}
                        className="comment-author"
                      >
                        {commentAuthor?.photoUrl ? (
                          <img
                            src={commentAuthor.photoUrl}
                            alt={commentAuthor.displayName}
                            className="comment-avatar"
                          />
                        ) : (
                          <div className="comment-avatar-placeholder">
                            {commentAuthor?.displayName?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                        <span>{commentAuthor?.displayName || 'Unknown'}</span>
                      </Link>
                      <span className="comment-date">{formatDate(comment.createdAt)}</span>
                      {isCommentOwner && (
                        <button
                          className="delete-comment"
                          onClick={() => handleDeleteComment(comment._id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="comment-text">{comment.text}</p>
                  </div>
                );
              })
            )}
          </div>

          {hasMoreComments && (
            <button onClick={loadMoreComments} className="load-more-comments">
              Load more comments
            </button>
          )}
        </section>
      </div>
    </div>
  );
};

export default PostDetailPage;
