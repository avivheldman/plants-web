import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts';
import { Layout, ProtectedRoute } from './components';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import FeedPage from './pages/FeedPage';
import NotFoundPage from './pages/NotFoundPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="feed" element={
              <ProtectedRoute>
                <FeedPage />
              </ProtectedRoute>
            } />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="profile/edit" element={
              <ProtectedRoute>
                <EditProfilePage />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
