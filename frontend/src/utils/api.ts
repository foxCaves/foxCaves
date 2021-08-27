export class HttpError extends Error {
  constructor(public status: number, public message: string) {
    super(`HTTP Error: ${status} ${message}`);
  }
}

export async function fetchAPI(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  if (res.status < 200 || res.status > 299) {
    let desc = res.statusText;
    try {
      const data = await res.json();
      desc = data.error;
    } catch {}
    throw new HttpError(res.status, desc);
  }
  return await res.json();
}
