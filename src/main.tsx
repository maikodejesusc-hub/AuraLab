import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  // Safe client-side unregistration ensures old caches and service worker instances are fully terminated without reloading loops
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          console.log('Successfully unregistered service worker registration:', registration);
        }
      });
    }
  }).catch((err) => {
    console.warn('Silent error clearing registrations:', err);
  });
}

