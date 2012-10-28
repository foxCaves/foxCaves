var canvasCTX, canvasEle, canvasMaxX, canvasMaxY;
var dancer;
var MathPI2 = Math.PI * 2.0;

var dirX = 1; var dirY = 1;
var targetDirX = 1; var targetDirY = 1;
var speed = 1;

var TURNSPACE = 100;

var snakePositions = new Array();
var snakeColors = new Array();
var snakeWidths = new Array();

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}


var SPECHEIGHT = 20;

var MLOG10 = Math.log(10);
function log10(val) {
  return Math.log(val) / MLOG10;
}

function audiovisUpdate() {
	var spectrum = dancer.getSpectrum();
	canvasCTX.clearRect(0, 0, canvasEle.width, canvasEle.height);
	
	var cPos, b1, b0, sum, sc, y;
	b0 = 0;
	for(var i=0;i<snakePositions.length;i++) {
		sum = 0;
		b1 = Math.pow(2, i * 10.0 / (snakePositions.length - 1));
		
		if(b1 > 511) b1 = 511;
		if(b1 <= b0) b1 = b0 + 1;
		sc = 10 + b1 - b0;
		while(b0 < b1) {
			sum = sum + spectrum[2 + b0];
			b0 = b0 + 1;
		}
		y = (Math.sqrt(sum / log10(sc)) * 1.7 * SPECHEIGHT) - 4;
		if(y < 0) y = 0;
		if(y > SPECHEIGHT) y = SPECHEIGHT;
		
		cPos = snakePositions[i];
		
		canvasCTX.beginPath();
		canvasCTX.fillStyle = snakeColors[i];
		canvasCTX.arc(cPos.x, cPos.y, y + 1, MathPI2, false);
		canvasCTX.fill();
		
		snakeWidths[i] = y;
	}
	
	cPos = snakePositions[0];
	
	if(cPos.x >= canvasMaxX)
		targetDirX = -1;
	else if(cPos.x < TURNSPACE)
		targetDirX = 1;
		
	if(cPos.y >= canvasMaxY)
		targetDirY = -1;
	else if(cPos.y < TURNSPACE)
		targetDirY = 1;
	
	speed = 1 + ((snakeWidths[0] / SPECHEIGHT) * 5);
	var rotspeed = speed * 0.01;
	
	if(targetDirX != dirX && Math.abs(targetDirX - dirX) < rotspeed)
		dirX = targetDirX;
	else if(targetDirX > dirX)
		dirX += rotspeed;
	else if(targetDirX < dirX)
		dirX -= rotspeed;
		
	if(targetDirY != dirY && Math.abs(targetDirY - dirY) < rotspeed)
		dirY = targetDirY;	
	else if(targetDirY > dirY)
		dirY += rotspeed;
	else if(targetDirY < dirY)
		dirY -= rotspeed;
	
	snakePositions.unshift({x: cPos.x + (dirX * speed), y: cPos.y + (dirY * speed)});
	snakePositions.pop();
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
	
	canvasCTX.fillStyle = "green";
	
	dancer = new Dancer();
	
	for(var i=0;i<128;i++) {
		snakePositions.push({x: 0, y: 0});
		var hslrgb = hslToRgb((i / 128), 1, 0.5);
		snakeColors.push("rgb(" + hslrgb[0] + "," + hslrgb[1] + "," + hslrgb[2] + ")");
		snakeWidths.push(0);
	}
	
	var kick = dancer.createKick({
		onKick: function() {
			if(Math.random() > 0.5) {
				targetDirY *= -1;
			} else {
				targetDirX *= -1;
			}
		},
		offKick: function() { }
	});
	
	dancer.onceAt(0, function() { kick.on(); });
	
	dancer.bind("loaded", audiovisLoaded);
	dancer.bind("update", audiovisUpdate);
	dancer.load(document.getElementById("audioplayer"));
});