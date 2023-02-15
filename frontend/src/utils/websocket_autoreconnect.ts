export class ReconnectingWebSocket {
    private ws?: WebSocket;
    private shouldReconnect = true;
    private onmessage?: (data: MessageEvent) => void;

    public constructor(private readonly url: string) {
        this.connect();
    }

    public close(): void {
        this.shouldReconnect = false;
        if (!this.ws) {
            return;
        }

        this.ws.close();
    }

    public connect(oldWs?: WebSocket): void {
        if (!this.shouldReconnect) {
            return;
        }

        if (oldWs && oldWs !== this.ws) {
            return;
        }

        if (oldWs) {
            oldWs.onclose = null;
            oldWs.onerror = null;
            oldWs.close();
        }

        const ws = new WebSocket(this.url);
        if (this.onmessage) {
            ws.onmessage = this.onmessage;
        }

        const doReconnect = () => this.doReconnect(ws);

        ws.addEventListener('close', doReconnect);
        ws.onerror = doReconnect;

        const reconnectTimeout = this.doReconnect(ws, 10_000);

        ws.addEventListener('open', () => {
            clearTimeout(reconnectTimeout);
        });

        this.ws = ws;
    }

    public setOnMessage(callback: (data: MessageEvent) => void): void {
        this.onmessage = callback;
        if (this.ws) {
            this.ws.onmessage = callback;
        }
    }

    private doReconnect(oldWs: WebSocket, timeout = 500): NodeJS.Timeout {
        return setTimeout(() => {
            this.connect(oldWs);
        }, timeout);
    }
}
