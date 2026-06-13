import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './providers/AuthProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import './lib/leaflet';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <HashRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </HashRouter>
    </ThemeProvider>
  </StrictMode>
);
