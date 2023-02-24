export class ReconnectingWebSocket {
    private ws?: WebSocket;
    private shouldReconnect = true;
    private messageHook?: (data: MessageEvent) => void;

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
            oldWs.close();
        }

        const ws = new WebSocket(this.url);
        if (this.messageHook) {
            ws.addEventListener('message', this.messageHook);
        }

        const doReconnect = () => this.doReconnect(ws);

        ws.addEventListener('close', doReconnect);
        ws.addEventListener('error', doReconnect);

        const reconnectTimeout = this.doReconnect(ws, 10_000);

        ws.addEventListener('open', () => {
            clearTimeout(reconnectTimeout);
        });

        this.ws = ws;
    }

    public setOnMessage(callback: (data: MessageEvent) => void): void {
        if (this.messageHook && this.ws) {
            this.ws.removeEventListener('message', this.messageHook);
        }

        this.messageHook = callback;

        if (this.ws) {
            this.ws.addEventListener('message', callback);
        }
    }

    private doReconnect(oldWs: WebSocket, timeout = 500): NodeJS.Timeout {
        return setTimeout(() => {
            this.connect(oldWs);
        }, timeout);
    }
}
