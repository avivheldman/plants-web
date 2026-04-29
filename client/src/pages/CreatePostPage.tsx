import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ImageUpload } from '../components';
import '../styles/CreatePostPage.css';

const CreatePostPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [plantName, setPlantName] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [suggestError, setSuggestError] = useState<string | null>(null);

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
        tags.forEach((tag) => formData.append('tags', tag));
      }
      if (image) {
        formData.append('image', image);
      }

      const response = await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        navigate(`/posts/${response.data.data._id}`);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestTags = async () => {
    if (!title.trim() || !content.trim()) {
      setSuggestError('Add a title and content first');
      return;
    }
    setSuggesting(true);
    setSuggestError(null);
    try {
      const res = await api.post<{ success: boolean; data: { summary: string; suggestedTags: string[] } }>(
        '/search/analyze',
        { title: title.trim(), content: content.trim() }
      );
      setSuggestedTags(res.data.data.suggestedTags || []);
    } catch {
      setSuggestError('Could not suggest tags right now. Try again.');
    } finally {
      setSuggesting(false);
    }
  };

  const addSuggestedTag = (tag: string) => {
    const current = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    if (current.includes(tag)) return;
    const next = [...current, tag].join(', ');
    setTagsInput(next);
    setSuggestedTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleImageSelect = (file: File) => {
    setImage(file);
  };

  return (
    <div className="create-post-page">
      <div className="create-post-container">
        <h1>Create New Post</h1>

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
            <div className="tags-input-row">
              <input
                type="text"
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g., indoor, tropical, beginner (comma-separated)"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="suggest-tags-btn"
                onClick={handleSuggestTags}
                disabled={suggesting || !title.trim() || !content.trim()}
                title="Use AI to suggest tags from your title and content"
              >
                {suggesting ? '…' : '✨ Suggest tags'}
              </button>
            </div>
            <span className="field-hint">Separate tags with commas</span>
            {suggestError && <span className="field-error">{suggestError}</span>}
            {suggestedTags.length > 0 && (
              <div className="suggested-tags">
                <span className="suggested-tags-label">Suggested:</span>
                {suggestedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="suggested-tag-chip"
                    onClick={() => addSuggestedTag(tag)}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="form-section">
            <label>Image (optional)</label>
            <ImageUpload
              onImageSelect={handleImageSelect}
              label="Add an image to your post"
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
              {isSubmitting ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostPage;
