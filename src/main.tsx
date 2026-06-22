import { ClerkProvider } from '@clerk/clerk-react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env.local');
}

createRoot(document.getElementById('root')!).render(
  <ClerkProvider publishableKey={publishableKey}>
    <App />
  </ClerkProvider>,
);
