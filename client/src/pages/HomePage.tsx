import { Link } from 'react-router-dom';
import { useAuth } from '../contexts';
import FeedPage from './FeedPage';

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <FeedPage />;
  }

  return (
    <div className="home-page">
      <h1>Welcome to Plants Web</h1>
      <p>Discover and share your favorite plants with our community.</p>
      <div className="home-cta">
        <Link to="/login" className="home-cta-button">Log in</Link>
        <Link to="/register" className="home-cta-button home-cta-secondary">Sign up</Link>
      </div>
    </div>
  );
};

export default HomePage;
