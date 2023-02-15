import * as Sentry from '@sentry/react';

export const logError = (error: Error) => {
    Sentry.captureException(e);
    // eslint-disable-next-line no-console
    console.error(error);
};
