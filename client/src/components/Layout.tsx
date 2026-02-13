import { Outlet, Link } from 'react-router-dom';
import '../styles/Layout.css';

const Layout = () => {
  return (
    <div className="layout">
      <header className="header">
        <div className="header-container">
          <Link to="/" className="logo">
            Plants Web
          </Link>
          <nav className="nav">
            <Link to="/" className="nav-link">
              Feed
            </Link>
            <Link to="/profile" className="nav-link">
              Profile
            </Link>
            <Link to="/login" className="nav-link">
              Login
            </Link>
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
