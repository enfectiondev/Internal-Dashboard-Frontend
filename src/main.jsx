import React from "react";
import { createRoot } from "react-dom/client";
import './index.css';  // Tailwind CSS import (optional if you use Tailwind)
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
