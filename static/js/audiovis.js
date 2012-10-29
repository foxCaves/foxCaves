var canvasCTX, canvasEle, canvasMaxX, canvasMaxY;
var dancer;

var MathPI2 = Math.PI * 2.0;
var MLOG10 = Math.log(10);
function log10(val) {
  return Math.log(val) / MLOG10;
}

var TURNSPACE = 100;
var SPECHEIGHT = 20;

var allSnakeStates = new Array();

var snakeColors = new Array();
var snakeWidths = new Array();

function audiovisUpdate() {
	var spectrum = dancer.getSpectrum();
	canvasCTX.clearRect(0, 0, canvasEle.width, canvasEle.height);
	
	var b1, b0, sum, sc, y;
	b0 = 0;
	for(var i=0;i<128;i++) {
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
		if(y > SPECHEIGHT) y = SPECHEIGHT;
		
		snakeWidths[i] = y;
	}
	
	var baseVol = (snakeWidths[0] / SPECHEIGHT);
	var speed = 1 + (baseVol * 5);
	var rotspeed = speed * 0.01;
	
	if(baseVol > 0.5)
		snakeColors.unshift("rgb(255, " + Math.round(255 - ((baseVol - 0.5) * 512)) + ", 0)");
	else if(baseVol == 0.5)
		snakeColors.unshift("rgb(255, 255, 0)");
	else
		snakeColors.unshift("rgb(" + Math.round(baseVol * 512) + ", 255, 0)");
		
	snakeColors.pop();

	for(var i=0;i<allSnakeStates.length;i++) {
		audiovisUpdateSnake(allSnakeStates[i], speed, rotspeed);
	}
}

function audiovisUpdateSnake(cSnake, speed, rotspeed) {
	var cPos, cPosNext;
	for(var i=0;i<128;i++) {
		cPos = cSnake.positions[i];
		cPosNext = cSnake.positions[i + 1];
		
		canvasCTX.strokeStyle = snakeColors[i];
		canvasCTX.lineWidth = snakeWidths[i];
		canvasCTX.beginPath();
		canvasCTX.moveTo(cPos.x, cPos.y);
		canvasCTX.lineTo(cPosNext.x, cPosNext.y);
		canvasCTX.stroke();
	}
	
	cPos = cSnake.positions[0];
	
	var tDirX = Math.sin(cSnake.targetAngle);
	var tDirY = Math.cos(cSnake.targetAngle);
	
	if((cPos.x >= canvasMaxX && tDirX > 0) || (cPos.x <= TURNSPACE && tDirX < 0)) {
		tDirX *= -1;
		cSnake.targetAngle = Math.asin(tDirX);
		var ttDirY = Math.cos(cSnake.targetAngle);
		if(tDirY != ttDirY) {
			cSnake.targetAngle *= -1;
		}
	}
	
	if((cPos.y >= canvasMaxY && tDirY > 0) || (cPos.y <= TURNSPACE && tDirY < 0)) {
		tDirY *= -1;
		cSnake.targetAngle = Math.acos(tDirY);
		var ttDirX = Math.sin(cSnake.targetAngle);
		if(tDirX != ttDirX) {
			cSnake.targetAngle *= -1;
		}		
	}
	
	var oldAngle = cSnake.angle;
	
	if(cSnake.targetAngle != cSnake.angle && Math.abs(cSnake.targetAngle - cSnake.angle) < rotspeed) {
		cSnake.angle = cSnake.targetAngle;
	} if(cSnake.targetAngle > cSnake.angle) {
		cSnake.angle += rotspeed;
	} else if(cSnake.targetAngle < cSnake.angle) {
		cSnake.angle -= rotspeed;
	}
	
	if(oldAngle != cSnake.angle) {
		cSnake.dirX = Math.sin(cSnake.angle);
		cSnake.dirY = Math.cos(cSnake.angle);
	}
	
	cSnake.positions.unshift({
		x: cPos.x + (cSnake.dirX * speed),
		y: cPos.y + (cSnake.dirY * speed)
	});
	cSnake.positions.pop();
}

function audiovisLoaded() {
	//dancer.play();
}

function dancer_play() {
	dancer.play();
	return false;
}

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
	
	for(var j=0;j<4;j++) {
		var cSnake = {
			positions: new Array(),
			targetAngle: (Math.random() * MathPI2)
		};
		
		var bx = (Math.random() * (canvasMaxX - TURNSPACE)) + TURNSPACE;
		var by = (Math.random() * (canvasMaxY - TURNSPACE)) + TURNSPACE;
		
		for(var i=0;i<129;i++) {
			cSnake.positions.push({x: bx, y: by});
			snakeWidths.push(0);
		}
		
		allSnakeStates.push(cSnake);
	}
	
	for(var i=0;i<128;i++) {
		snakeColors.push("rgb(0, 255, 0)");
	}
	
	var kick = dancer.createKick({
		onKick: function() {
			snakeColors[0] = "rgb(255, 0, 255)";
			
			for(var j=0;j<allSnakeStates.length;j++) {
				if(Math.random() > 0.5) {
					allSnakeStates[j].targetDirY *= -1;
				} else {
					allSnakeStates[j].targetDirX *= -1;
				}
			}
		},
		offKick: function() { }
	});
	
	dancer.onceAt(0, function() { kick.on(); });
	
	dancer.bind("loaded", audiovisLoaded);
	dancer.bind("update", audiovisUpdate);
	dancer.load(document.getElementById("audioplayer"));
});