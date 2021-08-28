export class HttpError extends Error {
    constructor(public status: number, public message: string) {
        super(`HTTP Error: ${status} ${message}`);
    }
}

export interface APIRequestInfo {
    method?: string;
    body?: any;
}

export async function fetchAPIRaw(url: string, info?: APIRequestInfo) {
    let init: RequestInit = {};
    if (info) {
        init.method = info.method;
        if (info.body) {
            init.body = JSON.stringify(info.body);
            init.headers = {
                'Content-Type': 'application/json',
            };
        }
    }

    const res = await fetch(url, init);
    if (res.status < 200 || res.status > 299) {
        let desc = res.statusText;
        try {
            const data = await res.json();
            desc = data.error;
        } catch {}
        throw new HttpError(res.status, desc);
    }
    return res;
}

export async function fetchAPI(url: string, info?: APIRequestInfo) {
    const res = await fetchAPIRaw(url, info);
    return await res.json();
}
