import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts';
import { getUserId } from '../types';
import type { Post, User, PaginatedResponse } from '../types';
import '../styles/FeedPage.css';

type SearchPost = Post & {
  _matchedKeywords?: string[];
  _matchScore?: number;
  _aiReason?: string;
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlightMatches = (text: string, keywords: string[] | undefined): ReactNode => {
  if (!keywords?.length || !text) return text;
  const sorted = [...keywords].sort((a, b) => b.length - a.length);
  const pattern = sorted.map((k) => `\\b${escapeRe(k)}\\b`).join('|');
  const parts = text.split(new RegExp(`(${pattern})`, 'gi'));
  return parts.map((part, i) =>
    sorted.some((k) => k.toLowerCase() === part.toLowerCase())
      ? <mark key={i}>{part}</mark>
      : <span key={i}>{part}</span>
  );
};

const PAGE_SIZE = 10;

const FeedPage = () => {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchPost[] | null>(null);
  const [searching, setSearching] = useState(false);

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
    if (searchResults !== null) return;
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
  }, [hasMore, loading, page, loadPage, searchResults]);

  const cancelSearch = () => {
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
      searchAbortRef.current = null;
    }
    setSearching(false);
  };

  const runSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    cancelSearch();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setSearching(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: SearchPost[]; query: string }>(
        `/search?q=${encodeURIComponent(trimmed)}&limit=50`,
        { signal: controller.signal }
      );
      setSearchResults(res.data.data);
      setSearchQuery(trimmed);
    } catch (e: unknown) {
      if ((e as { name?: string }).name === 'CanceledError' || (e as { name?: string }).name === 'AbortError') return;
      console.error(e);
      setError('Search failed. Try again.');
    } finally {
      if (searchAbortRef.current === controller) {
        searchAbortRef.current = null;
        setSearching(false);
      }
    }
  };

  const clearSearch = () => {
    cancelSearch();
    setSearchInput('');
    setSearchQuery('');
    setSearchResults(null);
  };

  const displayPosts = searchResults ?? posts;

  return (
    <div className={`feed-page${searchResults !== null ? ' search-active' : ''}`}>
      <header className="feed-header">
        <h1>Feed</h1>
        {isAuthenticated && (
          <Link to="/posts/create" className="create-post-button">+ New Post</Link>
        )}
      </header>

      <form
        className="feed-search"
        onSubmit={(e) => { e.preventDefault(); runSearch(searchInput); }}
      >
        <input
          type="search"
          className="feed-search-input"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search posts with AI — e.g. 'plants for low light'"
          maxLength={200}
        />
        {searching ? (
          <button type="button" className="cancel-search-btn" onClick={cancelSearch}>
            Cancel
          </button>
        ) : (
          <button type="submit" className="feed-search-btn" disabled={!searchInput.trim()}>
            Search
          </button>
        )}
        {searchResults !== null && !searching && (
          <button type="button" className="clear-search-btn" onClick={clearSearch}>
            Clear
          </button>
        )}
      </form>

      {searchResults !== null && (
        <div className="search-results-header">
          {searchResults.length} result{searchResults.length === 1 ? '' : 's'} for &ldquo;{searchQuery}&rdquo;
        </div>
      )}

      {error && <div className="posts-error">{error}</div>}

      {displayPosts.length === 0 && !loading && !searching && !error ? (
        <div className="empty-feed">
          <p>{searchResults !== null ? 'No matching posts.' : 'No posts yet.'}</p>
          {searchResults === null && isAuthenticated && (
            <Link to="/posts/create" className="create-first-post">Create the first post</Link>
          )}
        </div>
      ) : (
        <ul className="posts-list">
          {displayPosts.map((post) => {
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
                  <h2 className="post-title">
                    {searchResults
                      ? highlightMatches(post.title, (post as SearchPost)._matchedKeywords)
                      : post.title}
                  </h2>
                  {searchResults !== null && (() => {
                    const sp = post as SearchPost;
                    const score = sp._matchScore ?? 0;
                    if (score === 0) return null;
                    const tier = score >= 75 ? 'tier-high' : score >= 62 ? 'tier-medium' : 'tier-low';
                    const label = score >= 75 ? 'Strong match' : score >= 62 ? 'Good match' : 'Partial match';
                    return (
                      <>
                        <div className={`search-match-badge ${tier}`}>
                          🔍 {label} · {score}%
                        </div>
                        {sp._aiReason && <span className="ai-reason">✨ {sp._aiReason}</span>}
                      </>
                    );
                  })()}
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

      {hasMore && !loading && searchResults === null && <div ref={sentinelRef} className="load-more-trigger" />}
      {!hasMore && posts.length > 0 && searchResults === null && <div className="end-of-feed">You&apos;re all caught up.</div>}
    </div>
  );
};

export default FeedPage;
