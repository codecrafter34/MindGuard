// main.jsx — Application entry point.
// Mounts the React application into the #root div in index.html.
// StrictMode helps catch common bugs during development (double-invokes
// certain lifecycle functions so side-effects show up early).

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
