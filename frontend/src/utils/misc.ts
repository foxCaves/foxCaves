import * as Sentry from '@sentry/react';
import { BaseModel } from '../models/base';

export const logError = (error: unknown): void => {
    Sentry.captureException(error);
    // eslint-disable-next-line no-console
    console.error(error);
};

export const sortByDate = (a: BaseModel, b: BaseModel): number => {
    return b.created_at.getTime() - a.created_at.getTime();
};

export function noop(): void {
    // do nothing
}

export function assert(value: unknown): asserts value {
    if (!value) {
        throw new TypeError('assertion failed');
    }
}
