import { StrictMode } from 'react';
import ReactDOM from 'react-dom';
import * as Sentry from '@sentry/react';
import { App } from './app';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootswatch/dist/vapor/bootstrap.min.css';

declare const CONFIG: {
    sentry_dsn: string;
};

if (process.env.NODE_ENV === 'production') {
    Sentry.init({
        dsn: CONFIG.sentry_dsn,
    });
} else {
    console.warn(`Running in ${process.env.NODE_ENV} mode. Not loading sentry`);
}

ReactDOM.render(
    <StrictMode>
        <App />
    </StrictMode>,
    document.getElementById('root'),
);
