import { Routes, Route } from 'react-router-dom';
import HomePage from './routes/HomePage';
import LoginPage from './routes/LoginPage';
import SignupPage from './routes/SignupPage';
import AuthCallbackPage from './routes/AuthCallbackPage';
import ProfilePage from './routes/ProfilePage';
import MapPage from './features/map/MapPage';
import CourtDetailPage from './routes/CourtDetailPage';
import SessionDetailPage from './routes/SessionDetailPage';
import NotFoundPage from './routes/NotFoundPage';
import RequireAuth from './components/RequireAuth';
import NavBar from './components/NavBar';

export default function App() {
  return (
    <div className="flex min-h-full flex-col">
      <NavBar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/courts/:id" element={<CourtDetailPage />} />
          <Route path="/sessions/:id" element={<SessionDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </div>
  );
}
