import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts';
import { PostCard } from '../components';
import { Post } from '../types';
import '../styles/ProfilePage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const ProfilePage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!user?._id) return;

      try {
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/posts/user/${user._id}`);
        if (response.data.success) {
          setPosts(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching user posts:', err);
        setError('Failed to load posts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserPosts();
  }, [user?._id]);

  const handleLikeUpdate = (postId: string, liked: boolean, likesCount: number) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === postId ? { ...post, likesCount } : post
      )
    );
  };

  if (!user) {
    return (
      <div className="profile-page">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar-container">
          {user.photoUrl ? (
            <img src={user.photoUrl} alt={user.displayName} className="profile-avatar" />
          ) : (
            <div className="profile-avatar-placeholder">
              {user.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>

        <div className="profile-info">
          <h1 className="profile-name">{user.displayName}</h1>
          <p className="profile-email">{user.email}</p>
          <p className="profile-joined">
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>

        <Link to="/profile/edit" className="edit-profile-button">
          Edit Profile
        </Link>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <div className="section-header">
            <h2>My Posts</h2>
            <span className="post-count">{posts.length} posts</span>
          </div>

          {isLoading ? (
            <div className="loading">Loading posts...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : posts.length === 0 ? (
            <div className="no-posts">
              <p>You haven't created any posts yet.</p>
              <Link to="/posts/create" className="create-post-link">
                Create your first post
              </Link>
            </div>
          ) : (
            <div className="posts-grid">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} onLikeUpdate={handleLikeUpdate} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
