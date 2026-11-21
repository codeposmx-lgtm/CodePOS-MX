import React from 'react';
import { createRoot } from 'react-dom/client';
import './fonts.css';
import './scrollOnReload.js';
import PosPage from './PosPage.jsx';
import './styles.css';
import './demo.css';
import './pos-page.css';
import './motion.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><PosPage /></React.StrictMode>);
