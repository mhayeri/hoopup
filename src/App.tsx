import { Routes, Route } from 'react-router-dom';
import HomePage from './routes/HomePage';
import LoginPage from './routes/LoginPage';
import NotFoundPage from './routes/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
