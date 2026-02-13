import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts';
import api from '../services/api';
import { Post } from '../types';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const response = await api.get<{ data: Post[] }>(`/posts/user/${user?._id}`);
        setPosts(response.data.data || []);
      } catch {
        setError('Failed to load posts');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?._id) {
      fetchUserPosts();
    }
  }, [user?._id]);

  if (!user) {
    return <div className="profile-loading">Loading...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar-section">
          {user.photoUrl ? (
            <img
              src={user.photoUrl}
              alt={user.displayName}
              className="profile-avatar"
            />
          ) : (
            <div className="profile-avatar-placeholder">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="profile-info">
          <h1 className="profile-name">{user.displayName}</h1>
          <p className="profile-email">{user.email}</p>
          <p className="profile-joined">
            Joined {new Date(user.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric'
            })}
          </p>

          <div className="profile-stats">
            <div className="stat">
              <span className="stat-value">{posts.length}</span>
              <span className="stat-label">Posts</span>
            </div>
          </div>

          <Link to="/profile/edit" className="edit-profile-btn">
            Edit Profile
          </Link>
        </div>
      </div>

      <div className="profile-content">
        <h2 className="section-title">My Posts</h2>

        {isLoading ? (
          <div className="posts-loading">Loading posts...</div>
        ) : error ? (
          <div className="posts-error">{error}</div>
        ) : posts.length === 0 ? (
          <div className="posts-empty">
            <p>You haven't created any posts yet.</p>
            <Link to="/posts/create" className="create-post-link">
              Create your first post
            </Link>
          </div>
        ) : (
          <div className="profile-posts-grid">
            {posts.map((post) => (
              <Link
                to={`/posts/${post._id}`}
                key={post._id}
                className="profile-post-card"
              >
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt={post.text.substring(0, 30)}
                    className="post-card-image"
                  />
                ) : (
                  <div className="post-card-text-preview">
                    <p>{post.text}</p>
                  </div>
                )}
                <div className="post-card-overlay">
                  <span className="post-stat">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    {post.likesCount}
                  </span>
                  <span className="post-stat">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" />
                    </svg>
                    {post.commentsCount}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
