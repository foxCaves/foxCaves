import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootswatch/dist/vapor/bootstrap.min.css';
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import 'react-toastify/dist/ReactToastify.css';

import * as Sentry from '@sentry/react';

import { App } from './app';
import ReactDOM from 'react-dom';
import { StrictMode } from 'react';

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
