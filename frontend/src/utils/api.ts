import { logError } from './misc';

export class HttpError extends Error {
    public constructor(public status: number, public message: string) {
        super(`HTTP Error: ${status} ${message}`);
        this.name = 'HttpError';
    }
}

interface APIRequestInfo {
    method?: string;
    data?: unknown;
    body?: BodyInit;
    headers?: Record<string, string>;
    disableCSRF?: boolean;
}

export interface ListResponse {
    offset: number;
    count: number;
    total: number;
    items: unknown[];
}

interface CSRFRequestResponse {
    csrf_token: string;
}

export class APIAccessor {
    private csrfToken: string | null = null;

    public async refreshCSRFToken(): Promise<void> {
        const res = (await this.fetch('/api/v1/system/csrf', {
            method: 'POST',
            data: { refresh: true },
            disableCSRF: true,
        })) as CSRFRequestResponse;

        this.csrfToken = res.csrf_token;
    }

    public async getCSRFToken(): Promise<string> {
        if (!this.csrfToken) {
            await this.refreshCSRFToken();
        }

        return this.csrfToken!;
    }

    public isReadOnlyMethod(method?: string): boolean {
        if (!method) {
            return true;
        }

        method = method.toUpperCase();
        return method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
    }

    public async fetch(url: string, info?: APIRequestInfo): Promise<unknown> {
        const init: RequestInit = {};

        if (info) {
            init.headers = info.headers;
            init.method = info.method;

            if (info.data) {
                init.body = JSON.stringify(info.data);
                if (!init.headers) {
                    init.headers = {};
                }

                init.headers['Content-Type'] = 'application/json';
            } else if (info.body) {
                init.body = info.body;
            }
        }

        if (!init.headers) {
            init.headers = {};
        }

        if (!info?.disableCSRF && !this.isReadOnlyMethod(init.method)) {
            (init.headers as Record<string, string>)['CSRF-Token'] = await this.getCSRFToken();
        }

        const res = await fetch(url, init);

        if (res.status < 200 || res.status > 299) {
            let desc;
            try {
                const data = (await res.json()) as { error: string };
                desc = data.error;
            } catch (error) {
                logError(error as Error);
            }

            throw new HttpError(res.status, desc ?? res.statusText);
        }

        return res.json();
    }
}
