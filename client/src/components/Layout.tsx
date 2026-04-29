import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';
import '../styles/Layout.css';

const Layout = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-container">
          <span className="logo">Plants Web</span>
          {isAuthenticated && (
            <nav className="nav">
              <Link to="/feed" className="nav-link">
                Feed
              </Link>
              <Link to="/profile" className="nav-link profile-link">
                {user?.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt={user.displayName}
                    className="nav-avatar"
                  />
                ) : (
                  <div className="nav-avatar-placeholder">
                    {user?.displayName?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span>{user?.displayName}</span>
              </Link>
              <button onClick={handleLogout} className="nav-link logout-btn">
                Logout
              </button>
            </nav>
          )}
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
