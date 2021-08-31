export class HttpError extends Error {
    constructor(public status: number, public message: string) {
        super(`HTTP Error: ${status} ${message}`);
    }
}

export interface APIRequestInfo {
    method?: string;
    data?: any;
    body?: BodyInit;
    headers?: Record<string, string>;
}

export async function fetchAPIRaw(url: string, info?: APIRequestInfo) {
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
    const res = await fetch(url, init);
    if (res.status < 200 || res.status > 299) {
        let desc = undefined;
        try {
            const data = await res.json();
            desc = data.error;
        } catch {}
        throw new HttpError(res.status, desc || res.statusText);
    }
    return res;
}

export async function fetchAPI(url: string, info?: APIRequestInfo) {
    const res = await fetchAPIRaw(url, info);
    return await res.json();
}
