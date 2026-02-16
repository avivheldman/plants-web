import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Post } from '../types';
import { PostCard } from '../components';
import api from '../services/api';
import '../styles/FeedPage.css';

const FeedPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  const fetchPosts = useCallback(async (pageNum: number) => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(`/posts?page=${pageNum}&limit=10`);

      if (response.data.success) {
        const newPosts = response.data.data;

        if (pageNum === 1) {
          setPosts(newPosts);
        } else {
          setPosts((prev) => [...prev, ...newPosts]);
        }

        setHasMore(response.data.hasMore ?? newPosts.length === 10);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please try again.');
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, [isLoading]);

  // Initial fetch
  useEffect(() => {
    fetchPosts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchPosts(page + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreTriggerRef.current) {
      observerRef.current.observe(loadMoreTriggerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, page, fetchPosts]);

  const handleLikeUpdate = (postId: string, liked: boolean, newCount: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId ? { ...p, likesCount: newCount } : p
      )
    );
  };

  if (isInitialLoad) {
    return (
      <div className="feed-page">
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <span>Loading feed...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-page">
      <header className="feed-header">
        <h1>Plant Feed</h1>
        <Link to="/posts/create" className="create-post-button">
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
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Post
        </Link>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="feed-content">
        {posts.length === 0 ? (
          <div className="empty-feed">
            <h2>No posts yet</h2>
            <p>Be the first to share something about your plants!</p>
            <Link to="/posts/create" className="create-first-post">
              Create your first post
            </Link>
          </div>
        ) : (
          <div className="posts-list">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onLikeUpdate={handleLikeUpdate}
              />
            ))}
          </div>
        )}

        {/* Infinite scroll trigger */}
        {hasMore && posts.length > 0 && (
          <div ref={loadMoreTriggerRef} className="load-more-trigger">
            {isLoading && (
              <div className="loading-indicator">
                <div className="loading-spinner"></div>
                <span>Loading more...</span>
              </div>
            )}
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <div className="end-of-feed">
            You've reached the end of the feed
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedPage;
