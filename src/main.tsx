import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LegalPage } from './components/LegalPage';
import { CreditsPage } from './components/CreditsPage';
import { isCreditsPath, legalPathToId } from './legal/legalDocs';
import { logger } from './game/logger';
import { bindForceLatestOnReturn, runForceLatestGate } from './game/forceLatest';
import { BUILD_STAMP } from './game/runManifest';
import { HUD_BUILD_STAMP } from './components/Hud';

const GOOGLE_CLIENT_ID_FALLBACK = '947440674973-8k1p2f3q4r5s6t7u8v9w0x1y2z3a4b5c.apps.googleusercontent.com';
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID_FALLBACK;

logger.startConsoleCapture();
logger.info('app', 'Synaptic AI Game starting up');
logger.info('app', `Environment: ${import.meta.env.MODE}, Client ID present: ${!!clientId}`);

const runningStamps = { hud: HUD_BUILD_STAMP, build: BUILD_STAMP };

function mountApp() {
  const legalDocId = legalPathToId(window.location.pathname);
  const showCredits = isCreditsPath(window.location.pathname);

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        {showCredits ? (
          <CreditsPage />
        ) : legalDocId ? (
          <LegalPage docId={legalDocId} />
        ) : (
          <GoogleOAuthProvider clientId={clientId}>
            <App />
          </GoogleOAuthProvider>
        )}
      </ErrorBoundary>
    </StrictMode>
  );
  bindForceLatestOnReturn(runningStamps);
}

void runForceLatestGate(runningStamps).then((reloading) => {
  if (reloading) return;
  mountApp();
});
