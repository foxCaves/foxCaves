import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootswatch/dist/vapor/bootstrap.min.css';
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import 'react-toastify/dist/ReactToastify.css';

import * as Sentry from '@sentry/react';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import { FoxCavesConfig } from './utils/config';

declare const FOXCAVES_CONFIG: FoxCavesConfig;

if (FOXCAVES_CONFIG.sentry.dsn) {
    Sentry.init({
        dsn: FOXCAVES_CONFIG.sentry.dsn,
    });
} else {
    // eslint-disable-next-line no-console
    console.warn(`Not loading sentry, no DSN!`);
}

const root = createRoot(document.getElementById('root')!);

root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
