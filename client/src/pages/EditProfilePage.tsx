import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';
import { useFormValidation } from '../hooks';
import ImageUpload from '../components/ImageUpload';
import api from '../services/api';
import type { User } from '../types';
import '../styles/EditProfilePage.css';

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [serverError, setServerError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const { values, errors, touched, handleChange, handleBlur, validateForm } =
    useFormValidation(
      { displayName: user?.displayName || '' },
      {
        displayName: { required: true, minLength: 2, maxLength: 50 },
      }
    );

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    setRemoveImage(false);
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setRemoveImage(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (values.displayName !== user?.displayName) {
        await api.put('/users/profile', { displayName: values.displayName });
      }

      if (selectedImage) {
        const photoForm = new FormData();
        photoForm.append('photoUrl', selectedImage);
        await api.post('/users/profile/photo', photoForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else if (removeImage) {
        await api.delete('/users/profile/photo');
      }

      const refreshed = await api.get<{ user: User }>('/users/profile');
      updateUser(refreshed.data.user);
      navigate('/profile');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; error?: string } } };
      setServerError(err.response?.data?.message || err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return <div className="edit-profile-loading">Loading...</div>;
  }

  return (
    <div className="edit-profile-page">
      <div className="edit-profile-container">
        <h1 className="edit-profile-title">Edit Profile</h1>

        {serverError && <div className="edit-profile-error">{serverError}</div>}

        <form onSubmit={handleSubmit} className="edit-profile-form">
          <ImageUpload
            currentImage={removeImage ? undefined : user.photoUrl}
            onImageSelect={handleImageSelect}
            onImageRemove={handleImageRemove}
            label="Profile Photo"
            maxSizeMB={5}
          />

          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={values.displayName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your display name"
              className={touched.displayName && errors.displayName ? 'input-error' : ''}
              disabled={isSubmitting}
            />
            {touched.displayName && errors.displayName && (
              <span className="field-error">{errors.displayName}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={user.email}
              disabled
              className="input-disabled"
            />
            <span className="field-hint">Email cannot be changed</span>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/profile')}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfilePage;
