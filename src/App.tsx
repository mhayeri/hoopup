import { Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './routes/HomePage';
import LoginPage from './routes/LoginPage';
import SignupPage from './routes/SignupPage';
import ResetPasswordPage from './routes/ResetPasswordPage';
import UpdatePasswordPage from './routes/UpdatePasswordPage';
import AuthCallbackPage from './routes/AuthCallbackPage';
import ProfilePage from './routes/ProfilePage';
import MapPage from './features/map/MapPage';
import CourtDetailPage from './routes/CourtDetailPage';
import SessionDetailPage from './routes/SessionDetailPage';
import NotFoundPage from './routes/NotFoundPage';
import RequireAuth from './components/RequireAuth';
import NavBar from './components/NavBar';

export default function App() {
  const location = useLocation();

  return (
    <div className="flex min-h-full flex-col">
      <NavBar />
      {/* Keyed by pathname so every navigation gets the route entrance
          animation (CSS `.route-in`, disabled for reduced motion). */}
      <div key={location.pathname} className="route-in flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/courts/:id" element={<CourtDetailPage />} />
          <Route path="/sessions/:id" element={<SessionDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/update-password" element={<UpdatePasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
          <Route path="/u/:username" element={<ProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      {/* Film-grain texture over the whole app (pointer-events: none). */}
      <div aria-hidden className="grain" />
    </div>
  );
}
