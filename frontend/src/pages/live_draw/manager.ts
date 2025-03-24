/* eslint-disable no-alert */
/* eslint-disable no-case-declarations */
/* eslint-disable max-lines */
import { FileModel } from '../../models/file';
import { assert, logError } from '../../utils/misc';

const MathPIDouble = Math.PI * 2;

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
    IMG_BURST = 'i',
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
    brush?: Brush;
    customData: Partial<Record<BrushName, Record<string, unknown>>>;
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

const paintUsers = new Map<string, RemotePaintUser>();

interface Brush {
    active?: boolean;
    usesCustomData?: boolean;
    keepLineWidth?: boolean;
    keepBackgroundStrokeStyle?: boolean;
    defaultCustomData?: Record<string, string>;
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
    ): boolean | undefined;
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
}

interface Vertex {
    x: number;
    y: number;
}

type BrushName = 'brush' | 'circle' | 'erase' | 'line' | 'polygon' | 'rectangle' | 'restore';

const paintBrushes: Record<BrushName, Brush> = {
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
                Math.hypot(x, y),
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

            const radius = Math.hypot(x, y);

            foregroundCanvasCTX.font = '10px Verdana';
            foregroundCanvasCTX.fillText(`Radius: ${radius}px`, user.cursorData.lastX, user.cursorData.lastY);

            foregroundCanvasCTX.beginPath();
            x = user.cursorData.lastX - x;
            y = user.cursorData.lastY - y;
            foregroundCanvasCTX.arc(
                user.cursorData.lastX,
                user.cursorData.lastY,
                Math.hypot(x, y),
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
        move(_manager, x, y, user, backgroundCanvasCTX): undefined {
            backgroundCanvasCTX.lineCap = 'round';
            backgroundCanvasCTX.strokeStyle = user.brushData.color;

            backgroundCanvasCTX.beginPath();
            backgroundCanvasCTX.moveTo(user.cursorData.lastX, user.cursorData.lastY);
            backgroundCanvasCTX.lineTo(x, y);
            backgroundCanvasCTX.stroke();
            user.cursorData.lastX = x;
            user.cursorData.lastY = y;
            return undefined;
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
            return undefined;
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
            backgroundCanvasCTX.strokeStyle = manager.imagePattern ?? '#000000';
            backgroundCanvasCTX.lineWidth = user.brushData.width * manager.scaleFactor;
            backgroundCanvasCTX.lineCap = 'round';

            backgroundCanvasCTX.beginPath();
            backgroundCanvasCTX.moveTo(user.cursorData.lastX, user.cursorData.lastY);
            backgroundCanvasCTX.lineTo(x, y);
            backgroundCanvasCTX.stroke();
            user.cursorData.lastX = x;
            user.cursorData.lastY = y;
            return undefined;
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
        },
    },

    /*
     * TODO
     * text: {
     *  keepLineWidth: true,
     *  usesCustomData: true,
     *  defaultCustomData: {
     *      text: '',
     *      font: 'Verdana',
     *  },
     *  setup(user) {
     *      if (user !== localUser) return;
     *      // TODO: This should really not be here...
     *      const textInput = document.getElementById('live-draw-text-input') as HTMLInputElement;
     *      const fontInput = document.getElementById('live-draw-font-input') as HTMLInputElement;
     *
     *      function setText(text: string) {
     *          user.brushData.customData.text!.text = text;
     *          networking.sendBrushPacket('text', 'text', text);
     *      }
     *
     *      function setFont(font: string) {
     *          user.brushData.customData.text!.font = font;
     *          networking.sendBrushPacket('text', 'font', font);
     *      }
     *
     *      textInput.addEventListener('input', () => {
     *          setText(textInput.value);
     *      });
     *
     *      fontInput.addEventListener('input', () => {
     *          setFont(fontInput.value);
     *      });
     *  },
     *  select() {},
     *  selectLocal() {
     *      const textInput = document.getElementById('live-draw-text-input') as HTMLInputElement;
     *      const fontInput = document.getElementById('live-draw-font-input') as HTMLInputElement;
     *      textInput.style.display = fontInput.style.display = 'block';
     *  },
     *  unselectLocal() {
     *      const textInput = document.getElementById('live-draw-text-input') as HTMLInputElement;
     *      const fontInput = document.getElementById('live-draw-font-input') as HTMLInputElement;
     *      textInput.style.display = fontInput.style.display = 'none';
     *  },
     *  down() {},
     *  up(x, y, user, backgroundCanvasCTX) {
     *      backgroundCanvasCTX.font = (manager.scaleFactor * user.brushData.width +
     *          'px ' +
     *          user.brushData.customData.text!.font) as string;
     *      backgroundCanvasCTX.textAlign = 'left';
     *      backgroundCanvasCTX.textBaseline = 'top';
     *      backgroundCanvasCTX.fillText(user.brushData.customData.text!.text as string, x, y);
     *  },
     *  move() {
     *      return true;
     *  },
     *  preview(x, y, user, foregroundCanvasCTX) {
     *      foregroundCanvasCTX.font = (manager.scaleFactor * user.brushData.width +
     *          'px ' +
     *          user.brushData.customData.text!.font) as string;
     *      foregroundCanvasCTX.fillText(user.brushData.customData.text!.text as string, x, y);
     *  },
     *  /*,
     * setFontSize(user, fontSize) {
     * user.brushData.customData.text.fontSize = fontSize
     * networking.sendCustomPacket("text", "fontSize", fontSize);
     * }*
     * },
     */
    polygon: {
        /* eslint-disable @typescript-eslint/no-non-null-assertion */
        usesCustomData: true,
        setup(_manager, user) {
            user.brushData.customData.polygon!.vertices = [];
        },
        select() {
            // noop
        },
        down() {
            // noop
        },
        up(_manager, x, y, user) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            (user.brushData.customData.polygon!.vertices as Vertex[]).push({ x, y });
        },
        move() {
            return true;
        },
        preview(_manager, x, y, user, foregroundCanvasCTX) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const vertices = user.brushData.customData.polygon!.vertices as Vertex[];
            if (vertices.length === 0) return;
            const firstVert = vertices[0]!;
            foregroundCanvasCTX.beginPath();
            foregroundCanvasCTX.moveTo(firstVert.x, firstVert.y);
            for (let i = 1; vertices.length > i; ++i) foregroundCanvasCTX.lineTo(vertices[i]!.x, vertices[i]!.y);
            foregroundCanvasCTX.lineTo(x, y);
            foregroundCanvasCTX.lineTo(firstVert.x, firstVert.y);
            foregroundCanvasCTX.fill();
        },
        doubleClick(_manager, _x, _y, user, backgroundCanvasCTX) {
            backgroundCanvasCTX.strokeStyle = user.brushData.color;

            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const vertices = user.brushData.customData.polygon!.vertices as Vertex[];
            if (vertices.length === 0) return;
            const firstVert = vertices[0]!;
            backgroundCanvasCTX.beginPath();
            backgroundCanvasCTX.moveTo(firstVert.x, firstVert.y);
            for (let i = 1; vertices.length > i; ++i) backgroundCanvasCTX.lineTo(vertices[i]!.x, vertices[i]!.y);
            backgroundCanvasCTX.lineTo(firstVert.x, firstVert.y);
            backgroundCanvasCTX.fill();

            // flush the array
            user.brushData.customData.polygon!.vertices = [];
        },
        /* eslint-enable @typescript-eslint/no-non-null-assertion */
    },
};

function makeLocalUser(manager: LiveDrawManager): LocalUser {
    const localUser: LocalUser = {
        local: true,
        brushData: {
            width: 0,
            color: 'black',
            brush: undefined,
            customData: {},
            setWidth(bWidth: number) {
                if (bWidth === this.width) return;
                const strWidth = bWidth.toString();
                this.width = bWidth;
                manager.sliderSetBrushWidth(bWidth);
                this.setBrushAttribsLocal();
                manager.sendDrawEvent(PaintEvent.WIDTH, strWidth);
            },
            setColor(bColor: string) {
                this.color = bColor;
                this.setBrushAttribsLocal();
                manager.sendDrawEvent(PaintEvent.COLOR, bColor);
            },
            setBrush(brush: BrushName) {
                this.brush?.unselectLocal?.();

                this.brush = paintBrushes[brush];
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
                if (localUser.brushData.brush?.keepBackgroundStrokeStyle !== true) {
                    manager.backgroundCanvasCTX.strokeStyle = this.color;
                }

                manager.backgroundCanvasCTX.fillStyle = this.color;

                manager.foregroundCanvasCTX.strokeStyle = this.color;
                manager.foregroundCanvasCTX.fillStyle = this.color;
                if (localUser.brushData.brush?.keepLineWidth !== true) {
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

type NTuple<T, N extends number, R extends T[] = []> = R['length'] extends N ? R : NTuple<T, N, [T, ...R]>;

type StrTuple<N extends number> = NTuple<string, N>;

export class LiveDrawManager {
    public localUser: LocalUser;

    public cursorX = 0;
    public cursorY = 0;
    public isDrawing = false;
    public scaleFactor = 1;

    public defaultFont = '24px Verdana';

    public canvasPos: DOMRect;
    public imagePattern?: CanvasPattern;
    public backgroundCanvasCTX: CanvasRenderingContext2D;
    public foregroundCanvasCTX: CanvasRenderingContext2D;
    public finalCanvasCTX: CanvasRenderingContext2D;

    private shouldConnect = false;
    private socket: WebSocket | undefined = undefined;

    public constructor(
        private readonly finalCanvas: HTMLCanvasElement,
        private readonly backgroundCanvas: HTMLCanvasElement,
        private readonly foregroundCanvas: HTMLCanvasElement,
        public readonly sliderSetBrushWidth: (val: number) => void,
    ) {
        const backgroundCanvasCtx = backgroundCanvas.getContext('2d');
        const foregroundCanvasCtx = foregroundCanvas.getContext('2d');
        const finalCanvasCTX = finalCanvas.getContext('2d');

        if (!backgroundCanvasCtx || !foregroundCanvasCtx || !finalCanvasCTX) {
            throw new Error('failed to acquire drawing contexts');
        }

        this.backgroundCanvasCTX = backgroundCanvasCtx;
        this.foregroundCanvasCTX = foregroundCanvasCtx;
        this.finalCanvasCTX = finalCanvasCTX;

        this.localUser = makeLocalUser(this);
        this.canvasPos = finalCanvas.getBoundingClientRect();
        this.paintCanvas = this.paintCanvas.bind(this);

        this.finalCanvas.addEventListener(
            'mousedown',
            (event) => {
                this.mouseDown(event);
            },
            false,
        );

        this.finalCanvas.addEventListener(
            'mouseup',
            (event) => {
                this.mouseUp(event, this.backgroundCanvasCTX);
            },
            false,
        );

        this.finalCanvas.addEventListener(
            'mousemove',
            (event) => {
                this.mouseMove(event, this.backgroundCanvasCTX);
            },
            false,
        );

        this.finalCanvas.addEventListener(
            'wheel',
            (event) => {
                this.mouseScroll(event);
            },
            false,
        );

        this.finalCanvas.addEventListener(
            'dblclick',
            (event) => {
                this.doubleClick(event);
            },
            false,
        );
    }

    public sendDrawEvent(eventType: PaintEvent, payload: string): void {
        this.sendRaw(eventType + payload);
    }

    public setBrush(brush: string): void {
        this.localUser.brushData.setBrush(brush);
    }

    public setBrushWidth(width: number): void {
        this.localUser.brushData.setWidth(width);
    }

    public setup(file: FileModel, session_id: string): void {
        this.shouldConnect = true;
        this.setupColorSelector();
        this.setupBrushes();
        this.loadImage(file, session_id);
    }

    public destroy(): void {
        this.shouldConnect = false;
        try {
            this.socket?.close();
        } catch {
            // noop
        }
    }

    private sendBrushEvent(eventType: PaintEvent, x: number, y: number): void {
        this.sendDrawEvent(eventType, `${x}|${y}`);
    }

    private calcOffsets(event: MouseEvent): [number, number] {
        let x: number;
        let y: number;

        if (event.offsetX) {
            x = event.offsetX;
            y = event.offsetY;
        } else {
            x = event.pageX - this.canvasPos.left;
            y = event.pageY - this.canvasPos.top;
        }

        x = Math.round(x);
        y = Math.round(y);
        if (x < 0) x = 0;
        if (y < 0) y = 0;

        return [x, y];
    }

    private mouseDown(event: MouseEvent) {
        if (event.button !== 0) {
            return;
        }

        event.preventDefault();

        this.isDrawing = true;

        const [offsetX, offsetY] = this.calcOffsets(event);

        const sendX = offsetX / this.scaleFactor;
        const sendY = offsetY / this.scaleFactor;

        this.localUser.brushData.brush?.down(this, offsetX, offsetY, this.localUser);
        this.sendBrushEvent(PaintEvent.MOUSE_DOWN, sendX, sendY);
    }

    private mouseUp(event: MouseEvent, backgroundCanvasCTX: CanvasRenderingContext2D) {
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

        this.localUser.brushData.brush?.up(this, offsetX, offsetY, this.localUser, backgroundCanvasCTX);
        this.sendBrushEvent(PaintEvent.MOUSE_UP, sendX, sendY);

        this.localUser.cursorData.lastX = 0;
        this.localUser.cursorData.lastY = 0;
    }

    private mouseMove(event: MouseEvent, backgroundCanvasCTX: CanvasRenderingContext2D) {
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

        if (this.localUser.brushData.brush?.move(this, offsetX, offsetY, this.localUser, backgroundCanvasCTX)) {
            this.sendBrushEvent(PaintEvent.MOUSE_CURSOR, sendX, sendY);
        } else {
            this.sendBrushEvent(PaintEvent.MOUSE_MOVE, sendX, sendY);
        }
    }
    private mouseScroll(event: WheelEvent) {
        event.preventDefault();
        const delta = sign(-event.deltaY) * 2;

        this.localUser.brushData.setWidth(clamp(this.localUser.brushData.width + delta, 1, MAX_BRUSH_WIDTH));
    }
    private doubleClick(event: MouseEvent) {
        event.preventDefault();
        const [offsetX, offsetY] = this.calcOffsets(event);
        this.localUser.brushData.brush?.doubleClick?.(this, offsetX, offsetY, this.localUser, this.backgroundCanvasCTX);

        this.cursorX = offsetX;
        this.cursorY = offsetY;

        const sendX = offsetX / this.scaleFactor;
        const sendY = offsetY / this.scaleFactor;

        this.sendBrushEvent(PaintEvent.MOUSE_DOUBLE_CLICK, sendX, sendY);
    }

    private recvRaw(msg: string) {
        msg = msg.trim();
        if (msg.length < 1) {
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        this.recvDirectEvent(msg.charAt(0) as PaintEvent, msg.slice(1));
    }

    private recvDirectEvent(eventType: PaintEvent, payload: string) {
        const commands = payload.split('|');
        if (eventType === PaintEvent.ERROR) {
            this.destroy();
            alert(`Network error: ${commands.join('|')}\nPlease refresh this page to rejoin!`);
            return;
        }

        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
        switch (eventType) {
            case PaintEvent.JOIN:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                const [id, name, widthAsString, color, brush] = commands as [string, string, string, string, BrushName];
                const from: RemotePaintUser = {
                    local: false,
                    name,
                    brushData: {
                        width: Number.parseFloat(widthAsString),
                        color,
                        brush: paintBrushes[brush],
                        customData: {},
                    },
                    cursorData: {
                        x: Number.parseFloat(commands[5] ?? '0') * this.scaleFactor,
                        y: Number.parseFloat(commands[6] ?? '0') * this.scaleFactor,
                        lastX: 0,
                        lastY: 0,
                    },
                };

                paintUsers.set(id, from);

                for (const [iBrush, pBrush] of Object.entries(paintBrushes)) {
                    if (pBrush.usesCustomData) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                        from.brushData.customData[iBrush as BrushName] = { ...pBrush.defaultCustomData };
                    }

                    if (pBrush.setup) {
                        pBrush.setup(this, from);
                    }
                }

                break;
            case PaintEvent.LEAVE:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                paintUsers.delete((commands as [string])[0]);
                break;
            case PaintEvent.IMG_BURST:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                const [, cmd, data] = commands as StrTuple<3>;
                if (cmd === 'r') {
                    this.sendDrawEvent(
                        PaintEvent.IMG_BURST,
                        `${data}|${this.finalCanvas.toDataURL('image/png').replaceAll(/[\n\r]/g, '')}|`,
                    );
                } else if (commands[1] === 'a') {
                    const toSet = new Image();
                    toSet.addEventListener('load', () => {
                        this.backgroundCanvasCTX.drawImage(
                            toSet,
                            0,
                            0,
                            this.finalCanvas.width,
                            this.finalCanvas.height,
                        );
                    });

                    toSet.src = data;
                }

                break;
            default:
                this.recvDrawEvent(eventType, commands);
                break;
        }
    }

    private recvDrawEvent(eventType: PaintEvent, payload: string[]) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const from = paintUsers.get((payload as [string])[0]);
        if (!from) {
            // eslint-disable-next-line no-console
            console.warn('Received draw event for unknown user');
            return;
        }

        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
        switch (eventType) {
            case PaintEvent.MOUSE_CURSOR: {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                const [, xStr, yStr] = payload as StrTuple<3>;
                from.cursorData.x = Number.parseFloat(xStr) * this.scaleFactor;
                from.cursorData.y = Number.parseFloat(yStr) * this.scaleFactor;
                break;
            }

            case PaintEvent.MOUSE_MOVE:
            case PaintEvent.MOUSE_DOWN:
            case PaintEvent.MOUSE_UP:
            case PaintEvent.MOUSE_DOUBLE_CLICK: {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                const [, xStr, yStr] = payload as StrTuple<3>;
                this.recvBrushEvent(from, eventType, Number.parseFloat(xStr), Number.parseFloat(yStr));
                break;
            }

            case PaintEvent.WIDTH:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                from.brushData.width = Number.parseFloat((payload as [string, string])[1]);
                break;
            case PaintEvent.COLOR:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                [, from.brushData.color] = payload as [string, string];
                break;
            case PaintEvent.CUSTOM:
                const { customData } = from.brushData;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                const [brush, key, value] = payload as [BrushName, string, string];
                customData[brush] ??= {};

                customData[brush][key] = value;
                break;
            case PaintEvent.BRUSH:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                from.brushData.brush = paintBrushes[(payload as [string, BrushName])[1]];
                break;
            case PaintEvent.RESET:
                break;
            default:
                // noop
                break;
        }
    }
    private recvBrushEvent(from: User, eventType: PaintEvent, x: number, y: number) {
        x *= this.scaleFactor;
        y *= this.scaleFactor;
        from.cursorData.x = x;
        from.cursorData.y = y;

        const { brush, width, color } = from.brushData;
        // Needed in order to draw correctly
        this.backgroundCanvasCTX.lineWidth = width * this.scaleFactor;
        this.backgroundCanvasCTX.strokeStyle = color;
        this.backgroundCanvasCTX.fillStyle = color;

        if (brush) {
            brush.select(this, from, this.foregroundCanvasCTX, this.backgroundCanvasCTX);

            switch (eventType) {
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
                    brush.doubleClick?.(this, x, y, from, this.backgroundCanvasCTX);
                    break;
                case PaintEvent.WIDTH:
                case PaintEvent.COLOR:
                case PaintEvent.BRUSH:
                case PaintEvent.MOUSE_CURSOR:
                case PaintEvent.CUSTOM:
                case PaintEvent.RESET:
                case PaintEvent.JOIN:
                case PaintEvent.LEAVE:
                case PaintEvent.ERROR:
                case PaintEvent.IMG_BURST:
                    break;
            }
        }

        this.localUser.brushData.setBrushAttribsLocal();

        this.localUser.brushData.brush?.select(this, from, this.foregroundCanvasCTX, this.backgroundCanvasCTX);
    }

    /*
     *private sendBrushPacket(brushName: string, key: string, val: string) {
     *    this.sendRaw(`${PaintEvent.CUSTOM + brushName}|${key}|${val}`);
     *}
     */
    private async netConnect(oldSocket: WebSocket | undefined, file: FileModel, session_id: string) {
        if (!this.shouldConnect) {
            return;
        }

        if (oldSocket && oldSocket !== this.socket) {
            return;
        }

        this.socket?.close();

        try {
            const res = await fetch(
                `/api/v1/files/${encodeURIComponent(file.id)}/live_draw?session=${encodeURIComponent(session_id)}`,
            );

            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const data = (await res.json()) as { url: string };
            const webSocket = new WebSocket(data.url);

            webSocket.addEventListener('message', (event) => {
                if (!this.shouldConnect) {
                    webSocket.close();
                    return;
                }

                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                this.recvRaw(event.data as string);
            });

            webSocket.addEventListener('close', () => {
                // Unwanted disconnect
                if (!this.shouldConnect) {
                    return;
                }

                globalThis.setTimeout(() => {
                    this.netConnect(webSocket, file, session_id).catch(logError);
                }, 1000);

                webSocket.close();
            });

            webSocket.addEventListener('open', () => {
                this.localUser.brushData.setColor('black');
                this.localUser.brushData.setWidth(10);
                this.localUser.brushData.setBrush('brush');
            });

            this.socket = webSocket;
        } catch (error: unknown) {
            logError(error);
        }
    }

    private sendRaw(msg: string) {
        msg = msg.trim();
        if (msg.length === 0) {
            return;
        }

        try {
            this.socket?.send(msg);
        } catch (error: unknown) {
            logError(error);
        }
    }

    private paintCanvas() {
        if (!this.shouldConnect) {
            return;
        }

        requestAnimationFrame(() => {
            this.paintCanvas();
        });

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

        for (const user of paintUsers.values()) {
            user.brushData.brush?.select(this, user, this.foregroundCanvasCTX, this.backgroundCanvasCTX);
            user.brushData.brush?.preview(this, user.cursorData.x, user.cursorData.y, user, this.foregroundCanvasCTX);

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

    private loadImage(file: FileModel, session_id: string) {
        const baseImage = new Image();
        baseImage.crossOrigin = 'anonymous';

        baseImage.addEventListener('load', () => {
            const wrapper = document.getElementById('live-draw-wrapper');
            assert(wrapper);
            const maxWidth = wrapper.getBoundingClientRect().width;

            this.scaleFactor = baseImage.width > maxWidth ? maxWidth / baseImage.width : 1;

            this.defaultFont = `${12 / this.scaleFactor}px Verdana`;

            this.netConnect(undefined, file, session_id).catch(logError);

            // eslint-disable-next-line no-multi-assign
            this.backgroundCanvas.width = this.foregroundCanvas.width = this.finalCanvas.width = baseImage.width;
            // eslint-disable-next-line no-multi-assign
            this.backgroundCanvas.height = this.foregroundCanvas.height = this.finalCanvas.height = baseImage.height;

            this.finalCanvas.style.width = `${this.finalCanvas.width * this.scaleFactor}px`;
            this.finalCanvas.style.height = `${this.finalCanvas.height * this.scaleFactor}px`;

            this.canvasPos = this.finalCanvas.getBoundingClientRect();

            this.backgroundCanvasCTX.drawImage(baseImage, 0, 0);

            this.imagePattern = this.backgroundCanvasCTX.createPattern(baseImage, 'no-repeat') ?? undefined;
            if (!this.imagePattern) {
                // eslint-disable-next-line no-console
                console.warn('failed to create image pattern');
            }

            requestAnimationFrame(() => {
                this.paintCanvas();
            });
        });

        baseImage.src = file.direct_url;
    }

    private setupColorSelector() {
        const hlSelector = document.getElementById('color-selector');
        const hlSelectorMarker = document.getElementById('color-selector-inner');
        const sSelector = document.getElementById('saturation-selector');
        const sSelectorMarker = document.getElementById('saturation-selector-inner');
        const oSelector = document.getElementById('opacity-selector');
        const oSelectorMarker = document.getElementById('opacity-selector-inner');

        assert(hlSelector);
        assert(hlSelectorMarker);
        assert(sSelector);
        assert(sSelectorMarker);
        assert(oSelector);
        assert(oSelectorMarker);

        let hue = 0;
        let saturation = 100;
        let lightness = 0;
        let opacity = 1;

        let hlSelectorDown: boolean;
        let sSelectorDown: boolean;
        let oSelectorDown: boolean;

        const setHSLColor = (h: number, s: number, l: number, o: number) => {
            this.localUser.brushData.setColor(
                (hlSelector.style.outlineColor =
                    // eslint-disable-next-line no-multi-assign
                    sSelector.style.outlineColor =
                    // eslint-disable-next-line no-multi-assign
                    oSelector.style.outlineColor =
                        `hsla(${h}, ${s}%, ${l}%, ${o})`),
            );
        };

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

                const buildStr = `-webkit-linear-gradient(top, hsl(${hue}, 100%, ${lightness}%), hsl`;
                sSelector.style.backgroundImage = `${buildStr}(${hue}, 0%, ${lightness}%))`;
                oSelector.style.backgroundImage = `${buildStr}a(${hue}, 0%, ${lightness}%, ${opacity}))`;

                hlSelectorMarker.style.left = `${event.offsetX - 5}px`;
                hlSelectorMarker.style.top = `${event.offsetY - 5}px`;

                setHSLColor(hue, saturation, lightness, opacity);
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

                saturation = (1 - event.offsetY / sSelector.offsetHeight) * 100;

                sSelectorMarker.style.top = `${event.offsetY}px`;

                hlSelector.style.backgroundImage =
                    `-webkit-linear-gradient(top, black, transparent, white),` +
                    `-webkit-linear-gradient(left, hsl(0, ${saturation}%, 50%), hsl(60, ${saturation}%, 50%), hsl(120, ${saturation}%, 50%),` +
                    `hsl(180, ${saturation}%, 50%), hsl(240, ${saturation}%, 50%), hsl(300, ${saturation}%, 50%), hsl(0, ${saturation}%, 50%))`;

                setHSLColor(hue, saturation, lightness, opacity);
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

                oSelectorMarker.style.top = `${event.offsetY}px`;

                setHSLColor(hue, saturation, lightness, opacity);
            }),
        );
    }

    private setupBrushes() {
        for (const [brush, pBrush] of Object.entries(paintBrushes)) {
            if (pBrush.usesCustomData) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                this.localUser.brushData.customData[brush as BrushName] = {
                    ...pBrush.defaultCustomData,
                };
            }

            if (pBrush.setup) {
                pBrush.setup(this, this.localUser);
            }
        }
    }
}
