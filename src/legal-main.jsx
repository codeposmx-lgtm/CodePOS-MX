import React from 'react';
import { createRoot } from 'react-dom/client';
import './scrollOnReload.js';
import LegalPage from './LegalPage.jsx';
import './styles.css';
import './demo.css';
import './motion.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><LegalPage/></React.StrictMode>);
