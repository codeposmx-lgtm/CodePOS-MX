import React from 'react';
import { createRoot } from 'react-dom/client';
import AnalyticsDashboard from './AnalyticsDashboard.jsx';
import './analytics.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><AnalyticsDashboard /></React.StrictMode>);
