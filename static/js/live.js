var MathPI2 = Math.PI * 2.0;

var canvasCTX, canvasEle, canvasImg;
var canvasStableImageData, canvasStableImageDataNeeded;

var isDrawing = false;
var scaleFactor = 1.0;

var brushWidth , brushColor, currentBrush;
var brushState = {};

var paintUsers = new Array();

var EVENT_WIDTH = "w";
var EVENT_COLOR = "c";
var EVENT_BRUSH = "b";
var EVENT_MOUSE_UP = "u";
var EVENT_MOUSE_DOWN = "d";
var EVENT_MOUSE_MOVE = "m";
var EVENT_MOUSE_CURSOR = "c";

var EVENT_RESET = "r";

var EVENT_JOIN = "j";
var EVENT_LEAVE = "l";

function recvRaw(msg) {
	//TODO: Call this!
	console.log("<< "+msg);
	recvDirectEvent(msg.charAt(0), msg.substr(1));
}

function sendRaw(msg) {
	console.log(">> "+msg);
	//TODO: Network send
}

var paintBrushes = {
	rectangle: {
		select: function() {
			canvasCTX.lineCap = "butt";
			canvasStableImageDataNeeded = true;
		},
		down: function(x, y, brushState) {
			brushState.lastX = x;
			brushState.lastY = y;
		},
		up: function(x, y, brushState) {
			canvasCTX.strokeRect(x, y, brushState.lastX - x, brushState.lastY - y);
		},
		move: function(x, y, brushState) {
			canvasCTX.strokeRect(x, y, brushState.lastX - x, brushState.lastY - y);
			return true;
		}
	},
	circle: {
		select: function() {
			canvasCTX.lineCap = "butt";
			canvasStableImageDataNeeded = true;
		},
		down: function(x, y, brushState) {
			brushState.lastX = x;
			brushState.lastY = y;
		},
		up: function(x, y, brushState) {
			canvasCTX.beginPath();
			x = brushState.lastX - x;
			y = brushState.lastY - y;
			canvasCTX.arc(brushState.lastX, brushState.lastY, Math.sqrt(x*x + y*y), 0, MathPI2, false);
			canvasCTX.stroke();
		},
		move: function(x, y, brushState) {
			canvasCTX.beginPath();
			x = brushState.lastX - x;
			y = brushState.lastY - y;
			canvasCTX.arc(brushState.lastX, brushState.lastY, Math.sqrt(x*x + y*y), 0, MathPI2, false);
			canvasCTX.stroke();
			return true;
		}
	},
	brush: {
		select: function() {
			canvasCTX.lineCap = "round";
		},
		down: function(x, y, brushState) {
			brushState.lastX = x;
			brushState.lastY = y;
		},
		up: function(x, y, brushState) {
			canvasCTX.beginPath();
			canvasCTX.moveTo(brushState.lastX, brushState.lastY);
			canvasCTX.lineTo(x, y);
			canvasCTX.stroke();			
		},
		move: function(x, y, brushState) {
			canvasCTX.beginPath();
			canvasCTX.moveTo(brushState.lastX, brushState.lastY);
			canvasCTX.lineTo(x, y);
			canvasCTX.stroke();
			brushState.lastX = x;
			brushState.lastY = y;
		}
	},
	line: {
		select: function() {
			canvasCTX.lineCap = "butt";
			canvasStableImageDataNeeded = true;
		},
		down: function(x, y, brushState) {
			brushState.lastX = x;
			brushState.lastY = y;
		},
		up: function(x, y, brushState) {
			canvasCTX.beginPath();
			canvasCTX.moveTo(brushState.lastX, brushState.lastY);
			canvasCTX.lineTo(x, y);
			canvasCTX.stroke();
		},
		move: function(x, y, brushState) {
			canvasCTX.beginPath();
			canvasCTX.moveTo(brushState.lastX, brushState.lastY);
			canvasCTX.lineTo(x, y);
			canvasCTX.stroke();
			return true;
		}		
	}
};

function setBrushWidth(bWidth) {
	if(bWidth == brushWidth)
		return;
	brushWidth = bWidth;
	setBrushAttribsLocal();
	sendDrawEvent(EVENT_WIDTH, brushWidth);
}

function setBrushColor(bColor) {
	if(bColor == brushColor)
		return;
	brushColor = bColor;
	setBrushAttribsLocal();
	sendDrawEvent(EVENT_COLOR, brushColor);
}

function setBrush(brush) {
	setBrushAttribsLocal();
	currentBrush = paintBrushes[brush];
	canvasStableImageDataNeeded = false;
	currentBrush.select();
	sendDrawEvent(EVENT_BRUSH, brush);
}

function resetCanvasImage(dontsend) {
	canvasEle.width = canvasImg.width * scaleFactor;
	canvasEle.height = canvasImg.height * scaleFactor;
	canvasCTX.drawImage(canvasImg, 0, 0, canvasEle.width, canvasEle.height);
	
	canvasStableImageData = canvasCTX.createImageData(canvasEle.width, canvasEle.height);
	
	if(!dontsend) {
		sendDrawEvent(EVENT_RESET, "");
	}
}

function recvDirectEvent(evtype, payload) {
	payload = payload.split("|");
	switch(evtype) {
		case EVENT_JOIN:
			paintUsers[payload[0]] = {
				name: payload[1],
				brushWidth: payload[2],
				brushColor: payload[3],
				currentBrush: paintBrushes[payload[4]],
				cursorX: 0,
				cursorY: 0,
				lastX: 0,
				lastY: 0
			};
			break;
		case EVENT_LEAVE:
			paintUsers[payload[0]] = null;
			break;
		default:
			recvDrawEvent(evtype, payload);
			break;
	}
}

function recvDrawEvent(evtype, payload) {
	var from = paintUsers[payload[0]];
	switch(evtype) {
		case EVENT_MOUSE_CURSOR:
			from.cursorX = payload[1];
			from.cursorY = payload[2];
			break;
		case EVENT_MOUSE_MOVE:
		case EVENT_MOUSE_DOWN:
		case EVENT_MOUSE_UP:
			recvBrushEvent(from, evtype, payload[1], payload[2]);
			break;
		case EVENT_WIDTH:
			from.brushWidth = payload[1];
			break;
		case EVENT_COLOR:
			from.brushColor = payload[1];
			break;
		case EVENT_BRUSH:
			from.currentBrush = paintBrushes[payload[1]];
			break;
		case EVENT_RESET:
			resetCanvasImage(true);
			break;
	}
}

function sendDrawEvent(evtype, payload) {
	sendRaw(evtype + payload);
}

function sendBrushEvent(evtype, x, y) {
	x *= scaleFactor;
	y *= scaleFactor;
	x = Math.round(x);
	y = Math.round(y);
	sendDrawEvent(evtype, x+"|"+y);
}

function recvBrushEvent(from, evtype, x, y) {
	x /= scaleFactor;
	y /= scaleFactor;

	var brush = from.currentBrush;
	canvasCTX.lineWidth = from.brushWidth;
	canvasCTX.strokeStyle = from.brushColor;
	canvasCTX.fillStyle = from.brushColor;
	
	var cstableData = canvasStableImageDataNeeded;
	brush.select();
	canvasStableImageDataNeeded = cstableData;
	if(canvasStableImageDataNeeded) {
		canvasCTX.putImageData(canvasStableImageData, 0, 0);
	}
	
	switch(evtype) {
		case EVENT_MOUSE_DOWN:
			brush.down(x, y, from.brushState);
			break;
		case EVENT_MOUSE_MOVE:
			brush.move(x, y, from.brushState);
			from.cursorX = x;
			from.cursorY = y;
			break;
		case EVENT_MOUSE_UP:
			brush.up(x, y, from.brushState);
			break;
	}
	
	currentBrush.select();
	setBrushAttribsLocal();
	if(canvasStableImageDataNeeded) {
		canvasStableImageData = canvasCTX.getImageData(0, 0, canvasEle.width, canvasEle.height);
		if(brushState.lastX) {
			currentBrush.move(brushState.lastX, brushState.lastY);
		}
	}
}

function setBrushAttribsLocal() {
	canvasCTX.lineWidth = brushWidth;
	canvasCTX.strokeStyle = brushColor;
	canvasCTX.fillStyle = brushColor;
}

function liveDrawCanvasMouseOut(evt) {
	if(canvasStableImageDataNeeded) {
		liveDrawCanvasMouseMove(evt);
	} else {
		liveDrawCanvasMouseUp(evt);
	}
}

function liveDrawCanvasMouseOver(evt) {
	if(canvasStableImageDataNeeded) {
		liveDrawCanvasMouseMove(evt);
	}
}

function liveDrawCanvasMouseDown(evt) {
	preventDefault(evt);
	
	isDrawing = true;
	
	if(!currentBrush.down(evt.offsetX, evt.offsetY, brushState)) {
		sendBrushEvent(EVENT_MOUSE_DOWN, evt.offsetX, evt.offsetY);
	}
	
	if(canvasStableImageDataNeeded) {
		canvasStableImageData = canvasCTX.getImageData(0, 0, canvasEle.width, canvasEle.height);
	}
}

function liveDrawCanvasMouseUp(evt) {
	preventDefault(evt);
	
	if(!isDrawing)
		return;
		
	isDrawing = false;
	
	if(canvasStableImageDataNeeded) {
		canvasCTX.putImageData(canvasStableImageData, 0, 0);
	}
	
	if(!currentBrush.up(evt.offsetX, evt.offsetY, brushState)) {
		sendBrushEvent(EVENT_MOUSE_UP, evt.offsetX, evt.offsetY);
	}
	
	brushState.lastX = null;
	brushState.lastY = null;
}

function liveDrawCanvasMouseMove(evt) {
	preventDefault(evt);
	
	if(!isDrawing)
		return;
	
	if(canvasStableImageDataNeeded) {
		canvasCTX.putImageData(canvasStableImageData, 0, 0);
	}
	
	if(!currentBrush.move(evt.offsetX, evt.offsetY, brushState)) {
		sendBrushEvent(EVENT_MOUSE_MOVE, evt.offsetX, evt.offsetY);
	}
}

$(document).ready(function() {
	canvasEle = document.getElementById("livedraw");
	canvasCTX = canvasEle.getContext("2d");
	
	canvasEle.addEventListener("mousedown", liveDrawCanvasMouseDown, true);
	canvasEle.addEventListener("mouseup", liveDrawCanvasMouseUp, true);
	canvasEle.addEventListener("mousemove", liveDrawCanvasMouseMove, true);
	canvasEle.addEventListener("mouseout", liveDrawCanvasMouseOut, true);
	canvasEle.addEventListener("mouseover", liveDrawCanvasMouseOver, true);
	
	var maxWidth = $('#livedraw-wrapper').width();
	
	canvasImg = new Image();
	canvasImg.onload = function(){
		if(canvasImg.width > maxWidth) {
			scaleFactor = maxWidth / canvasImg.width;
		} else {
			scaleFactor = 1.00;
		}
		
		canvasStableImageDataNeeded = false;
		
		resetCanvasImage(true);
		
		setBrush("brush");
		setBrushColor("#000");
		setBrushWidth(10.0);
		sendDrawEvent(EVENT_JOIN, SESSIONID+"|"+LIVEDRAW_FILEID+"|"+LIVEDRAW_SID); 
	};
	canvasImg.src = canvasEle.getAttribute("data-file-url");
});
$(document).unload(function() {
	sendDrawEvent(EVENT_LEAVE, ""); 
});