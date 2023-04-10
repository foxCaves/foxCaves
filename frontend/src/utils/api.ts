import { logError } from './misc';

let csrfToken: string | null = null;

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
}

export interface ListResponse {
    offset: number;
    count: number;
    total: number;
    items: unknown[];
}

export class APIAccessor {
    private csrfToken: string | null = null;

    public getCSRFToken(): string {
        return this.csrfToken!;
    }

    public async fetchRaw(url: string, info?: APIRequestInfo): Promise<Response> {
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

        if (this.csrfToken) {
            (init.headers as Record<string, string>)['CSRF-Token'] = this.csrfToken;
        }

        const res = await fetch(url, init);

        const newCSRFToken = res.headers.get('Set-CSRF-Token');
        if (newCSRFToken) {
            this.csrfToken = newCSRFToken;
        }

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

        return res;
    }

    public async fetch(url: string, info?: APIRequestInfo): Promise<unknown> {
        const res = await this.fetchRaw(url, info);
        return res.json();
    }
}
