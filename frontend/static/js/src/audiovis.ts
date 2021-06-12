let canvasCTX: CanvasRenderingContext2D;
let canvasEle: HTMLCanvasElement;

let canvasMaxX: number;
let canvasMaxY: number;

const MathPI2 = Math.PI * 2.0;
const MathPIHalf = Math.PI / 2.0;
let dancerInstance: dancer.Dancer;

interface Position {
	x: number;
	y: number;
}

interface Snake {
	positions: Position[],
	targetAngle: number;
	update(snake: Snake): void;
	speed: number;
	angle: number;
	pos: Position;
	id: number;
	angleLock: boolean;
	targetSnake?: Snake;
	mergeFrames: number;
	lastXDiff: number;
	lastYDiff: number;
	dirX: number;
	dirY: number;
}

function angleOptimize(angle: number, targetAngle: number) {
	const angDiff = (angle - targetAngle);
	if (angDiff > Math.PI) {
		return angle - MathPI2;
	}
	if (angDiff < -Math.PI) {
		return angle + MathPI2;
	}
	return angle;
}

const TURNSPACE = 200;
const SPECHEIGHT = 20;
const MAXSNAKES = 20;

let SNAKEID = 0;
const allSnakeStates = new Array();

const snakeColors = new Array();
const snakeWidths = new Array();

function audiovisUpdate(dancer: dancer.Dancer) {
	const spectrum = dancer.getSpectrum();
	canvasCTX.clearRect(0, 0, canvasEle.width, canvasEle.height);

	let b0 = 0;

	for (let i = 0; i < 128; i++) {
		let sum = 0;
		let b1 = Math.pow(2, i * 10.0 / (128 - 1));

		if (b1 > 511) b1 = 511;
		if (b1 <= b0) b1 = b0 + 1;
		const sc = 10 + b1 - b0;
		while (b0 < b1) {
			sum = sum + spectrum[2 + b0]!;
			b0 = b0 + 1;
		}
		let y = (Math.sqrt(sum / Math.log10(sc)) * 1.7 * SPECHEIGHT) - 4;
		if (y < 1) y = 1;
		if (y > SPECHEIGHT)
			y = SPECHEIGHT;

		snakeWidths[i] = y;
	}

	const baseVol = (snakeWidths[0] / SPECHEIGHT);
	const speed = 1 + (baseVol * 5);

	if (baseVol > 0.5)
		snakeColors.unshift("rgb(255, " + Math.round(255 - ((baseVol - 0.5) * 512)) + ", 0)");
	else if (baseVol == 0.5)
		snakeColors.unshift("rgb(255, 255, 0)");
	else
		snakeColors.unshift("rgb(" + Math.round(baseVol * 512) + ", 255, 0)");

	snakeColors.pop();

	const mergeLikelyness = Math.pow(allSnakeStates.length / MAXSNAKES, 4);

	if (Math.random() < mergeLikelyness) {
		let i = Math.floor(Math.random() * allSnakeStates.length);
		const cSnake = allSnakeStates[i];
		if (!cSnake.targetSnake) {
			i = Math.floor(Math.random() * allSnakeStates.length);
			cSnake.targetSnake = allSnakeStates[i];
			if (cSnake.targetSnake.targetSnake) {
				cSnake.targetSnake = null;
			} else {
				console.log("Merging snakes: ", cSnake.id, cSnake.targetSnake.id);
				cSnake.update = snakeMergeInitMovement;
			}
		}
	}

	for (let i = 0; i < allSnakeStates.length; i++) {
		audiovisUpdateSnake(allSnakeStates[i], speed);
	}
}

function audiovisUpdateSnake(cSnake: Snake, speed: number) {
	let cPos: Position;
	let cPosNext: Position;
	for (let i = 0; i < 128; i++) {
		cPos = cSnake.positions[i]!;
		cPosNext = cSnake.positions[i + 1]!;

		canvasCTX.strokeStyle = snakeColors[i];
		canvasCTX.lineWidth = snakeWidths[i];
		canvasCTX.beginPath();
		canvasCTX.moveTo(cPos.x, cPos.y);
		canvasCTX.lineTo(cPosNext.x, cPosNext.y);
		canvasCTX.stroke();
	}

	cSnake.pos = cSnake.positions[0]!;

	cSnake.angleLock = false;

	cSnake.speed = speed;

	cSnake.update(cSnake);

	speed = cSnake.speed;

	if (speed == 0) {
		cSnake.positions.unshift({
			x: cSnake.pos.x,
			y: cSnake.pos.y
		});
		cSnake.positions.pop();
	} else {
		const rotspeed = speed * 0.01;

		cSnake.angle = angleOptimize(cSnake.angle, cSnake.targetAngle);

		const oldAngle = cSnake.angle;

		if (cSnake.targetAngle != cSnake.angle && Math.abs(cSnake.targetAngle - cSnake.angle) < rotspeed) {
			cSnake.angle = cSnake.targetAngle;
		} if (cSnake.targetAngle > cSnake.angle) {
			cSnake.angle += rotspeed;
		} else if (cSnake.targetAngle < cSnake.angle) {
			cSnake.angle -= rotspeed;
		}

		if (oldAngle != cSnake.angle) {
			cSnake.dirX = Math.cos(cSnake.angle);
			cSnake.dirY = Math.sin(cSnake.angle);
		}

		cSnake.positions.unshift({
			x: cSnake.pos.x + (cSnake.dirX * speed),
			y: cSnake.pos.y + (cSnake.dirY * speed)
		});
		cSnake.positions.pop();
	}
}

function snakeMergeDoMovement(cSnake: Snake) {
	cSnake.angleLock = true;
	while (cSnake.targetSnake!.targetSnake && cSnake.targetSnake!.mergeFrames) {
		cSnake.targetSnake = cSnake.targetSnake!.targetSnake;
	}

	const targetSnake = cSnake.targetSnake!;

	cSnake.pos.x = targetSnake.pos.x;
	cSnake.pos.y = targetSnake.pos.y;
	cSnake.mergeFrames++;
	cSnake.targetAngle = targetSnake.targetAngle;
	cSnake.angle = targetSnake.angle;
	if (cSnake.mergeFrames > 130) {
		for (let i = 0; i < allSnakeStates.length; i++) {
			if (allSnakeStates[i].id == cSnake.id) {
				allSnakeStates.splice(i, 1);
				break;
			}
		}

		console.log("Snake merge completed:", cSnake.id);
	}

	cSnake.speed = 0;
}

function snakeMergeInitMovement(cSnake: Snake) {
	cSnake.angleLock = true;
	while (cSnake.targetSnake?.targetSnake && cSnake.targetSnake.mergeFrames) {
		cSnake.targetSnake = cSnake.targetSnake.targetSnake;
	}


	const yDiff = cSnake.targetSnake!.pos.y - cSnake.pos.y;
	const xDiff = cSnake.targetSnake!.pos.x - cSnake.pos.x;
	if ((!cSnake.lastXDiff) || Math.abs(cSnake.lastXDiff - xDiff) > cSnake.speed || Math.abs(cSnake.lastYDiff - yDiff) > cSnake.speed) {
		cSnake.targetAngle = Math.atan2(yDiff, xDiff);
		cSnake.lastXDiff = xDiff;
		cSnake.lastYDiff = yDiff;
	}

	cSnake.speed += 1;

	if (Math.abs(yDiff) < cSnake.speed && Math.abs(xDiff) < cSnake.speed) {
		cSnake.mergeFrames = 0;
		cSnake.update = snakeMergeDoMovement;
		console.log("Merge phase two of snake:", cSnake.id);
	}
}

function snakeDefaultMovement(cSnake: Snake) {
	const cPos = cSnake.pos;

	let tDirX = Math.cos(cSnake.targetAngle);
	let tDirY = Math.sin(cSnake.targetAngle);
	let angleEdit = false;

	cSnake.angleLock = cPos.x >= canvasMaxX || cPos.x <= TURNSPACE || cPos.y >= canvasMaxY || cPos.y <= TURNSPACE;

	if ((cPos.x >= canvasMaxX && tDirX > 0) || (cPos.x <= TURNSPACE && tDirX < 0)) {
		tDirX *= -1;
		angleEdit = true;
	}

	if ((cPos.y >= canvasMaxY && tDirY > 0) || (cPos.y <= TURNSPACE && tDirY < 0)) {
		tDirY *= -1;
		angleEdit = true;
	}

	if (angleEdit) {
		cSnake.targetAngle = Math.atan2(tDirY, tDirX);
	}
}

function audiovisLoaded() {
	//dancer.play();
}

function dancer_play() {
	dancerInstance.play();
	return false;
}

function makeSnake(bx?: number, by?: number): Snake {
	const targetAngle = (Math.random() * MathPI2);
	const positions: Position[] = [];
	if (!bx)
		bx = (Math.random() * (canvasMaxX - TURNSPACE)) + TURNSPACE;
	if (!by)
		by = (Math.random() * (canvasMaxY - TURNSPACE)) + TURNSPACE;
	for (let i = 0; i < 129; i++) {
		positions.push({ x: bx, y: by });
	}
	const cSnake: Snake = {
		positions,
		targetAngle: targetAngle,
		update: snakeDefaultMovement,
		speed: 1,
		angle: targetAngle - 0.1,
		pos: positions[0]!,
		angleLock: false,
		id: SNAKEID++,
		mergeFrames: 0,
		lastXDiff: 0,
		lastYDiff: 0,
		dirX: 0,
		dirY: 0,
	};

	allSnakeStates.push(cSnake);

	return cSnake;
}

let currentlyOnKick = false;

$(() => {
	canvasEle = document.getElementById("audiovis") as HTMLCanvasElement;

	let winH: number;
	let winW: number;

	if (document.body && document.body.offsetWidth) {
		winW = document.body.offsetWidth;
		winH = document.body.offsetHeight;
	}
	if (document.compatMode == 'CSS1Compat' &&
		document.documentElement &&
		document.documentElement.offsetWidth) {
		winW = document.documentElement.offsetWidth;
		winH = document.documentElement.offsetHeight;
	}
	if (window.innerWidth && window.innerHeight) {
		winW = window.innerWidth;
		winH = window.innerHeight;
	}


	canvasEle.width = winW!;
	canvasEle.height = winH!;

	canvasMaxX = canvasEle.width - TURNSPACE;
	canvasMaxY = canvasEle.height - TURNSPACE;

	canvasCTX = canvasEle.getContext("2d")!;

	canvasCTX.lineCap = "round";

	dancerInstance = new dancer.Dancer();

	for (let j = 0; j < 2; j++) {
		makeSnake();
	}

	for (let i = 0; i < 129; i++) {
		snakeColors.push("rgb(0, 255, 0)");
		snakeWidths.push(0);
	}

	const kick = dancerInstance.createKick({
		onKick() {
			snakeColors[0] = "rgb(255, 0, 255)";

			for (let j = 0; j < allSnakeStates.length; j++) {
				const cSnake = allSnakeStates[j];
				if (!cSnake.angleLock) {
					cSnake.angle += (Math.random() * Math.PI) - MathPIHalf;
					cSnake.targetAngle = cSnake.angle + ((Math.random() * 0.02) - 0.01);
				}
				if ((!currentlyOnKick) && allSnakeStates.length < MAXSNAKES && Math.random() > 0.9) {
					currentlyOnKick = true;
					const newSnake = makeSnake(cSnake.pos.x, cSnake.pos.y);
					for (let i = 0; i < 129; i++) {
						newSnake.positions[i] = cSnake.positions[i];
					}
					console.log("Splitting snake:", cSnake.id, newSnake.id);
				}
			}
		},
		offKick() {
			currentlyOnKick = false;
		}
	});

	dancerInstance.onceAt(0, function () { kick.on(); });

	dancerInstance.bind("loaded", audiovisLoaded);
	dancerInstance.bind("update", () => audiovisUpdate(dancerInstance));
	dancerInstance.load(document.getElementById("audioplayer") as HTMLAudioElement);
});
