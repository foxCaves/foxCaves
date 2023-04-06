import * as Sentry from '@sentry/react';
import { BaseModel } from '../models/base';

export const logError = (error: Error): void => {
    Sentry.captureException(error);
    // eslint-disable-next-line no-console
    console.error(error);
};

export const sortByDate = (a: BaseModel, b: BaseModel): number => {
    return b.created_at.getTime() - a.created_at.getTime();
};
