import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { ImageUpload } from '../components';
import { useAuth } from '../contexts';
import { getUserId } from '../types';
import type { Post, User } from '../types';
import '../styles/CreatePostPage.css';

const EditPostPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [plantName, setPlantName] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await api.get(`/posts/${id}`);

        if (response.data.success) {
          const post: Post = response.data.data;
          const author = post.author as User;

          // Check if user is the owner
          if (!user || getUserId(user) !== getUserId(author)) {
            setUnauthorized(true);
            return;
          }

          setTitle(post.title);
          setContent(post.content);
          setPlantName(post.plantName || '');
          setTagsInput(post.tags?.join(', ') || '');
          setCurrentImage(post.image || null);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());

      if (plantName.trim()) {
        formData.append('plantName', plantName.trim());
      }

      if (tagsInput.trim()) {
        const tags = tagsInput
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
        formData.append('tags', JSON.stringify(tags));
      }

      if (newImage) {
        formData.append('image', newImage);
      } else if (removeImage) {
        formData.append('removeImage', 'true');
      }

      const response = await api.put(`/posts/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        navigate(`/posts/${id}`);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to update post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageSelect = (file: File) => {
    setNewImage(file);
    setRemoveImage(false);
  };

  const handleRemoveImage = () => {
    setCurrentImage(null);
    setNewImage(null);
    setRemoveImage(true);
  };

  if (isLoading) {
    return (
      <div className="create-post-page">
        <div className="create-post-container">
          <div className="loading">Loading post...</div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="create-post-page">
        <div className="create-post-container">
          <h1>Post not found</h1>
          <Link to="/feed">Back to Feed</Link>
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="create-post-page">
        <div className="create-post-container">
          <h1>Unauthorized</h1>
          <p>You can only edit your own posts.</p>
          <Link to="/feed">Back to Feed</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="create-post-page">
      <div className="create-post-container">
        <h1>Edit Post</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="create-post-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your post a title"
              maxLength={200}
              disabled={isSubmitting}
            />
            <span className="char-count">{title.length}/200</span>
          </div>

          <div className="form-group">
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, tips, or experiences..."
              rows={6}
              maxLength={5000}
              disabled={isSubmitting}
            />
            <span className="char-count">{content.length}/5000</span>
          </div>

          <div className="form-group">
            <label htmlFor="plantName">Plant Name (optional)</label>
            <input
              type="text"
              id="plantName"
              value={plantName}
              onChange={(e) => setPlantName(e.target.value)}
              placeholder="e.g., Monstera Deliciosa"
              maxLength={100}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags (optional)</label>
            <input
              type="text"
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g., indoor, tropical, beginner (comma-separated)"
              disabled={isSubmitting}
            />
            <span className="field-hint">Separate tags with commas</span>
          </div>

          <div className="form-section">
            <label>Image</label>
            {currentImage && !newImage && (
              <div className="current-image-preview">
                <img src={currentImage} alt="Current post image" />
                <button
                  type="button"
                  className="remove-image-button"
                  onClick={handleRemoveImage}
                >
                  Remove Image
                </button>
              </div>
            )}
            <ImageUpload
              onImageSelect={handleImageSelect}
              label={currentImage ? 'Replace image' : 'Add an image to your post'}
              maxSizeMB={10}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPostPage;
