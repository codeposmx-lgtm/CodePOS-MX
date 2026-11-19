import React from 'react';
import { createRoot } from 'react-dom/client';
import './scrollOnReload.js';
import NfcPage from './NfcPage.jsx';
import './motion.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><NfcPage /></React.StrictMode>);
