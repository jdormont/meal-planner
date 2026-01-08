import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import posthog from 'posthog-js';
import { AuthProvider } from './contexts/AuthContext';
import App from './App.tsx';
import './index.css';

// Initialize PostHog
const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST;

if (posthogKey && posthogHost) {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    person_profiles: 'identified_only',
    capture_pageview: true // Enable distinct pageview events
  });
} else {
  console.log('PostHog analytics disabled: Missing API key or host');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
