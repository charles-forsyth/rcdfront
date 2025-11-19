import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// This is a placeholder for the API key.
// In a real production environment, this should be handled securely and not hardcoded or directly exposed client-side.
// For this exercise, we assume process.env.API_KEY is made available to the client environment.
// You might need to configure your build tool (e.g., Vite, Webpack) to replace `process.env.API_KEY`
// with an actual key during the build process, or ensure it's set in the environment where this code runs.
// Example: If using Vite, you can prefix with VITE_ : VITE_API_KEY and access it as import.meta.env.VITE_API_KEY
// For now, if it's not set, Gemini features will show an error message.
if (!process.env.API_KEY && window.location.hostname !== 'localhost' /* for local dev flexibility */) {
  console.warn(
    'Gemini API Key (process.env.API_KEY) is not set. AI features will be limited or non-functional. ' +
    'Please ensure the API_KEY environment variable is configured and accessible.'
  );
  // To make development easier if an API key isn't immediately available for testing UI:
  // You could provide a mock key or disable features, but for this exercise, we'll proceed.
  // In a real app, you might want to show a more user-friendly message or restrict access to AI features.
}


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);