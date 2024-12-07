import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootswatch/dist/vapor/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';

import * as Sentry from '@sentry/react';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import { config } from './utils/config';
import { assert } from './utils/misc';

if (config.no_render) {
    // eslint-disable-next-line no-console
    console.warn('Rendering disabled! Only expected on debug error pages!');
} else {
    if (config.sentry.dsn) {
        Sentry.init({
            dsn: config.sentry.dsn,
        });
    } else {
        // eslint-disable-next-line no-console
        console.warn('Not loading sentry, no DSN!');
    }

    const mountPoint = document.getElementById('root');
    assert(mountPoint);

    const root = createRoot(mountPoint);

    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    );
}
