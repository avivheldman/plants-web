import { useState, useRef } from 'react';
import '../styles/ImageUpload.css';

interface ImageUploadProps {
  currentImage?: string;
  onImageSelect: (file: File) => void;
  onImageRemove?: () => void;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
}

const ImageUpload = ({
  currentImage,
  onImageSelect,
  onImageRemove,
  label = 'Upload Image',
  accept = 'image/*',
  maxSizeMB = 5,
}: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return false;
    }

    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`Image must be less than ${maxSizeMB}MB`);
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (!validateFile(file)) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    onImageSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleRemove = () => {
    setPreview(null);
    setError('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onImageRemove?.();
  };

  const displayImage = preview || currentImage;

  return (
    <div className="image-upload">
      <label className="image-upload-label">{label}</label>

      <div
        className={`image-upload-area ${isDragging ? 'dragging' : ''} ${displayImage ? 'has-image' : ''}`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="image-upload-input"
        />

        {displayImage ? (
          <div className="image-preview-container">
            <img src={displayImage} alt="Preview" className="image-preview" />
            <div className="image-overlay">
              <span>Click to change</span>
            </div>
          </div>
        ) : (
          <div className="image-upload-placeholder">
            <svg
              className="upload-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p>Drag and drop or click to upload</p>
            <span className="upload-hint">Max size: {maxSizeMB}MB</span>
          </div>
        )}
      </div>

      {error && <span className="image-upload-error">{error}</span>}

      {displayImage && onImageRemove && (
        <button
          type="button"
          className="image-remove-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
        >
          Remove Image
        </button>
      )}
    </div>
  );
};

export default ImageUpload;
