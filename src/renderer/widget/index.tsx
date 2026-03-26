import React from 'react';
import { createRoot } from 'react-dom/client';
import { WidgetApp } from './App';
import '../styles/globals.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <WidgetApp />
    </React.StrictMode>
  );
}
