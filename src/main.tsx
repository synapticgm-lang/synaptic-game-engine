import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { logger } from './game/logger';

const GOOGLE_CLIENT_ID_FALLBACK = '947440674973-8k1p2f3q4r5s6t7u8v9w0x1y2z3a4b5c.apps.googleusercontent.com';
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID_FALLBACK;

logger.startConsoleCapture();
logger.info('app', 'Synaptic AI Game starting up');
logger.info('app', `Environment: ${import.meta.env.MODE}, Client ID present: ${!!clientId}`);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={clientId}>
        <App />
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
