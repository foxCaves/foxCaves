var canvasCTX, canvasEle, canvasMaxX, canvasMaxY;
var dancer;

var MathPI2 = Math.PI * 2.0;
var MathPIHalf = Math.PI / 2.0;
var MLOG10 = Math.log(10);
function log10(val) {
return Math.log(val) / MLOG10;
}

function angleOptimize(angle, targetAngle) {
	var angDiff = (angle - targetAngle);
	if(angDiff > Math.PI) {
		return angle - MathPI2;
	} else if(angDiff < -Math.PI) {
		return angle + MathPI2;
	}
	return angle;
}

var TURNSPACE = 200;
var SPECHEIGHT = 20;
var MAXSNAKES = 20;

var SNAKEID = 0;
var allSnakeStates = new Array();

var snakeColors = new Array();
var snakeWidths = new Array();

function audiovisUpdate() {
	var spectrum = dancer.getSpectrum();
	canvasCTX.clearRect(0, 0, canvasEle.width, canvasEle.height);

	var b1, b0, sum, sc, y;
	b0 = 0;
	for(var i=0;i < 128;i++) {
		sum = 0;
		b1 = Math.pow(2, i * 10.0 / (128 - 1));

		if(b1 > 511) b1 = 511;
		if(b1 <= b0) b1 = b0 + 1;
		sc = 10 + b1 - b0;
		while(b0 < b1) {
			sum = sum + spectrum[2 + b0];
			b0 = b0 + 1;
		}
		y = (Math.sqrt(sum / log10(sc)) * 1.7 * SPECHEIGHT) - 4;
		if(y < 1) y = 1;
		if(y > SPECHEIGHT)
			y = SPECHEIGHT;

		snakeWidths[i] = y;
	}

	var baseVol = (snakeWidths[0] / SPECHEIGHT);
	var speed = 1 + (baseVol * 5);

	if(baseVol > 0.5)
		snakeColors.unshift("rgb(255, " + Math.round(255 - ((baseVol - 0.5) * 512)) + ", 0)");
	else if(baseVol == 0.5)
		snakeColors.unshift("rgb(255, 255, 0)");
	else
		snakeColors.unshift("rgb(" + Math.round(baseVol * 512) + ", 255, 0)");

	snakeColors.pop();

	var mergeLikelyness = Math.pow(allSnakeStates.length / MAXSNAKES, 4);

	if(Math.random() < mergeLikelyness) {
		var i = Math.floor(Math.random() * allSnakeStates.length);
		var cSnake = allSnakeStates[i];
		if(!cSnake.targetSnake) {
			i = Math.floor(Math.random() * allSnakeStates.length);
			cSnake.targetSnake = allSnakeStates[i];
			if(cSnake.targetSnake.targetSnake) {
				cSnake.targetSnake = null;
			} else {
				console.log("Merging snakes: ", cSnake.id, cSnake.targetSnake.id);
				cSnake.update = snakeMergeInitMovement;
			}
		}
	}

	for(var i = 0;i < allSnakeStates.length;i++) {
		audiovisUpdateSnake(allSnakeStates[i], speed);
	}
}

function audiovisUpdateSnake(cSnake, speed) {
	var cPos, cPosNext;
	for(var i = 0;i < 128;i++) {
		cPos = cSnake.positions[i];
		cPosNext = cSnake.positions[i + 1];

		canvasCTX.strokeStyle = snakeColors[i];
		canvasCTX.lineWidth = snakeWidths[i];
		canvasCTX.beginPath();
		canvasCTX.moveTo(cPos.x, cPos.y);
		canvasCTX.lineTo(cPosNext.x, cPosNext.y);
		canvasCTX.stroke();
	}

	cSnake.pos = cSnake.positions[0];

	cSnake.angleLock = false;

	cSnake.speed = speed;

	cSnake.update(cSnake);

	speed = cSnake.speed;

	if(speed == 0) {
		cSnake.positions.unshift({
			x: cSnake.pos.x,
			y: cSnake.pos.y
		});
		cSnake.positions.pop();
	} else {
		var rotspeed = speed * 0.01;

		cSnake.angle = angleOptimize(cSnake.angle, cSnake.targetAngle);

		var oldAngle = cSnake.angle;

		if(cSnake.targetAngle != cSnake.angle && Math.abs(cSnake.targetAngle - cSnake.angle) < rotspeed) {
			cSnake.angle = cSnake.targetAngle;
		} if(cSnake.targetAngle > cSnake.angle) {
			cSnake.angle += rotspeed;
		} else if(cSnake.targetAngle < cSnake.angle) {
			cSnake.angle -= rotspeed;
		}

		if(oldAngle != cSnake.angle) {
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

function snakeMergeDoMovement(cSnake) {
	cSnake.angleLock = true;
	while(cSnake.targetSnake.targetSnake && cSnake.targetSnake.mergeFrames) {
		cSnake.targetSnake = cSnake.targetSnake.targetSnake;
	}

	cSnake.pos.x = cSnake.targetSnake.pos.x;
	cSnake.pos.y = cSnake.targetSnake.pos.y;
	cSnake.mergeFrames++;
	cSnake.targetAngle = cSnake.targetSnake.targetAngle;
	cSnake.angle = cSnake.targetSnake.angle;
	if(cSnake.mergeFrames > 130) {
		for(var i = 0;i < allSnakeStates.length;i++) {
			if(allSnakeStates[i].id == cSnake.id) {
				allSnakeStates.splice(i, 1);
				break;
			}
		}

		console.log("Snake merge completed:", cSnake.id);
	}

	cSnake.speed = 0;
}

function snakeMergeInitMovement(cSnake) {
	cSnake.angleLock = true;
	while(cSnake.targetSnake.targetSnake && cSnake.targetSnake.mergeFrames) {
		cSnake.targetSnake = cSnake.targetSnake.targetSnake;
	}

	var yDiff = cSnake.targetSnake.pos.y - cSnake.pos.y;
	var xDiff = cSnake.targetSnake.pos.x - cSnake.pos.x;
	if((!cSnake.lastXDiff) || Math.abs(cSnake.lastXDiff - xDiff) > cSnake.speed || Math.abs(cSnake.lastYDiff - yDiff) > cSnake.speed) {
		cSnake.targetAngle = Math.atan2(yDiff, xDiff);
		cSnake.lastXDiff = xDiff;
		cSnake.lastYDiff = yDiff;
	}

	cSnake.speed += 1;

	if(Math.abs(yDiff) < cSnake.speed && Math.abs(xDiff) < cSnake.speed) {
		cSnake.mergeFrames = 0;
		cSnake.update = snakeMergeDoMovement;
		console.log("Merge phase two of snake:", cSnake.id);
	}
}

function snakeDefaultMovement(cSnake) {
	var cPos = cSnake.pos;

	var tDirX = Math.cos(cSnake.targetAngle);
	var tDirY = Math.sin(cSnake.targetAngle);
	var angleEdit = false;

	cSnake.angleLock = cPos.x >= canvasMaxX || cPos.x <= TURNSPACE || cPos.y >= canvasMaxY || cPos.y <= TURNSPACE;

	if((cPos.x >= canvasMaxX && tDirX > 0) || (cPos.x <= TURNSPACE && tDirX < 0)) {
		tDirX *= -1;
		angleEdit = true;
	}

	if((cPos.y >= canvasMaxY && tDirY > 0) || (cPos.y <= TURNSPACE && tDirY < 0)) {
		tDirY *= -1;
		angleEdit = true;
	}

	if(angleEdit) {
		cSnake.targetAngle = Math.atan2(tDirY, tDirX);
	}
}

function audiovisLoaded() {
	//dancer.play();
}

function dancer_play() {
	dancer.play();
	return false;
}

function makeSnake(bx, by) {
	var cSnake = {
		positions: new Array(),
		targetAngle: (Math.random() * MathPI2),
		update: snakeDefaultMovement,
		speed: 1
	};
	cSnake.angle = cSnake.targetAngle - 0.1;

	if(!bx)
		bx = (Math.random() * (canvasMaxX - TURNSPACE)) + TURNSPACE;
	if(!by)
		by = (Math.random() * (canvasMaxY - TURNSPACE)) + TURNSPACE;

	for(var i = 0;i < 129;i++) {
		cSnake.positions.push({x: bx, y: by});
	}

	cSnake.pos = cSnake.positions[0];

	cSnake.id = SNAKEID++;

	allSnakeStates.push(cSnake);

	return cSnake;
}

var currentlyOnKick = false;

$(document).ready(function() {
	if(!Dancer.isSupported())
		return;

	canvasEle = document.getElementById("audiovis");

	if (document.body && document.body.offsetWidth) {
		winW = document.body.offsetWidth;
		winH = document.body.offsetHeight;
	}
	if (document.compatMode=='CSS1Compat' &&
		document.documentElement &&
		document.documentElement.offsetWidth ) {
		winW = document.documentElement.offsetWidth;
		winH = document.documentElement.offsetHeight;
	}
	if (window.innerWidth && window.innerHeight) {
		winW = window.innerWidth;
		winH = window.innerHeight;
	}


	canvasEle.width = winW;
	canvasEle.height = winH;

	canvasMaxX = canvasEle.width - TURNSPACE;
	canvasMaxY = canvasEle.height - TURNSPACE;

	canvasCTX = canvasEle.getContext("2d");

	canvasCTX.lineCap = "round";

	dancer = new Dancer();

	for(var j = 0;j < 2;j++) {
		makeSnake();
	}

	for(var i = 0;i < 129;i++) {
		snakeColors.push("rgb(0, 255, 0)");
		snakeWidths.push(0);
	}

	var kick = dancer.createKick({
		onKick: function() {
			snakeColors[0] = "rgb(255, 0, 255)";

			for(var j = 0;j < allSnakeStates.length;j++) {
				var cSnake = allSnakeStates[j];
				if(!cSnake.angleLock) {
					cSnake.angle += (Math.random() * Math.PI) - MathPIHalf;
					cSnake.targetAngle = cSnake.angle + ((Math.random() * 0.02) - 0.01);
				}
				if((!currentlyOnKick) && allSnakeStates.length < MAXSNAKES && Math.random() > 0.9) {
					currentlyOnKick = true;
					var newSnake = makeSnake(cSnake.pos.x, cSnake.pos.y);
					for(var i=0;i<129;i++) {
						newSnake.positions[i] = cSnake.positions[i];
					}
					console.log("Splitting snake:", cSnake.id, newSnake.id);
				}
			}
		},
		offKick: function() {
			currentlyOnKick = false;
		}
	});

	dancer.onceAt(0, function() { kick.on(); });

	dancer.bind("loaded", audiovisLoaded);
	dancer.bind("update", audiovisUpdate);
	dancer.load(document.getElementById("audioplayer"));
});