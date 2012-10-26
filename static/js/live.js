var MathPI2 = Math.PI * 2.0;

var canvasCTX, canvasEle, canvasImg, canvasPos;
var canvasStableImageData, canvasStableImageDataNeeded;

var webSocket;
var webSocket_On = false;

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
var EVENT_MOUSE_CURSOR = "p";

var EVENT_RESET = "r";

var EVENT_JOIN = "j";
var EVENT_LEAVE = "l";
var EVENT_ERROR = "e";

function recvRaw(msg) {
	msg = msg.trim();
	if(msg.length < 1)
		return;
	console.log("<< ["+msg+"]");
	recvDirectEvent(msg.charAt(0), msg.substr(1));
}

function sendRaw(msg) {
	msg = msg.trim();
	if(msg.length < 1)
		return;
	console.log(">> ["+msg+"]");
	webSocket.send(msg+"\n");
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
	if(bColor.charAt(0) != "#") {
		bColor = "#" + bColor;
	}
	brushColor = bColor;
	setBrushAttribsLocal();
	sendDrawEvent(EVENT_COLOR, brushColor.substr(1));
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
	if(evtype == EVENT_ERROR) {
		alert("Network error: " + payload);
		webSocket.close();
		return;
	}
	payload = payload.split("|");
	switch(evtype) {
		case EVENT_JOIN:
			paintUsers[payload[0]] = {
				name: payload[1],
				brushWidth: payload[2],
				brushColor: "#"+payload[3],
				currentBrush: paintBrushes[payload[4]],
				brushState: {
					lastX: 0,
					lastY: 0
				},
				cursorX: payload[5],
				cursorY: payload[6]
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
			from.brushColor = "#"+payload[1];
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
	x /= scaleFactor;
	y /= scaleFactor;
	x = Math.round(x);
	y = Math.round(y);
	if(x < 0) x = 0;
	if(y < 0) y = 0;
	sendDrawEvent(evtype, x+"|"+y);
}

function recvBrushEvent(from, evtype, x, y) {
	x *= scaleFactor;
	y *= scaleFactor;

	from.cursorX = x;
	from.cursorY = y;
	
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

function setOffsetXAndY(evt) {
	if(evt.offsetX)
		return;

	evt.offsetX = evt.pageX - canvasPos.left;
	evt.offsetY = evt.pageY - canvasPos.top;
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
	
	setOffsetXAndY(evt);
	
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
		
	setOffsetXAndY(evt);
	
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
		
	setOffsetXAndY(evt);
	
	if(canvasStableImageDataNeeded) {
		canvasCTX.putImageData(canvasStableImageData, 0, 0);
	}
	
	if(!currentBrush.move(evt.offsetX, evt.offsetY, brushState)) {
		sendBrushEvent(EVENT_MOUSE_MOVE, evt.offsetX, evt.offsetY);
	}
}

function webSocket_tryConnect() {
		if(!webSocket_On)
			return;

		webSocket = new WebSocket("wss://foxcav.es:8002/", "paint");
		
		webSocket.onmessage = function(evt) {
			var data = evt.data.split("\n");
			for(var i=0;i<data.length;i++) {
				recvRaw(data[i]);
			}
		};
		
		webSocket.onerror = function(evt) {
			window.setTimeout("webSocket_tryConnect();", 200);
			webSocket.close();
		};
		
		webSocket.onclose = function(evt) {
			window.setTimeout("webSocket_tryConnect();", 200);
			webSocket.close();
		}
		
		webSocket.onopen = function(evt) {
			sendDrawEvent(EVENT_JOIN, SESSIONID+"|"+LIVEDRAW_FILEID+"|"+LIVEDRAW_SID);
			setBrushColor("000");
			setBrushWidth(10.0);
			setBrush("brush");
		};
}

$(document).ready(function() {
	canvasEle = document.getElementById("livedraw");
	canvasCTX = canvasEle.getContext("2d");
	
	canvasEle.addEventListener("mousedown", liveDrawCanvasMouseDown, false);
	canvasEle.addEventListener("mouseup", liveDrawCanvasMouseUp, false);
	canvasEle.addEventListener("mousemove", liveDrawCanvasMouseMove, false);
	canvasEle.addEventListener("mouseout", liveDrawCanvasMouseOut, false);
	canvasEle.addEventListener("mouseover", liveDrawCanvasMouseOver, false);
	
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
		
		webSocket_On = true;
		webSocket_tryConnect();
		
		canvasPos = $(canvasEle).position();
	};
	canvasImg.src = canvasEle.getAttribute("data-file-url");
});

$(document).unload(function() {
	webSocket_On = false;
	sendDrawEvent(EVENT_LEAVE, ""); 
});