import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';
import { useFormValidation } from '../hooks';
import '../styles/AuthPages.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, googleLogin, isAuthenticated } = useAuth();
  const [serverError, setServerError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { values, errors, touched, handleChange, handleBlur, validateForm } =
    useFormValidation(
      { displayName: '', email: '', password: '', confirmPassword: '' },
      {
        displayName: { required: true, minLength: 2, maxLength: 50 },
        email: { required: true, email: true },
        password: { required: true, minLength: 6 },
        confirmPassword: { required: true },
      }
    );

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/feed');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) return;

    if (values.password !== values.confirmPassword) {
      setServerError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(values.email, values.password, values.displayName);
      navigate('/feed');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join our plant community</p>

        {serverError && <div className="auth-error">{serverError}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={values.displayName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your name"
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
              name="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your email"
              className={touched.email && errors.email ? 'input-error' : ''}
              disabled={isSubmitting}
            />
            {touched.email && errors.email && (
              <span className="field-error">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Create a password"
              className={touched.password && errors.password ? 'input-error' : ''}
              disabled={isSubmitting}
            />
            {touched.password && errors.password && (
              <span className="field-error">{errors.password}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={values.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Confirm your password"
              className={touched.confirmPassword && errors.confirmPassword ? 'input-error' : ''}
              disabled={isSubmitting}
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <span className="field-error">{errors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        <div className="oauth-buttons">
          <button
            type="button"
            className="oauth-button google"
            onClick={googleLogin}
            disabled={isSubmitting}
          >
            <svg viewBox="0 0 24 24" className="oauth-icon">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>
        </div>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
