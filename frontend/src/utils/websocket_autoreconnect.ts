export class ReconnectingWebSocket {
    private ws?: WebSocket;
    private onmessage?: (data: MessageEvent<any>) => void;

    constructor(private url: string) {
        this.connect();
    }

    connect(oldWs?: WebSocket) {
        if (oldWs && oldWs !== this.ws) {
            return;
        }

        if (oldWs) {
            oldWs.close();
        }

        const ws = new WebSocket(this.url);
        if (this.onmessage) {
            ws.onmessage = this.onmessage;
        }

        const doReconnect = () => this.doReconnect(ws);

        ws.onclose = doReconnect;
        ws.onerror = doReconnect;

        const reconnectTimeout = setTimeout(() => {
            doReconnect();
        }, 10000);

        ws.onopen = () => {
            clearTimeout(reconnectTimeout);
        };

        this.ws = ws;
    }

    doReconnect(oldWs: WebSocket) {
        setTimeout(() => {
            this.connect(oldWs);
        }, 500);
    }

    setOnMessage(callback: (data: MessageEvent<any>) => void) {
        this.onmessage = callback;
        if (this.ws) {
            this.ws.onmessage = callback;
        }
    }
}
