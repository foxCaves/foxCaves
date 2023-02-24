import * as Sentry from '@sentry/react';

export const logError = (error: Error): void => {
    Sentry.captureException(error);
    // eslint-disable-next-line no-console
    console.error(error);
};
