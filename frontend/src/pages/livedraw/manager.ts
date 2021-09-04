import { FileModel } from '../../models/file';

const MathPIDouble = Math.PI * 2.0;
let canvasPos: DOMRect;
let scaleFactor = 1.0;
let imagePattern: CanvasPattern;
let brushSizeSlider: HTMLInputElement;
let backgroundCanvasCTX: CanvasRenderingContext2D,
    foregroundCanvasCTX: CanvasRenderingContext2D,
    finalCanvasCTX: CanvasRenderingContext2D;
let backgroundCanvas: HTMLCanvasElement, foregroundCanvas: HTMLCanvasElement, finalCanvas: HTMLCanvasElement;

const MAX_BRUSH_WIDTH = 200;
let LIVEDRAW_FILE: FileModel | undefined = undefined;

enum PaintEvent {
    WIDTH = 'w',
    COLOR = 'c',
    BRUSH = 'b',
    MOUSE_UP = 'u',
    MOUSE_DOWN = 'd',
    MOUSE_MOVE = 'm',
    MOUSE_CURSOR = 'p',
    CUSTOM = 'x',
    RESET = 'r',
    JOIN = 'j',
    LEAVE = 'l',
    ERROR = 'e',
    IMGBURST = 'i',
    MOUSE_DOUBLE_CLICK = 'F',
}

interface CursorData {
    x: number;
    y: number;
    lastX: number;
    lastY: number;
}

interface BrushData {
    width: number;
    color: string;
    brush: Brush;
    customData: {
        [key: string]: {
            [key: string]: unknown;
        };
    };
}

interface User {
    brushData: BrushData;
    cursorData: CursorData;
    local: boolean;
}

interface LocalUserBrushData extends BrushData {
    setBrushAttribsLocal(): void;
    setColor(col: string): void;
    setWidth(width: number): void;
    setBrush(name: string): void;
}

interface LocalUser extends User {
    brushData: LocalUserBrushData;
    local: true;
}

interface RemotePaintUser extends User {
    name: string;
}

const paintUsers: {
    [key: string]: RemotePaintUser;
} = {};

interface Brush {
    select(
        user: User,
        foregroundCanvasCTX: CanvasRenderingContext2D,
        backgroundCanvasCTX: CanvasRenderingContext2D,
    ): void;
    down(x: number, y: number, user: User): void;
    up(x: number, y: number, user: User, backgroundCanvasCTX: CanvasRenderingContext2D): void;
    move(x: number, y: number, user: User, backgroundCanvasCTX: CanvasRenderingContext2D): boolean | void;
    preview(x: number, y: number, user: User, foregroundCanvasCTX: CanvasRenderingContext2D): void;
    setup?(user: User): void;
    doubleClick?(x: number, y: number, user: User, backgroundCanvasCTX: CanvasRenderingContext2D): void;
    unselectLocal?(): void;
    selectLocal?(
        user: User,
        foregroundCanvasCTX: CanvasRenderingContext2D,
        backgroundCanvasCTX: CanvasRenderingContext2D,
    ): void;
    active?: boolean;
    usesCustomData?: boolean;
    keepLineWidth?: boolean;
    keepBackgroundStrokeStyle?: boolean;
    defaultCustomData?: {
        [key: string]: string;
    };
}

interface Vertex {
    x: number;
    y: number;
}

const paintBrushes: {
    [key: string]: Brush;
} = {
    rectangle: {
        select(user, foregroundCanvasCTX, backgroundCanvasCTX) {
            backgroundCanvasCTX.lineCap = 'butt';
            foregroundCanvasCTX.lineWidth = user.brushData.width * scaleFactor;
        },
        down(x, y, user) {
            user.cursorData.lastX = x;
            user.cursorData.lastY = y;
            this.active = true;
        },
        up(x, y, user, backgroundCanvasCTX) {
            if (user.cursorData.lastX === x && user.cursorData.lastY === y) {
                x++;
                y++;
            }
            backgroundCanvasCTX.strokeStyle = user.brushData.color;
            backgroundCanvasCTX.strokeRect(x, y, user.cursorData.lastX - x, user.cursorData.lastY - y);
            this.active = false;
        },
        move() {
            return true;
        },
        preview(x, y, user, foregroundCanvasCTX) {
            if (!this.active) return;
            foregroundCanvasCTX.strokeRect(x, y, user.cursorData.lastX - x, user.cursorData.lastY - y);
        },
    },
    circle: {
        select(user, foregroundCanvasCTX, backgroundCanvasCTX) {
            backgroundCanvasCTX.lineCap = 'butt';
            foregroundCanvasCTX.lineWidth = user.brushData.width * scaleFactor;
        },
        down(x, y, user) {
            this.active = true;
            user.cursorData.lastX = x;
            user.cursorData.lastY = y;
        },
        up(x, y, user, backgroundCanvasCTX) {
            if (user.cursorData.lastX == x && user.cursorData.lastY == y) {
                x++;
                y++;
            }
            backgroundCanvasCTX.strokeStyle = user.brushData.color;

            backgroundCanvasCTX.beginPath();
            x = user.cursorData.lastX - x;
            y = user.cursorData.lastY - y;
            backgroundCanvasCTX.arc(
                user.cursorData.lastX,
                user.cursorData.lastY,
                Math.sqrt(x * x + y * y),
                0,
                MathPIDouble,
                false,
            );
            backgroundCanvasCTX.stroke();
            this.active = false;
        },
        move() {
            return true;
        },
        preview(x, y, user, foregroundCanvasCTX) {
            if (!this.active) return;

            const radius = Math.sqrt(x * x + y * y);

            foregroundCanvasCTX.font = '10px Verdana';
            foregroundCanvasCTX.fillText('Radius: ' + radius + 'px', user.cursorData.lastX, user.cursorData.lastY);

            foregroundCanvasCTX.beginPath();
            x = user.cursorData.lastX - x;
            y = user.cursorData.lastY - y;
            foregroundCanvasCTX.arc(
                user.cursorData.lastX,
                user.cursorData.lastY,
                Math.sqrt(x * x + y * y),
                0,
                MathPIDouble,
                false,
            );
            foregroundCanvasCTX.stroke();
        },
    },
    brush: {
        keepLineWidth: true,
        select(_user, foregroundCanvasCTX) {
            foregroundCanvasCTX.lineWidth = 1 / scaleFactor;
        },
        down(x, y, user) {
            user.cursorData.lastX = x;
            user.cursorData.lastY = y;
        },
        up(x, y, user, backgroundCanvasCTX) {
            if (user.cursorData.lastX == x && user.cursorData.lastY == y) {
                x++;
                y++;
            }

            this.move(x, y, user, backgroundCanvasCTX);
        },
        move(x, y, user, backgroundCanvasCTX) {
            backgroundCanvasCTX.lineCap = 'round';
            backgroundCanvasCTX.strokeStyle = user.brushData.color;

            backgroundCanvasCTX.beginPath();
            backgroundCanvasCTX.moveTo(user.cursorData.lastX, user.cursorData.lastY);
            backgroundCanvasCTX.lineTo(x, y);
            backgroundCanvasCTX.stroke();
            user.cursorData.lastX = x;
            user.cursorData.lastY = y;
        },
        preview(x, y, user, foregroundCanvasCTX) {
            foregroundCanvasCTX.beginPath();
            foregroundCanvasCTX.arc(x, y, (user.brushData.width / 2) * scaleFactor, 0, MathPIDouble);
            foregroundCanvasCTX.stroke();
        },
    },
    erase: {
        keepLineWidth: true,
        select(_user, foregroundCanvasCTX) {
            foregroundCanvasCTX.lineWidth = 1 / scaleFactor;
            foregroundCanvasCTX.strokeStyle = 'black';
        },
        down(x, y, user) {
            user.cursorData.lastX = x;
            user.cursorData.lastY = y;
        },
        up(x, y, user, backgroundCanvasCTX) {
            if (user.cursorData.lastX == x && user.cursorData.lastY == y) {
                x++;
                y++;
            }
            this.move(x, y, user, backgroundCanvasCTX);
        },
        move(x, y, user, backgroundCanvasCTX) {
            backgroundCanvasCTX.lineCap = 'round';
            backgroundCanvasCTX.globalCompositeOperation = 'destination-out';

            backgroundCanvasCTX.beginPath();
            backgroundCanvasCTX.moveTo(user.cursorData.lastX, user.cursorData.lastY);
            backgroundCanvasCTX.lineTo(x, y);
            backgroundCanvasCTX.stroke();
            user.cursorData.lastX = x;
            user.cursorData.lastY = y;
        },
        preview(x, y, user, foregroundCanvasCTX) {
            foregroundCanvasCTX.beginPath();
            foregroundCanvasCTX.arc(x, y, (user.brushData.width / 2) * scaleFactor, 0, MathPIDouble);
            foregroundCanvasCTX.stroke();
        },
    },
    restore: {
        keepLineWidth: true,
        keepBackgroundStrokeStyle: true,
        select(_user, foregroundCanvasCTX) {
            foregroundCanvasCTX.lineWidth = 1 / scaleFactor;
            foregroundCanvasCTX.strokeStyle = 'black';
        },
        down(x, y, user) {
            user.cursorData.lastX = x;
            user.cursorData.lastY = y;
        },
        up(x, y, user, backgroundCanvasCTX) {
            if (user.cursorData.lastX == x && user.cursorData.lastY == y) {
                x++;
                y++;
            }

            this.move(x, y, user, backgroundCanvasCTX);
        },
        move(x, y, user, backgroundCanvasCTX) {
            backgroundCanvasCTX.strokeStyle = imagePattern;
            backgroundCanvasCTX.lineWidth = user.brushData.width * scaleFactor;
            backgroundCanvasCTX.lineCap = 'round';

            backgroundCanvasCTX.beginPath();
            backgroundCanvasCTX.moveTo(user.cursorData.lastX, user.cursorData.lastY);
            backgroundCanvasCTX.lineTo(x, y);
            backgroundCanvasCTX.stroke();
            user.cursorData.lastX = x;
            user.cursorData.lastY = y;
        },
        preview(x, y, user, foregroundCanvasCTX) {
            foregroundCanvasCTX.beginPath();
            foregroundCanvasCTX.arc(x, y, (user.brushData.width / 2) * scaleFactor, 0, MathPIDouble);
            foregroundCanvasCTX.stroke();
        },
    },
    line: {
        select(user, foregroundCanvasCTX) {
            foregroundCanvasCTX.lineWidth = user.brushData.width;
        },
        down(x, y, user) {
            user.cursorData.lastX = x;
            user.cursorData.lastY = y;
            this.active = true;
        },
        up(x, y, user, backgroundCanvasCTX) {
            if (user.cursorData.lastX == x && user.cursorData.lastY == y) {
                x++;
                y++;
            }
            backgroundCanvasCTX.lineCap = 'butt';
            backgroundCanvasCTX.beginPath();
            backgroundCanvasCTX.moveTo(user.cursorData.lastX, user.cursorData.lastY);
            backgroundCanvasCTX.lineTo(x, y);
            backgroundCanvasCTX.stroke();
            this.active = false;
        },
        move() {
            return true;
        },
        preview(x, y, user, foregroundCanvasCTX) {
            if (!this.active) return;
            foregroundCanvasCTX.beginPath();
            foregroundCanvasCTX.moveTo(user.cursorData.lastX, user.cursorData.lastY);
            foregroundCanvasCTX.lineTo(x, y);
            foregroundCanvasCTX.stroke();
            return true;
        },
    },
    text: {
        keepLineWidth: true,
        usesCustomData: true,
        defaultCustomData: {
            text: '',
            font: 'Verdana',
        },
        setup(user) {
            if (user != localUser) return;
            // TODO: This should really not be here...
            const textInput = document.getElementById('live-draw-text-input') as HTMLInputElement;
            const fontInput = document.getElementById('live-draw-font-input') as HTMLInputElement;

            function setText(text: string) {
                user.brushData.customData.text!.text = text;
                networking.sendBrushPacket('text', 'text', text);
            }

            function setFont(font: string) {
                user.brushData.customData.text!.font = font;
                networking.sendBrushPacket('text', 'font', font);
            }

            textInput.addEventListener('input', () => {
                setText(textInput.value);
            });

            fontInput.addEventListener('input', () => {
                setFont(fontInput.value);
            });
        },
        select() {},
        selectLocal() {
            const textInput = document.getElementById('live-draw-text-input') as HTMLInputElement;
            const fontInput = document.getElementById('live-draw-font-input') as HTMLInputElement;
            textInput.style.display = fontInput.style.display = 'block';
        },
        unselectLocal() {
            const textInput = document.getElementById('live-draw-text-input') as HTMLInputElement;
            const fontInput = document.getElementById('live-draw-font-input') as HTMLInputElement;
            textInput.style.display = fontInput.style.display = 'none';
        },
        down() {},
        up(x, y, user, backgroundCanvasCTX) {
            backgroundCanvasCTX.font = (scaleFactor * user.brushData.width +
                'px ' +
                user.brushData.customData.text!.font) as string;
            backgroundCanvasCTX.textAlign = 'left';
            backgroundCanvasCTX.textBaseline = 'top';
            backgroundCanvasCTX.fillText(user.brushData.customData.text!.text as string, x, y);
        },
        move() {
            return true;
        },
        preview(x, y, user, foregroundCanvasCTX) {
            foregroundCanvasCTX.font = (scaleFactor * user.brushData.width +
                'px ' +
                user.brushData.customData.text!.font) as string;
            foregroundCanvasCTX.fillText(user.brushData.customData.text!.text as string, x, y);
        },
        /*,
		setFontSize(user, fontSize) {
			user.brushData.customData.text.fontSize = fontSize
			networking.sendCustomPacket("text", "fontSize", fontSize);
		}*/
    },
    polygon: {
        usesCustomData: true,
        setup(user) {
            user.brushData.customData.polygon!.verts = [];
        },
        select() {},
        down() {},
        up(x, y, user) {
            (user.brushData.customData.polygon!.verts as Vertex[]).push({ x: x, y: y });
        },
        move() {
            return true;
        },
        preview(x, y, user, foregroundCanvasCTX) {
            const verts = user.brushData.customData.polygon!.verts as Vertex[];
            if (verts.length === 0) return;
            const firstVert = verts[0]!;
            foregroundCanvasCTX.beginPath();
            foregroundCanvasCTX.moveTo(firstVert.x, firstVert.y);
            for (let i = 1; verts.length > i; ++i) foregroundCanvasCTX.lineTo(verts[i]!.x, verts[i]!.y);
            foregroundCanvasCTX.lineTo(x, y);
            foregroundCanvasCTX.lineTo(firstVert.x, firstVert.y);
            foregroundCanvasCTX.fill();
        },
        doubleClick(_x, _y, user, backgroundCanvasCTX) {
            backgroundCanvasCTX.strokeStyle = user.brushData.color;

            const verts = user.brushData.customData.polygon!.verts as Vertex[];
            if (verts.length == 0) return;
            const firstVert = verts[0]!;
            backgroundCanvasCTX.beginPath();
            backgroundCanvasCTX.moveTo(firstVert.x, firstVert.y);
            for (let i = 1; verts.length > i; ++i) backgroundCanvasCTX.lineTo(verts[i]!.x, verts[i]!.y);
            backgroundCanvasCTX.lineTo(firstVert.x, firstVert.y);
            backgroundCanvasCTX.fill();

            user.brushData.customData.polygon!.verts = []; //flush the array
        },
    },
};

const localUser: LocalUser = {
    local: true,
    brushData: {
        width: 0,
        color: 'black',
        brush: paintBrushes.text!,
        customData: {},
        setWidth(bWidth: number) {
            if (bWidth == this.width) return;
            const strWidth = bWidth.toString();
            this.width = bWidth;
            brushSizeSlider.value = strWidth;
            this.setBrushAttribsLocal();
            networking.sendDrawEvent(PaintEvent.WIDTH, strWidth);
        },
        setColor(bColor: string) {
            this.color = bColor;
            this.setBrushAttribsLocal();
            networking.sendDrawEvent(PaintEvent.COLOR, bColor);
        },
        setBrush(brush: string) {
            if (this.brush && this.brush.unselectLocal) {
                this.brush.unselectLocal();
            }

            this.brush = paintBrushes[brush]!;
            backgroundCanvasCTX.globalCompositeOperation = 'source-over';

            if (this.brush.selectLocal) {
                this.brush.selectLocal(localUser, foregroundCanvasCTX, backgroundCanvasCTX);
            }
            this.brush.select(localUser, foregroundCanvasCTX, backgroundCanvasCTX);
            networking.sendDrawEvent(PaintEvent.BRUSH, brush);
        },
        setBrushAttribsLocal() {
            backgroundCanvasCTX.lineWidth = this.width * scaleFactor;
            if (localUser.brushData.brush && localUser.brushData.brush.keepBackgroundStrokeStyle != true)
                backgroundCanvasCTX.strokeStyle = this.color;
            backgroundCanvasCTX.fillStyle = this.color;

            foregroundCanvasCTX.strokeStyle = this.color;
            foregroundCanvasCTX.fillStyle = this.color;
            if (localUser.brushData.brush && localUser.brushData.brush.keepLineWidth != true)
                foregroundCanvasCTX.lineWidth = this.width * scaleFactor;
        },
    },
    cursorData: {
        x: 0,
        y: 0,
        lastX: 0,
        lastY: 0,
    },
};

function calcOffsets(event: MouseEvent): [number, number] {
    let x: number;
    let y: number;

    if (!event.offsetX) {
        x = event.pageX - canvasPos.left;
        y = event.pageY - canvasPos.top;
    } else {
        x = event.offsetX;
        y = event.offsetY;
    }

    x = Math.round(x);
    y = Math.round(y);
    if (x < 0) x = 0;
    if (y < 0) y = 0;

    return [x, y];
}

function sign(x: number) {
    return x ? (x < 0 ? -1 : 1) : 0;
}

function clamp(val: number, min: number, max: number) {
    return Math.max(min, Math.min(max, val));
}

const liveDrawInput = {
    cursorX: 0,
    cursorY: 0,
    isDrawing: false,
    mouseDown(event: MouseEvent) {
        if (event.button !== 0) {
            return;
        }
        event.preventDefault();

        this.isDrawing = true;

        const [offsetX, offsetY] = calcOffsets(event);

        const sendX = offsetX / scaleFactor;
        const sendY = offsetY / scaleFactor;

        localUser.brushData.brush.down(offsetX, offsetY, localUser);
        networking.sendBrushEvent(PaintEvent.MOUSE_DOWN, sendX, sendY);
    },
    mouseUp(event: MouseEvent, backgroundCanvasCTX: CanvasRenderingContext2D) {
        if (event.button !== 0) {
            return;
        }
        event.preventDefault();

        if (!this.isDrawing) {
            return;
        }
        this.isDrawing = false;

        const [offsetX, offsetY] = calcOffsets(event);

        const sendX = offsetX / scaleFactor;
        const sendY = offsetY / scaleFactor;

        localUser.brushData.brush.up(offsetX, offsetY, localUser, backgroundCanvasCTX);
        networking.sendBrushEvent(PaintEvent.MOUSE_UP, sendX, sendY);

        localUser.cursorData.lastX = 0;
        localUser.cursorData.lastY = 0;
    },
    mouseMove(event: MouseEvent, backgroundCanvasCTX: CanvasRenderingContext2D) {
        event.preventDefault();

        const [offsetX, offsetY] = calcOffsets(event);

        this.cursorX = offsetX;
        this.cursorY = offsetY;

        const sendX = offsetX / scaleFactor;
        const sendY = offsetY / scaleFactor;

        if (!this.isDrawing) {
            networking.sendBrushEvent(PaintEvent.MOUSE_CURSOR, sendX, sendY);
            return;
        }

        if (!localUser.brushData.brush.move(offsetX, offsetY, localUser, backgroundCanvasCTX)) {
            networking.sendBrushEvent(PaintEvent.MOUSE_MOVE, sendX, sendY);
        } else {
            networking.sendBrushEvent(PaintEvent.MOUSE_CURSOR, sendX, sendY);
        }
    },
    mouseScroll(event: WheelEvent) {
        event.preventDefault();
        const delta = sign(-event.deltaY) * 2;

        localUser.brushData.setWidth(clamp(localUser.brushData.width + delta, 1, MAX_BRUSH_WIDTH));
    },
    doubleClick(event: MouseEvent) {
        event.preventDefault();
        const [offsetX, offsetY] = calcOffsets(event);
        if (localUser.brushData.brush.doubleClick)
            localUser.brushData.brush.doubleClick(offsetX, offsetY, localUser, backgroundCanvasCTX);

        this.cursorX = offsetX;
        this.cursorY = offsetY;

        const sendX = offsetX / scaleFactor;
        const sendY = offsetY / scaleFactor;

        networking.sendBrushEvent(PaintEvent.MOUSE_DOUBLE_CLICK, sendX, sendY);
    },
};

const networking = {
    shouldConnect: false,
    socket: undefined as WebSocket | undefined,
    recvRaw(msg: string) {
        msg = msg.trim();
        if (msg.length < 1) {
            return;
        }
        this.recvDirectEvent(msg.charAt(0) as PaintEvent, msg.substr(1));
    },
    recvDirectEvent(eventype: PaintEvent, payload: string) {
        const commands = payload.split('|');
        if (eventype == PaintEvent.ERROR) {
            this.close();
            alert('Network error: ' + commands + '\nPlease refresh this page to rejoin!');
            return;
        }
        switch (eventype) {
            case PaintEvent.JOIN:
                const [id, name, widthAsString, color, brush] = commands;
                const from: RemotePaintUser = (paintUsers[id!] = {
                    local: false,
                    name: name!,
                    brushData: {
                        width: parseFloat(widthAsString!),
                        color: color!,
                        brush: paintBrushes[brush!]!,
                        customData: {},
                    },
                    cursorData: {
                        x: parseFloat(commands[5] || '0') * scaleFactor,
                        y: parseFloat(commands[6] || '0') * scaleFactor,
                        lastX: 0,
                        lastY: 0,
                    },
                });
                for (const brush in paintBrushes) {
                    const pBrush = paintBrushes[brush]!;
                    if (pBrush.usesCustomData) {
                        from.brushData.customData[brush] = { ...pBrush.defaultCustomData };
                    }
                    if (pBrush.setup) {
                        pBrush.setup(from);
                    }
                }
                break;
            case PaintEvent.LEAVE:
                delete paintUsers[commands[0]!];
                break;
            case PaintEvent.IMGBURST:
                if (commands[1] == 'r') {
                    this.sendDrawEvent(
                        PaintEvent.IMGBURST,
                        commands[2] + '|' + finalCanvas.toDataURL('image/png').replace(/[\r\n]/g, '') + '|',
                    );
                } else if (commands[1] == 'a') {
                    const toSet = new Image();
                    toSet.onload = () => {
                        backgroundCanvasCTX.drawImage(toSet, 0, 0, finalCanvas.width, finalCanvas.height);
                    };
                    toSet.src = commands[2]!;
                }
                break;
            default:
                this.recvDrawEvent(eventype, commands);
                break;
        }
    },
    sendDrawEvent(eventype: PaintEvent, payload: string) {
        this.sendRaw(eventype + payload);
    },
    sendBrushEvent(eventype: PaintEvent, x: number, y: number) {
        this.sendDrawEvent(eventype, x + '|' + y);
    },
    recvDrawEvent(eventype: PaintEvent, payload: string[]) {
        const from = paintUsers[payload[0]!]!;
        switch (eventype) {
            case PaintEvent.MOUSE_CURSOR:
                from.cursorData.x = parseFloat(payload[1]!) * scaleFactor;
                from.cursorData.y = parseFloat(payload[2]!) * scaleFactor;
                break;
            case PaintEvent.MOUSE_MOVE:
            case PaintEvent.MOUSE_DOWN:
            case PaintEvent.MOUSE_UP:
            case PaintEvent.MOUSE_DOUBLE_CLICK:
                this.recvBrushEvent(from, eventype, parseFloat(payload[1]!), parseFloat(payload[2]!));
                break;
            case PaintEvent.WIDTH:
                from.brushData.width = parseFloat(payload[1]!);
                break;
            case PaintEvent.COLOR:
                from.brushData.color = payload[1]!;
                break;
            case PaintEvent.CUSTOM:
                const { customData } = from.brushData;
                const [brush, key, value] = payload;
                if (!customData[brush!]) {
                    customData[brush!] = {};
                }
                from.brushData.customData[brush!]![key!] = value!;
                break;
            case PaintEvent.BRUSH:
                from.brushData.brush = paintBrushes[payload[1]!]!;
                break;
            case PaintEvent.RESET:
                break;
        }
    },
    recvBrushEvent(from: User, eventype: PaintEvent, x: number, y: number) {
        x *= scaleFactor;
        y *= scaleFactor;
        from.cursorData.x = x;
        from.cursorData.y = y;

        const brush = from.brushData.brush;
        backgroundCanvasCTX.lineWidth = from.brushData.width * scaleFactor; //Needed in order to draw correctly
        backgroundCanvasCTX.strokeStyle = from.brushData.color;
        backgroundCanvasCTX.fillStyle = from.brushData.color;

        brush.select(from, foregroundCanvasCTX, backgroundCanvasCTX);

        switch (eventype) {
            case PaintEvent.MOUSE_DOWN:
                brush.down(x, y, from);
                break;
            case PaintEvent.MOUSE_UP:
                brush.up(x, y, from, backgroundCanvasCTX);
                break;
            case PaintEvent.MOUSE_MOVE:
                brush.move(x, y, from, backgroundCanvasCTX);
                break;
            case PaintEvent.MOUSE_DOUBLE_CLICK:
                brush.doubleClick!(x, y, from, backgroundCanvasCTX);
                break;
        }

        localUser.brushData.setBrushAttribsLocal();

        localUser.brushData.brush.select(from, foregroundCanvasCTX, backgroundCanvasCTX);
    },
    sendBrushPacket(brushName: string, key: string, val: string) {
        this.sendRaw(PaintEvent.CUSTOM + brushName + '|' + key + '|' + val);
    },
    async connect(oldSocket: WebSocket | undefined, fileId: string, sessionId: string) {
        if (oldSocket && oldSocket !== this.socket) {
            return;
        }
        this.shouldConnect = true;

        try {
            const res = await fetch(
                `/api/v1/files/${encodeURIComponent(fileId)}/livedraw?session=${encodeURIComponent(sessionId)}`,
            );
            const data = await res.json();
            const webSocket = new WebSocket(data.url);

            webSocket.onmessage = (event) => {
                networking.recvRaw(event.data);
            };

            webSocket.onclose = () => {
                //Unwanted disconnect
                if (!networking.shouldConnect) {
                    return;
                }
                window.setTimeout(() => networking.connect(webSocket, fileId, sessionId), 1000);
                webSocket.close();
            };

            webSocket.onopen = () => {
                localUser.brushData.setColor('black');
                localUser.brushData.setWidth(10.0);
                localUser.brushData.setBrush('brush');
            };
            this.socket = webSocket;
        } catch (e) {
            console.error(e);
        }
    },
    close() {
        this.shouldConnect = false;
        try {
            this.socket!.close();
        } catch (e) {}
    },
    sendRaw(msg: string) {
        msg = msg.trim();
        if (msg.length == 0) {
            return;
        }
        try {
            this.socket!.send(msg);
        } catch (e) {}
    },
};

let defaultFont = '24px Verdana';

function paintCanvas() {
    requestAnimationFrame(paintCanvas);
    if (!localUser.brushData.brush) {
        return;
    }

    foregroundCanvasCTX.clearRect(0, 0, foregroundCanvas.width, foregroundCanvas.height);

    localUser.brushData.brush.select(localUser, foregroundCanvasCTX, backgroundCanvasCTX);
    localUser.brushData.brush.preview(liveDrawInput.cursorX, liveDrawInput.cursorY, localUser, foregroundCanvasCTX);

    foregroundCanvasCTX.textAlign = 'left';
    foregroundCanvasCTX.textBaseline = 'top';

    for (const user of Object.values(paintUsers)) {
        user.brushData.brush.select(user, foregroundCanvasCTX, backgroundCanvasCTX);
        user.brushData.brush.preview(user.cursorData.x, user.cursorData.y, user, foregroundCanvasCTX);

        foregroundCanvasCTX.font = defaultFont;
        foregroundCanvasCTX.fillText(
            user.name,
            user.cursorData.x + user.brushData.width,
            user.cursorData.y + user.brushData.width,
        );
    }

    finalCanvasCTX.clearRect(0, 0, finalCanvas.width, finalCanvas.height);

    finalCanvasCTX.drawImage(backgroundCanvas, 0, 0);
    finalCanvasCTX.drawImage(foregroundCanvas, 0, 0);

    localUser.brushData.brush.select(localUser, foregroundCanvasCTX, backgroundCanvasCTX);
}

function loadImage(fileId: string, sessionId: string) {
    const baseImage = new Image();
    baseImage.crossOrigin = 'anonymous';

    baseImage.onload = () => {
        const maxWidth = document.getElementById('livedraw-wrapper')!.getBoundingClientRect().width;

        if (baseImage.width > maxWidth) {
            scaleFactor = maxWidth / baseImage.width;
        } else {
            scaleFactor = 1.0;
        }

        defaultFont = 12 / scaleFactor + 'px Verdana';

        networking.connect(undefined, fileId, sessionId);

        backgroundCanvas.width = foregroundCanvas.width = finalCanvas.width = baseImage.width;
        backgroundCanvas.height = foregroundCanvas.height = finalCanvas.height = baseImage.height;

        finalCanvas.style.width = finalCanvas.width * scaleFactor + 'px';
        finalCanvas.style.height = finalCanvas.height * scaleFactor + 'px';

        canvasPos = finalCanvas.getBoundingClientRect();

        backgroundCanvasCTX.drawImage(baseImage, 0, 0);

        imagePattern = backgroundCanvasCTX.createPattern(baseImage, 'no-repeat')!;

        requestAnimationFrame(paintCanvas);
    };
    baseImage.src = LIVEDRAW_FILE!.direct_url;
}

function setupCanvas() {
    backgroundCanvas = document.createElement('canvas');
    foregroundCanvas = document.createElement('canvas');
    finalCanvas = document.getElementById('livedraw') as HTMLCanvasElement;

    backgroundCanvasCTX = backgroundCanvas.getContext('2d')!;
    foregroundCanvasCTX = foregroundCanvas.getContext('2d')!;
    finalCanvasCTX = finalCanvas.getContext('2d')!;

    finalCanvas.addEventListener('mousedown', (event) => liveDrawInput.mouseDown(event), false);
    finalCanvas.addEventListener('mouseup', (event) => liveDrawInput.mouseUp(event, backgroundCanvasCTX), false);
    finalCanvas.addEventListener('mousemove', (event) => liveDrawInput.mouseMove(event, backgroundCanvasCTX), false); // FIX

    finalCanvas.addEventListener('wheel', (event) => liveDrawInput.mouseScroll(event), false);
    finalCanvas.addEventListener('dblclick', (event) => liveDrawInput.doubleClick(event), false);
}

function setupColorSelector() {
    const hlSelector = document.getElementById('color-selector')!;
    const hlSelectorMarker = document.getElementById('color-selector-inner')!;
    const sSelector = document.getElementById('saturisation-selector')!;
    const sSelectorMarker = document.getElementById('saturisation-selector-inner')!;
    const oSelector = document.getElementById('opacity-selector')!;
    const oSelectorMarker = document.getElementById('opacity-selector-inner')!;

    let hue = 0;
    let saturisation = 100;
    let lightness = 0;
    let opacity = 1;

    let hlSelectorDown: boolean;
    let sSelectorDown: boolean;
    let oSelectorDown: boolean;

    function setHSLColor(h: number, s: number, l: number, o: number) {
        localUser.brushData.setColor(
            (hlSelector.style.outlineColor =
                sSelector.style.outlineColor =
                oSelector.style.outlineColor =
                    'hsla(' + h + ', ' + s + '%, ' + l + '%, ' + o + ')'),
        );
    }
    let hlSelectorMouseMoveListener: (this: HTMLElement, event: MouseEvent) => void;
    let sSelectorMouseMoveListener: (this: HTMLElement, event: MouseEvent) => void;
    let oSelectorMouseMoveListener: (this: HTMLElement, event: MouseEvent) => void;

    hlSelector.addEventListener('mousedown', (event) => {
        if (event.button == 0) {
            hlSelectorDown = true;
            hlSelectorMouseMoveListener.call(hlSelector, event);
        }
    });
    hlSelector.addEventListener('mouseup', (event) => {
        if (event.button == 0) hlSelectorDown = false;
    });
    hlSelector.addEventListener(
        'mousemove',
        (hlSelectorMouseMoveListener = (event) => {
            if (!hlSelectorDown) {
                return;
            }

            hue = (event.offsetX / hlSelector.offsetWidth) * 360;
            lightness = (event.offsetY / hlSelector.offsetHeight) * 100;

            const buildStr = '-webkit-linear-gradient(top, hsl(' + hue + ', 100%, ' + lightness + '%), hsl';
            sSelector.style.backgroundImage = buildStr + '(' + hue + ', 0%, ' + lightness + '%))';
            oSelector.style.backgroundImage = buildStr + 'a(' + hue + ', 0%, ' + lightness + '%, ' + opacity + '))';

            hlSelectorMarker.style.left = event.offsetX - 5 + 'px';
            hlSelectorMarker.style.top = event.offsetY - 5 + 'px';

            setHSLColor(hue, saturisation, lightness, opacity);
        }),
    );

    sSelector.addEventListener('mousedown', (event) => {
        if (event.button == 0) {
            sSelectorDown = true;
            sSelectorMouseMoveListener.call(sSelector, event);
        }
    });
    sSelector.addEventListener('mouseup', (event) => {
        if (event.button == 0) sSelectorDown = false;
    });
    sSelector.addEventListener(
        'mousemove',
        (sSelectorMouseMoveListener = (event) => {
            if (!sSelectorDown) {
                return;
            }

            saturisation = (1 - event.offsetY / sSelector.offsetHeight) * 100;

            sSelectorMarker.style.top = event.offsetY + 'px';

            hlSelector.style.backgroundImage =
                '-webkit-linear-gradient(top, black, transparent, white),\
		-webkit-linear-gradient(left, hsl(0, ' +
                saturisation +
                '%, 50%), hsl(60, ' +
                saturisation +
                '%, 50%), hsl(120, ' +
                saturisation +
                '%, 50%),\
		hsl(180, ' +
                saturisation +
                '%, 50%), hsl(240, ' +
                saturisation +
                '%, 50%), hsl(300, ' +
                saturisation +
                '%, 50%), hsl(0, ' +
                saturisation +
                '%, 50%))';

            setHSLColor(hue, saturisation, lightness, opacity);
        }),
    );

    oSelector.addEventListener('mousedown', (event) => {
        if (event.button == 0) {
            oSelectorDown = true;
            oSelectorMouseMoveListener.call(oSelector, event);
        }
    });
    oSelector.addEventListener('mouseup', (event) => {
        if (event.button == 0) oSelectorDown = false;
    });
    oSelector.addEventListener(
        'mousemove',
        (oSelectorMouseMoveListener = (event) => {
            if (!oSelectorDown) {
                return;
            }

            opacity = 1 - event.offsetY / oSelector.offsetHeight;

            oSelectorMarker.style.top = event.offsetY + 'px';

            setHSLColor(hue, saturisation, lightness, opacity);
        }),
    );
}

function setupBrushes() {
    for (const brush in paintBrushes) {
        const pBrush = paintBrushes[brush]!;
        if (pBrush.usesCustomData) {
            localUser.brushData.customData[brush] = {
                ...pBrush.defaultCustomData,
            };
        }
        if (pBrush.setup) {
            pBrush.setup(localUser);
        }
    }
}

export function setBrush(brush: string) {
    localUser.brushData.setBrush(brush);
}

export function setBrushWidth(width: number) {
    localUser.brushData.setWidth(width);
}

export async function setup(fileId: string, sessionId: string) {
    //(document.getElementById('inviteid') as HTMLInputElement).value = document.location.href;
    brushSizeSlider = document.getElementById('brush-width-slider') as HTMLInputElement;
    brushSizeSlider.max = MAX_BRUSH_WIDTH.toString();
    document.getElementById('brush-width-slider-max')!.innerText = MAX_BRUSH_WIDTH.toString();

    LIVEDRAW_FILE = await FileModel.getById(fileId);

    setupCanvas();
    setupColorSelector();
    setupBrushes();
    loadImage(fileId, sessionId);
}

export async function disconnect() {
    networking.close();
}
