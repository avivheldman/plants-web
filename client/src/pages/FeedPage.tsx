import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { PostCard } from '../components';
import { Post } from '../types';
import '../styles/FeedPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const FeedPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchPosts = useCallback(async (pageNum: number) => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/posts?page=${pageNum}&limit=10`);

      if (response.data.success) {
        const newPosts = response.data.data;
        setPosts((prev) => (pageNum === 1 ? newPosts : [...prev, ...newPosts]));
        setHasMore(response.data.hasMore);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    fetchPosts(1);
  }, []);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setPage((prev) => {
            const nextPage = prev + 1;
            fetchPosts(nextPage);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, fetchPosts]);

  const handleLikeUpdate = (postId: string, liked: boolean, likesCount: number) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === postId ? { ...post, likesCount } : post
      )
    );
  };

  return (
    <div className="feed-page">
      <div className="feed-header">
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
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="feed-content">
        {posts.length === 0 && !isLoading ? (
          <div className="empty-feed">
            <h2>No posts yet</h2>
            <p>Be the first to share something with the community!</p>
            <Link to="/posts/create" className="create-first-post">
              Create a Post
            </Link>
          </div>
        ) : (
          <div className="posts-list">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} onLikeUpdate={handleLikeUpdate} />
            ))}
          </div>
        )}

        {isLoading && (
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <span>Loading posts...</span>
          </div>
        )}

        {hasMore && !isLoading && <div ref={loadMoreRef} className="load-more-trigger" />}

        {!hasMore && posts.length > 0 && (
          <div className="end-of-feed">
            <p>You've reached the end of the feed</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedPage;
