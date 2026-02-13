import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts';
import '../styles/Layout.css';

const Layout = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="layout">
      <header className="header">
        <div className="header-container">
          <Link to="/" className="logo">
            Plants Web
          </Link>
          <nav className="nav">
            <Link to="/feed" className="nav-link">
              Feed
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/posts/create" className="nav-link">
                  Create Post
                </Link>
                <Link to="/profile" className="nav-link profile-link">
                  {user?.photoUrl ? (
                    <img src={user.photoUrl} alt={user.displayName} className="nav-avatar" />
                  ) : (
                    <span className="nav-avatar-placeholder">
                      {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                  <span className="nav-username">{user?.displayName}</span>
                </Link>
                <button onClick={logout} className="nav-link logout-btn">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">
                  Login
                </Link>
                <Link to="/register" className="nav-link register-link">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
