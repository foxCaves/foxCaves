export class ReconnectingWebSocket {
    private ws?: WebSocket;
    private shouldReconnect = true;
    private onmessage?: (data: MessageEvent<any>) => void;

    constructor(private url: string) {
        this.connect();
    }

    close() {
        this.shouldReconnect = false;
        if (!this.ws) {
            return;
        }
        this.ws.close();
    }

    connect(oldWs?: WebSocket) {
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

        ws.onclose = doReconnect;
        ws.onerror = doReconnect;

        const reconnectTimeout = this.doReconnect(ws, 10000);

        ws.onopen = () => {
            clearTimeout(reconnectTimeout);
        };

        this.ws = ws;
    }

    doReconnect(oldWs: WebSocket, timeout = 500): NodeJS.Timeout {
        return setTimeout(() => {
            this.connect(oldWs);
        }, timeout);
    }

    setOnMessage(callback: (data: MessageEvent<any>) => void) {
        this.onmessage = callback;
        if (this.ws) {
            this.ws.onmessage = callback;
        }
    }
}
