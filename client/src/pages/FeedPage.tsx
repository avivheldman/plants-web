import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts';
import { getUserId } from '../types';
import type { Post, User, PaginatedResponse } from '../types';
import '../styles/FeedPage.css';

const PAGE_SIZE = 10;

const FeedPage = () => {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadPage = useCallback(async (nextPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PaginatedResponse<Post>>(
        `/posts?page=${nextPage}&limit=${PAGE_SIZE}`
      );
      setPosts((prev) => (nextPage === 1 ? res.data.data : [...prev, ...res.data.data]));
      setHasMore(res.data.hasMore);
      setPage(nextPage);
    } catch (e) {
      console.error(e);
      setError('Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadPage(page + 1);
      },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, page, loadPage]);

  return (
    <div className="feed-page">
      <header className="feed-header">
        <h1>Feed</h1>
        {isAuthenticated && (
          <Link to="/posts/create" className="create-post-button">+ New Post</Link>
        )}
      </header>

      {error && <div className="posts-error">{error}</div>}

      {posts.length === 0 && !loading && !error ? (
        <div className="empty-feed">
          <p>No posts yet.</p>
          {isAuthenticated && (
            <Link to="/posts/create" className="create-first-post">Create the first post</Link>
          )}
        </div>
      ) : (
        <ul className="posts-list">
          {posts.map((post) => {
            const author = typeof post.author === 'object' ? (post.author as User) : null;
            const authorId = author ? getUserId(author) : '';
            const postId = post._id;
            return (
              <li key={postId} className="post-card">
                <header className="post-header">
                  <Link to={`/profile/${authorId}`} className="author-info">
                    {author?.photoUrl ? (
                      <img src={author.photoUrl} alt={author.displayName} className="author-avatar" />
                    ) : (
                      <div className="author-avatar-placeholder">
                        {author?.displayName?.charAt(0).toUpperCase() ?? '?'}
                      </div>
                    )}
                    <div className="author-details">
                      <span className="author-name">{author?.displayName ?? 'Unknown'}</span>
                      <span className="post-date">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                </header>

                <Link to={`/posts/${postId}`} className="post-content-link">
                  <h2 className="post-title">{post.title}</h2>
                  {post.image && (
                    <div className="post-image-container">
                      <img src={post.image} alt={post.title} className="post-image" />
                    </div>
                  )}
                  <p className="post-content">{post.content}</p>
                  {post.plantName && <span className="plant-tag">🌱 {post.plantName}</span>}
                  {post.tags && post.tags.length > 0 && (
                    <div className="post-tags">
                      {post.tags.map((t) => (
                        <span key={t} className="tag">#{t}</span>
                      ))}
                    </div>
                  )}
                </Link>

                <footer className="post-footer">
                  <span className="like-button" aria-label="likes">
                    ❤ {post.likesCount ?? 0}
                  </span>
                  <Link to={`/posts/${postId}`} className="comments-button">
                    💬 {post.commentsCount ?? 0}
                  </Link>
                </footer>
              </li>
            );
          })}
        </ul>
      )}

      {loading && (
        <div className="loading-indicator">
          <div className="loading-spinner" />
        </div>
      )}

      {hasMore && !loading && <div ref={sentinelRef} className="load-more-trigger" />}
      {!hasMore && posts.length > 0 && <div className="end-of-feed">You&apos;re all caught up.</div>}
    </div>
  );
};

export default FeedPage;
