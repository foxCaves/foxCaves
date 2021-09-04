import { FileModel } from '../../models/file';

const MathPIDouble = Math.PI * 2.0;

const MAX_BRUSH_WIDTH = 200;

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
        manager: LiveDrawManager,
        user: User,
        foregroundCanvasCTX: CanvasRenderingContext2D,
        backgroundCanvasCTX: CanvasRenderingContext2D,
    ): void;
    down(manager: LiveDrawManager, x: number, y: number, user: User): void;
    up(manager: LiveDrawManager, x: number, y: number, user: User, backgroundCanvasCTX: CanvasRenderingContext2D): void;
    move(
        manager: LiveDrawManager,
        x: number,
        y: number,
        user: User,
        backgroundCanvasCTX: CanvasRenderingContext2D,
    ): boolean | void;
    preview(
        manager: LiveDrawManager,
        x: number,
        y: number,
        user: User,
        foregroundCanvasCTX: CanvasRenderingContext2D,
    ): void;
    setup?(manager: LiveDrawManager, user: User): void;
    doubleClick?(
        manager: LiveDrawManager,
        x: number,
        y: number,
        user: User,
        backgroundCanvasCTX: CanvasRenderingContext2D,
    ): void;
    unselectLocal?(): void;
    selectLocal?(
        manager: LiveDrawManager,
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
        select(manager, user, foregroundCanvasCTX, backgroundCanvasCTX) {
            backgroundCanvasCTX.lineCap = 'butt';
            foregroundCanvasCTX.lineWidth = user.brushData.width * manager.scaleFactor;
        },
        down(_manager, x, y, user) {
            user.cursorData.lastX = x;
            user.cursorData.lastY = y;
            this.active = true;
        },
        up(_manager, x, y, user, backgroundCanvasCTX) {
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
        preview(_manager, x, y, user, foregroundCanvasCTX) {
            if (!this.active) return;
            foregroundCanvasCTX.strokeRect(x, y, user.cursorData.lastX - x, user.cursorData.lastY - y);
        },
    },
    circle: {
        select(manager, user, foregroundCanvasCTX, backgroundCanvasCTX) {
            backgroundCanvasCTX.lineCap = 'butt';
            foregroundCanvasCTX.lineWidth = user.brushData.width * manager.scaleFactor;
        },
        down(_manager, x, y, user) {
            this.active = true;
            user.cursorData.lastX = x;
            user.cursorData.lastY = y;
        },
        up(_manager, x, y, user, backgroundCanvasCTX) {
            if (user.cursorData.lastX === x && user.cursorData.lastY === y) {
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
        preview(_manager, x, y, user, foregroundCanvasCTX) {
            if (!this.active) {
                return;
            }

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
        select(manager, _user, foregroundCanvasCTX) {
            foregroundCanvasCTX.lineWidth = 1 / manager.scaleFactor;
        },
        down(_manager, x, y, user) {
            user.cursorData.lastX = x;
            user.cursorData.lastY = y;
        },
        up(manager, x, y, user, backgroundCanvasCTX) {
            if (user.cursorData.lastX === x && user.cursorData.lastY === y) {
                x++;
                y++;
            }

            this.move(manager, x, y, user, backgroundCanvasCTX);
        },
        move(_manager, x, y, user, backgroundCanvasCTX) {
            backgroundCanvasCTX.lineCap = 'round';
            backgroundCanvasCTX.strokeStyle = user.brushData.color;

            backgroundCanvasCTX.beginPath();
            backgroundCanvasCTX.moveTo(user.cursorData.lastX, user.cursorData.lastY);
            backgroundCanvasCTX.lineTo(x, y);
            backgroundCanvasCTX.stroke();
            user.cursorData.lastX = x;
            user.cursorData.lastY = y;
        },
        preview(manager, x, y, user, foregroundCanvasCTX) {
            foregroundCanvasCTX.beginPath();
            foregroundCanvasCTX.arc(x, y, (user.brushData.width / 2) * manager.scaleFactor, 0, MathPIDouble);
            foregroundCanvasCTX.stroke();
        },
    },
    erase: {
        keepLineWidth: true,
        select(manager, _user, foregroundCanvasCTX) {
            foregroundCanvasCTX.lineWidth = 1 / manager.scaleFactor;
            foregroundCanvasCTX.strokeStyle = 'black';
        },
        down(_manager, x, y, user) {
            user.cursorData.lastX = x;
            user.cursorData.lastY = y;
        },
        up(manager, x, y, user, backgroundCanvasCTX) {
            if (user.cursorData.lastX === x && user.cursorData.lastY === y) {
                x++;
                y++;
            }
            this.move(manager, x, y, user, backgroundCanvasCTX);
        },
        move(_manager, x, y, user, backgroundCanvasCTX) {
            backgroundCanvasCTX.lineCap = 'round';
            backgroundCanvasCTX.globalCompositeOperation = 'destination-out';

            backgroundCanvasCTX.beginPath();
            backgroundCanvasCTX.moveTo(user.cursorData.lastX, user.cursorData.lastY);
            backgroundCanvasCTX.lineTo(x, y);
            backgroundCanvasCTX.stroke();
            user.cursorData.lastX = x;
            user.cursorData.lastY = y;
        },
        preview(manager, x, y, user, foregroundCanvasCTX) {
            foregroundCanvasCTX.beginPath();
            foregroundCanvasCTX.arc(x, y, (user.brushData.width / 2) * manager.scaleFactor, 0, MathPIDouble);
            foregroundCanvasCTX.stroke();
        },
    },
    restore: {
        keepLineWidth: true,
        keepBackgroundStrokeStyle: true,
        select(manager, _user, foregroundCanvasCTX) {
            foregroundCanvasCTX.lineWidth = 1 / manager.scaleFactor;
            foregroundCanvasCTX.strokeStyle = 'black';
        },
        down(_manager, x, y, user) {
            user.cursorData.lastX = x;
            user.cursorData.lastY = y;
        },
        up(manager, x, y, user, backgroundCanvasCTX) {
            if (user.cursorData.lastX === x && user.cursorData.lastY === y) {
                x++;
                y++;
            }

            this.move(manager, x, y, user, backgroundCanvasCTX);
        },
        move(manager, x, y, user, backgroundCanvasCTX) {
            // TODO: backgroundCanvasCTX.strokeStyle = imagePattern;
            backgroundCanvasCTX.lineWidth = user.brushData.width * manager.scaleFactor;
            backgroundCanvasCTX.lineCap = 'round';

            backgroundCanvasCTX.beginPath();
            backgroundCanvasCTX.moveTo(user.cursorData.lastX, user.cursorData.lastY);
            backgroundCanvasCTX.lineTo(x, y);
            backgroundCanvasCTX.stroke();
            user.cursorData.lastX = x;
            user.cursorData.lastY = y;
        },
        preview(manager, x, y, user, foregroundCanvasCTX) {
            foregroundCanvasCTX.beginPath();
            foregroundCanvasCTX.arc(x, y, (user.brushData.width / 2) * manager.scaleFactor, 0, MathPIDouble);
            foregroundCanvasCTX.stroke();
        },
    },
    line: {
        select(_manager, user, foregroundCanvasCTX) {
            foregroundCanvasCTX.lineWidth = user.brushData.width;
        },
        down(_manager, x, y, user) {
            user.cursorData.lastX = x;
            user.cursorData.lastY = y;
            this.active = true;
        },
        up(_manager, x, y, user, backgroundCanvasCTX) {
            if (user.cursorData.lastX === x && user.cursorData.lastY === y) {
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
        preview(_manager, x, y, user, foregroundCanvasCTX) {
            if (!this.active) return;
            foregroundCanvasCTX.beginPath();
            foregroundCanvasCTX.moveTo(user.cursorData.lastX, user.cursorData.lastY);
            foregroundCanvasCTX.lineTo(x, y);
            foregroundCanvasCTX.stroke();
            return true;
        },
    },
    /* TODO
    text: {
        keepLineWidth: true,
        usesCustomData: true,
        defaultCustomData: {
            text: '',
            font: 'Verdana',
        },
        setup(user) {
            // if (user !== localUser) return;
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
            backgroundCanvasCTX.font = (manager.scaleFactor * user.brushData.width +
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
            foregroundCanvasCTX.font = (manager.scaleFactor * user.brushData.width +
                'px ' +
                user.brushData.customData.text!.font) as string;
            foregroundCanvasCTX.fillText(user.brushData.customData.text!.text as string, x, y);
        },
        /*,
		setFontSize(user, fontSize) {
			user.brushData.customData.text.fontSize = fontSize
			networking.sendCustomPacket("text", "fontSize", fontSize);
		}*
    },*/
    polygon: {
        usesCustomData: true,
        setup(_manager, user) {
            user.brushData.customData.polygon!.verts = [];
        },
        select() {},
        down() {},
        up(_manager, x, y, user) {
            (user.brushData.customData.polygon!.verts as Vertex[]).push({ x: x, y: y });
        },
        move() {
            return true;
        },
        preview(_manager, x, y, user, foregroundCanvasCTX) {
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
        doubleClick(_manager, _x, _y, user, backgroundCanvasCTX) {
            backgroundCanvasCTX.strokeStyle = user.brushData.color;

            const verts = user.brushData.customData.polygon!.verts as Vertex[];
            if (verts.length === 0) return;
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

function makeLocalUser(manager: LiveDrawManager): LocalUser {
    const localUser: LocalUser = {
        local: true,
        brushData: {
            width: 0,
            color: 'black',
            brush: paintBrushes.pencil!,
            customData: {},
            setWidth(bWidth: number) {
                if (bWidth === this.width) return;
                const strWidth = bWidth.toString();
                this.width = bWidth;
                manager.brushSizeSlider.value = strWidth;
                this.setBrushAttribsLocal();
                manager.sendDrawEvent(PaintEvent.WIDTH, strWidth);
            },
            setColor(bColor: string) {
                this.color = bColor;
                this.setBrushAttribsLocal();
                manager.sendDrawEvent(PaintEvent.COLOR, bColor);
            },
            setBrush(brush: string) {
                if (this.brush && this.brush.unselectLocal) {
                    this.brush.unselectLocal();
                }

                this.brush = paintBrushes[brush]!;
                manager.backgroundCanvasCTX.globalCompositeOperation = 'source-over';

                if (this.brush.selectLocal) {
                    this.brush.selectLocal(
                        manager,
                        localUser,
                        manager.foregroundCanvasCTX,
                        manager.backgroundCanvasCTX,
                    );
                }
                this.brush.select(manager, localUser, manager.foregroundCanvasCTX, manager.backgroundCanvasCTX);
                manager.sendDrawEvent(PaintEvent.BRUSH, brush);
            },
            setBrushAttribsLocal() {
                manager.backgroundCanvasCTX.lineWidth = this.width * manager.scaleFactor;
                if (localUser.brushData.brush && localUser.brushData.brush.keepBackgroundStrokeStyle !== true) {
                    manager.backgroundCanvasCTX.strokeStyle = this.color;
                }
                manager.backgroundCanvasCTX.fillStyle = this.color;

                manager.foregroundCanvasCTX.strokeStyle = this.color;
                manager.foregroundCanvasCTX.fillStyle = this.color;
                if (localUser.brushData.brush && localUser.brushData.brush.keepLineWidth !== true) {
                    manager.foregroundCanvasCTX.lineWidth = this.width * manager.scaleFactor;
                }
            },
        },
        cursorData: {
            x: 0,
            y: 0,
            lastX: 0,
            lastY: 0,
        },
    };
    return localUser;
}

function sign(x: number) {
    return x ? (x < 0 ? -1 : 1) : 0;
}

function clamp(val: number, min: number, max: number) {
    return Math.max(min, Math.min(max, val));
}

export class LiveDrawManager {
    public localUser: LocalUser;

    public cursorX = 0;
    public cursorY = 0;
    public isDrawing = false;
    public scaleFactor = 1.0;

    private shouldConnect = false;
    private socket: WebSocket | undefined = undefined;

    public defaultFont = '24px Verdana';

    public canvasPos: DOMRect;
    public imagePattern?: CanvasPattern;
    public brushSizeSlider: HTMLInputElement;
    public backgroundCanvasCTX: CanvasRenderingContext2D;
    public foregroundCanvasCTX: CanvasRenderingContext2D;
    public finalCanvasCTX: CanvasRenderingContext2D;
    public backgroundCanvas: HTMLCanvasElement;
    public foregroundCanvas: HTMLCanvasElement;
    public finalCanvas: HTMLCanvasElement;

    constructor(
        canvas: HTMLCanvasElement,
        backgroundCanvas: HTMLCanvasElement,
        foregroundCanvas: HTMLCanvasElement,
        brushSizeSlider: HTMLInputElement,
    ) {
        this.brushSizeSlider = brushSizeSlider;

        this.backgroundCanvas = backgroundCanvas;
        this.foregroundCanvas = foregroundCanvas;
        this.finalCanvas = canvas;

        this.backgroundCanvasCTX = backgroundCanvas.getContext('2d')!;
        this.foregroundCanvasCTX = foregroundCanvas.getContext('2d')!;
        this.finalCanvasCTX = canvas.getContext('2d')!;

        this.localUser = makeLocalUser(this);
        this.canvasPos = canvas.getBoundingClientRect();
        this.paintCanvas = this.paintCanvas.bind(this);

        this.finalCanvas.addEventListener('mousedown', (event) => this.mouseDown(event), false);
        this.finalCanvas.addEventListener('mouseup', (event) => this.mouseUp(event, this.backgroundCanvasCTX), false);
        this.finalCanvas.addEventListener(
            'mousemove',
            (event) => this.mouseMove(event, this.backgroundCanvasCTX),
            false,
        ); // FIX

        this.finalCanvas.addEventListener('wheel', (event) => this.mouseScroll(event), false);
        this.finalCanvas.addEventListener('dblclick', (event) => this.doubleClick(event), false);
    }

    calcOffsets(event: MouseEvent): [number, number] {
        let x: number;
        let y: number;

        if (!event.offsetX) {
            x = event.pageX - this.canvasPos.left;
            y = event.pageY - this.canvasPos.top;
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

    mouseDown(event: MouseEvent) {
        if (event.button !== 0) {
            return;
        }
        event.preventDefault();

        this.isDrawing = true;

        const [offsetX, offsetY] = this.calcOffsets(event);

        const sendX = offsetX / this.scaleFactor;
        const sendY = offsetY / this.scaleFactor;

        this.localUser.brushData.brush.down(this, offsetX, offsetY, this.localUser);
        this.sendBrushEvent(PaintEvent.MOUSE_DOWN, sendX, sendY);
    }

    mouseUp(event: MouseEvent, backgroundCanvasCTX: CanvasRenderingContext2D) {
        if (event.button !== 0) {
            return;
        }
        event.preventDefault();

        if (!this.isDrawing) {
            return;
        }
        this.isDrawing = false;

        const [offsetX, offsetY] = this.calcOffsets(event);

        const sendX = offsetX / this.scaleFactor;
        const sendY = offsetY / this.scaleFactor;

        this.localUser.brushData.brush.up(this, offsetX, offsetY, this.localUser, backgroundCanvasCTX);
        this.sendBrushEvent(PaintEvent.MOUSE_UP, sendX, sendY);

        this.localUser.cursorData.lastX = 0;
        this.localUser.cursorData.lastY = 0;
    }
    mouseMove(event: MouseEvent, backgroundCanvasCTX: CanvasRenderingContext2D) {
        event.preventDefault();

        const [offsetX, offsetY] = this.calcOffsets(event);

        this.cursorX = offsetX;
        this.cursorY = offsetY;

        const sendX = offsetX / this.scaleFactor;
        const sendY = offsetY / this.scaleFactor;

        if (!this.isDrawing) {
            this.sendBrushEvent(PaintEvent.MOUSE_CURSOR, sendX, sendY);
            return;
        }

        if (!this.localUser.brushData.brush.move(this, offsetX, offsetY, this.localUser, backgroundCanvasCTX)) {
            this.sendBrushEvent(PaintEvent.MOUSE_MOVE, sendX, sendY);
        } else {
            this.sendBrushEvent(PaintEvent.MOUSE_CURSOR, sendX, sendY);
        }
    }
    mouseScroll(event: WheelEvent) {
        event.preventDefault();
        const delta = sign(-event.deltaY) * 2;

        this.localUser.brushData.setWidth(clamp(this.localUser.brushData.width + delta, 1, MAX_BRUSH_WIDTH));
    }
    doubleClick(event: MouseEvent) {
        event.preventDefault();
        const [offsetX, offsetY] = this.calcOffsets(event);
        if (this.localUser.brushData.brush.doubleClick) {
            this.localUser.brushData.brush.doubleClick(
                this,
                offsetX,
                offsetY,
                this.localUser,
                this.backgroundCanvasCTX,
            );
        }

        this.cursorX = offsetX;
        this.cursorY = offsetY;

        const sendX = offsetX / this.scaleFactor;
        const sendY = offsetY / this.scaleFactor;

        this.sendBrushEvent(PaintEvent.MOUSE_DOUBLE_CLICK, sendX, sendY);
    }

    recvRaw(msg: string) {
        msg = msg.trim();
        if (msg.length < 1) {
            return;
        }
        this.recvDirectEvent(msg.charAt(0) as PaintEvent, msg.substr(1));
    }

    recvDirectEvent(eventype: PaintEvent, payload: string) {
        const commands = payload.split('|');
        if (eventype === PaintEvent.ERROR) {
            this.destroy();
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
                        x: parseFloat(commands[5] || '0') * this.scaleFactor,
                        y: parseFloat(commands[6] || '0') * this.scaleFactor,
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
                        pBrush.setup(this, from);
                    }
                }
                break;
            case PaintEvent.LEAVE:
                delete paintUsers[commands[0]!];
                break;
            case PaintEvent.IMGBURST:
                if (commands[1] === 'r') {
                    this.sendDrawEvent(
                        PaintEvent.IMGBURST,
                        commands[2] + '|' + this.finalCanvas.toDataURL('image/png').replace(/[\r\n]/g, '') + '|',
                    );
                } else if (commands[1] === 'a') {
                    const toSet = new Image();
                    toSet.onload = () => {
                        this.backgroundCanvasCTX.drawImage(
                            toSet,
                            0,
                            0,
                            this.finalCanvas.width,
                            this.finalCanvas.height,
                        );
                    };
                    toSet.src = commands[2]!;
                }
                break;
            default:
                this.recvDrawEvent(eventype, commands);
                break;
        }
    }
    sendDrawEvent(eventype: PaintEvent, payload: string) {
        this.sendRaw(eventype + payload);
    }
    sendBrushEvent(eventype: PaintEvent, x: number, y: number) {
        this.sendDrawEvent(eventype, x + '|' + y);
    }
    recvDrawEvent(eventype: PaintEvent, payload: string[]) {
        const from = paintUsers[payload[0]!]!;
        switch (eventype) {
            case PaintEvent.MOUSE_CURSOR:
                from.cursorData.x = parseFloat(payload[1]!) * this.scaleFactor;
                from.cursorData.y = parseFloat(payload[2]!) * this.scaleFactor;
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
    }
    recvBrushEvent(from: User, eventype: PaintEvent, x: number, y: number) {
        x *= this.scaleFactor;
        y *= this.scaleFactor;
        from.cursorData.x = x;
        from.cursorData.y = y;

        const brush = from.brushData.brush;
        this.backgroundCanvasCTX.lineWidth = from.brushData.width * this.scaleFactor; //Needed in order to draw correctly
        this.backgroundCanvasCTX.strokeStyle = from.brushData.color;
        this.backgroundCanvasCTX.fillStyle = from.brushData.color;

        brush.select(this, from, this.foregroundCanvasCTX, this.backgroundCanvasCTX);

        switch (eventype) {
            case PaintEvent.MOUSE_DOWN:
                brush.down(this, x, y, from);
                break;
            case PaintEvent.MOUSE_UP:
                brush.up(this, x, y, from, this.backgroundCanvasCTX);
                break;
            case PaintEvent.MOUSE_MOVE:
                brush.move(this, x, y, from, this.backgroundCanvasCTX);
                break;
            case PaintEvent.MOUSE_DOUBLE_CLICK:
                brush.doubleClick!(this, x, y, from, this.backgroundCanvasCTX);
                break;
        }

        this.localUser.brushData.setBrushAttribsLocal();

        this.localUser.brushData.brush.select(this, from, this.foregroundCanvasCTX, this.backgroundCanvasCTX);
    }
    sendBrushPacket(brushName: string, key: string, val: string) {
        this.sendRaw(PaintEvent.CUSTOM + brushName + '|' + key + '|' + val);
    }
    async netConnect(oldSocket: WebSocket | undefined, file: FileModel, sessionId: string) {
        if (!this.shouldConnect) {
            return;
        }

        if (oldSocket && oldSocket !== this.socket) {
            return;
        }

        this.socket?.close();

        try {
            const res = await fetch(
                `/api/v1/files/${encodeURIComponent(file.id)}/livedraw?session=${encodeURIComponent(sessionId)}`,
            );
            const data = await res.json();
            const webSocket = new WebSocket(data.url);

            webSocket.onmessage = (event) => {
                if (!this.shouldConnect) {
                    webSocket.close();
                    return;
                }
                this.recvRaw(event.data);
            };

            webSocket.onclose = () => {
                //Unwanted disconnect
                if (!this.shouldConnect) {
                    return;
                }
                window.setTimeout(() => this.netConnect(webSocket, file, sessionId), 1000);
                webSocket.close();
            };

            webSocket.onopen = () => {
                this.localUser.brushData.setColor('black');
                this.localUser.brushData.setWidth(10.0);
                this.localUser.brushData.setBrush('brush');
            };
            this.socket = webSocket;
        } catch (e) {
            console.error(e);
        }
    }

    sendRaw(msg: string) {
        msg = msg.trim();
        if (msg.length === 0) {
            return;
        }
        try {
            this.socket!.send(msg);
        } catch (e) {}
    }

    paintCanvas() {
        if (!this.shouldConnect) {
            return;
        }

        requestAnimationFrame(this.paintCanvas);
        if (!this.localUser.brushData.brush) {
            return;
        }

        this.foregroundCanvasCTX.clearRect(0, 0, this.foregroundCanvas.width, this.foregroundCanvas.height);

        this.localUser.brushData.brush.select(this, this.localUser, this.foregroundCanvasCTX, this.backgroundCanvasCTX);
        this.localUser.brushData.brush.preview(
            this,
            this.cursorX,
            this.cursorY,
            this.localUser,
            this.foregroundCanvasCTX,
        );

        this.foregroundCanvasCTX.textAlign = 'left';
        this.foregroundCanvasCTX.textBaseline = 'top';

        for (const user of Object.values(paintUsers)) {
            user.brushData.brush.select(this, user, this.foregroundCanvasCTX, this.backgroundCanvasCTX);
            user.brushData.brush.preview(this, user.cursorData.x, user.cursorData.y, user, this.foregroundCanvasCTX);

            this.foregroundCanvasCTX.font = this.defaultFont;
            this.foregroundCanvasCTX.fillText(
                user.name,
                user.cursorData.x + user.brushData.width,
                user.cursorData.y + user.brushData.width,
            );
        }

        this.finalCanvasCTX.clearRect(0, 0, this.finalCanvas.width, this.finalCanvas.height);

        this.finalCanvasCTX.drawImage(this.backgroundCanvas, 0, 0);
        this.finalCanvasCTX.drawImage(this.foregroundCanvas, 0, 0);

        this.localUser.brushData.brush.select(this, this.localUser, this.foregroundCanvasCTX, this.backgroundCanvasCTX);
    }

    loadImage(file: FileModel, sessionId: string) {
        const baseImage = new Image();
        baseImage.crossOrigin = 'anonymous';

        baseImage.onload = () => {
            const maxWidth = document.getElementById('livedraw-wrapper')!.getBoundingClientRect().width;

            if (baseImage.width > maxWidth) {
                this.scaleFactor = maxWidth / baseImage.width;
            } else {
                this.scaleFactor = 1.0;
            }

            this.defaultFont = 12 / this.scaleFactor + 'px Verdana';

            this.netConnect(undefined, file, sessionId);

            this.backgroundCanvas.width = this.foregroundCanvas.width = this.finalCanvas.width = baseImage.width;
            this.backgroundCanvas.height = this.foregroundCanvas.height = this.finalCanvas.height = baseImage.height;

            this.finalCanvas.style.width = this.finalCanvas.width * this.scaleFactor + 'px';
            this.finalCanvas.style.height = this.finalCanvas.height * this.scaleFactor + 'px';

            this.canvasPos = this.finalCanvas.getBoundingClientRect();

            this.backgroundCanvasCTX.drawImage(baseImage, 0, 0);

            this.imagePattern = this.backgroundCanvasCTX.createPattern(baseImage, 'no-repeat')!;

            requestAnimationFrame(this.paintCanvas);
        };
        baseImage.src = file.direct_url;
    }

    setupColorSelector() {
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

        const manager = this;

        function setHSLColor(h: number, s: number, l: number, o: number) {
            manager.localUser.brushData.setColor(
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
            if (event.button === 0) {
                hlSelectorDown = true;
                hlSelectorMouseMoveListener.call(hlSelector, event);
            }
        });
        hlSelector.addEventListener('mouseup', (event) => {
            if (event.button === 0) hlSelectorDown = false;
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
            if (event.button === 0) {
                sSelectorDown = true;
                sSelectorMouseMoveListener.call(sSelector, event);
            }
        });
        sSelector.addEventListener('mouseup', (event) => {
            if (event.button === 0) sSelectorDown = false;
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
                    '-webkit-linear-gradient(top, black, transparent, white),' +
                    '-webkit-linear-gradient(left, hsl(0, ' +
                    saturisation +
                    '%, 50%), hsl(60, ' +
                    saturisation +
                    '%, 50%), hsl(120, ' +
                    saturisation +
                    '%, 50%),' +
                    'hsl(180, ' +
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
            if (event.button === 0) {
                oSelectorDown = true;
                oSelectorMouseMoveListener.call(oSelector, event);
            }
        });
        oSelector.addEventListener('mouseup', (event) => {
            if (event.button === 0) oSelectorDown = false;
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

    setupBrushes() {
        for (const brush in paintBrushes) {
            const pBrush = paintBrushes[brush]!;
            if (pBrush.usesCustomData) {
                this.localUser.brushData.customData[brush] = {
                    ...pBrush.defaultCustomData,
                };
            }
            if (pBrush.setup) {
                pBrush.setup(this, this.localUser);
            }
        }
    }

    setBrush(brush: string) {
        this.localUser.brushData.setBrush(brush);
    }

    setBrushWidth(width: number) {
        this.localUser.brushData.setWidth(width);
    }

    async setup(file: FileModel, sessionId: string) {
        this.shouldConnect = true;
        this.setupColorSelector();
        this.setupBrushes();
        this.loadImage(file, sessionId);
    }

    async destroy() {
        this.shouldConnect = false;
        try {
            this.socket!.close();
        } catch (e) {}
    }
}
