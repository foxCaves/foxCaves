import { StrictMode } from 'react';
import ReactDOM from 'react-dom';
import * as Sentry from '@sentry/react';
import { App } from './app';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootswatch/dist/vapor/bootstrap.min.css';

if (process.env.REACT_APP_SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.REACT_APP_SENTRY_DSN,
    });
} else {
    console.warn(`Not loading sentry, no DSN!`);
}

ReactDOM.render(
    <StrictMode>
        <App />
    </StrictMode>,
    document.getElementById('root'),
);
