var MathPI2 = Math.PI * 2.0;

var canvasCTX, canvasEle, canvasImg, canvasPos;
var canvasStableImageData, canvasStableImageDataNeeded;

var webSocket;
var webSocket_buffer = "";
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

var EVENT_IMGBURST = "i";

function recvRaw(msg) {
	msg = msg.trim();
	if(msg.length < 1)
		return;
	//console.log("<< ["+msg+"]");
	recvDirectEvent(msg.charAt(0), msg.substr(1));
}

function sendRaw(msg) {
	msg = msg.trim();
	if(msg.length < 1)
		return;
	//console.log(">> ["+msg+"]");
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
			if(brushState.lastX == x && brushState.lastY == y) {
				x++;
				y++;
			}
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
			if(brushState.lastX == x && brushState.lastY == y) {
				x++;
				y++;
			}
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
			if(brushState.lastX == x && brushState.lastY == y) {
				x++;
				y++;
			}
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
	erase: {
		select: function() {
			canvasCTX.lineCap = "round";
			canvasCTX.globalCompositeOperation = "destination-out";
		},
		down: function(x, y, brushState) {
			brushState.lastX = x;
			brushState.lastY = y;
		},
		up: function(x, y, brushState) {
			if(brushState.lastX == x && brushState.lastY == y) {
				x++;
				y++;
			}
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
			if(brushState.lastX == x && brushState.lastY == y) {
				x++;
				y++;
			}
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
	if(bColor.charAt(0) != "#")
		bColor = "#" + bColor;
	brushColor = bColor;
	setBrushAttribsLocal();
	sendDrawEvent(EVENT_COLOR, brushColor.substr(1));
}

function setBrush(brush) {
	setBrushAttribsLocal();
	currentBrush = paintBrushes[brush];
	canvasStableImageDataNeeded = false;
	canvasCTX.globalCompositeOperation = "source-over";
	currentBrush.select();
	sendDrawEvent(EVENT_BRUSH, brush);
}

function resetCanvasImage(dontsend) {
	//canvasCTX.drawImage(canvasImg, 0, 0, canvasEle.width, canvasEle.height);
	canvasCTX.clearRect(0, 0, canvasEle.width, canvasEle.height);
	
	canvasStableImageData = canvasCTX.createImageData(canvasEle.width, canvasEle.height);
	
	if(!dontsend)
		sendDrawEvent(EVENT_RESET, "");
}

function recvDirectEvent(evtype, payload) {
	if(evtype == EVENT_ERROR) {
		alert("Network error: " + payload + "\nPlease refresh this page to rejoin!");
		webSocket_On = false;
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
		case EVENT_IMGBURST:
			if(payload[0] == "r")
				sendDrawEvent(EVENT_IMGBURST, payload[1]+"|"+canvasEle.toDataURL("image/png").replace("\n","").replace("\r","")+"|");
			else if(payload[1] == "a") {
				var toSet = new Image();
				toSet.onload = function() {
					canvasCTX.drawImage(toSet, 0, 0, canvasEle.width, canvasEle.height);
				}
				toSet.src = payload[2];
			}
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
	sendDrawEvent(evtype, x+"|"+y);
}

function recvBrushEvent(from, evtype, x, y) {
	from.cursorX = x;
	from.cursorY = y;
	
	var brush = from.currentBrush;
	canvasCTX.lineWidth = from.brushWidth;
	canvasCTX.strokeStyle = from.brushColor;
	canvasCTX.fillStyle = from.brushColor;
	
	var cstableData = canvasStableImageDataNeeded;
	brush.select();
	canvasStableImageDataNeeded = cstableData;
	if(canvasStableImageDataNeeded)
		canvasCTX.putImageData(canvasStableImageData, 0, 0);
	
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
		if(brushState.lastX)
			currentBrush.move(brushState.lastX, brushState.lastY);
	}
}

function setBrushAttribsLocal() {
	canvasCTX.lineWidth = brushWidth;
	canvasCTX.strokeStyle = brushColor;
	canvasCTX.fillStyle = brushColor;
}

function setOffsetXAndY(evt) {
	var x,y;
	
	if(!evt.offsetX) {
		x = evt.pageX - canvasPos.left;
		y = evt.pageY - canvasPos.top;
	} else {
		x = evt.offsetX;
		y = evt.offsetY;
	}
	
	x = Math.round(x);
	y = Math.round(y);
	if(x < 0) x = 0;
	if(y < 0) y = 0;
	
	evt.myOffsetX = x / scaleFactor;
	evt.myOffsetY = y / scaleFactor;
}

function liveDrawCanvasMouseOut(evt) {
	if(canvasStableImageDataNeeded)
		liveDrawCanvasMouseMove(evt);
	else
		liveDrawCanvasMouseUp(evt);
}

function liveDrawCanvasMouseOver(evt) {
	if(canvasStableImageDataNeeded)
		liveDrawCanvasMouseMove(evt);
}

function liveDrawCanvasMouseDown(evt) {
	preventDefault(evt);
	
	isDrawing = true;
	
	setOffsetXAndY(evt);
	
	if(!currentBrush.down(evt.myOffsetX, evt.myOffsetY, brushState))
		sendBrushEvent(EVENT_MOUSE_DOWN, evt.myOffsetX, evt.myOffsetY);
	else
		sendBrushEvent(EVENT_MOUSE_CURSOR, evt.myOffsetX, evt.myOffsetY);
	
	if(canvasStableImageDataNeeded)
		canvasStableImageData = canvasCTX.getImageData(0, 0, canvasEle.width, canvasEle.height);
}

function liveDrawCanvasMouseUp(evt) {
	preventDefault(evt);
	
	if(!isDrawing)
		return;
		
	isDrawing = false;
		
	setOffsetXAndY(evt);
	
	if(canvasStableImageDataNeeded)
		canvasCTX.putImageData(canvasStableImageData, 0, 0);
	
	if(!currentBrush.up(evt.myOffsetX, evt.myOffsetY, brushState))
		sendBrushEvent(EVENT_MOUSE_UP, evt.myOffsetX, evt.myOffsetY);
	else
		sendBrushEvent(EVENT_MOUSE_CURSOR, evt.myOffsetX, evt.myOffsetY);
	
	brushState.lastX = null;
	brushState.lastY = null;
}

function liveDrawCanvasMouseMove(evt) {
	preventDefault(evt);
	
	if(!isDrawing)
		return;
		
	setOffsetXAndY(evt);
	
	if(canvasStableImageDataNeeded)
		canvasCTX.putImageData(canvasStableImageData, 0, 0);
	
	if(!currentBrush.move(evt.myOffsetX, evt.myOffsetY, brushState))
		sendBrushEvent(EVENT_MOUSE_MOVE, evt.myOffsetX, evt.myOffsetY);
	else
		sendBrushEvent(EVENT_MOUSE_CURSOR, evt.myOffsetX, evt.myOffsetY);
}

function webSocket_tryConnect() {
		if(!webSocket_On)
			return;

		webSocket = new WebSocket("wss://foxcav.es:8002/", "paint");
		
		webSocket.onmessage = function(evt) {
			var data = webSocket_buffer+evt.data;
			var datalen = data.length;
			if(data.charAt(datalen - 1) != "\n") {
				datalen = data.lastIndexOf("\n");
				if(datalen) {
					webSocket_buffer = data.substring(0, datalen);
					data = data.substring(datalen + 1);
				} else {
					webSocket_buffer = data;
					return;
				}
			}
			
			data = data.split("\n");
			for(var i=0;i<data.length;i++) {
				recvRaw(data[i]);
			}
		};
		
		webSocket.onerror = function(evt) {
			window.setTimeout(webSocket_tryConnect, 200);
			webSocket.close();
		};
		
		webSocket.onclose = function(evt) {
			window.setTimeout(webSocket_tryConnect, 200);
			webSocket.close();
		}
		
		webSocket.onopen = function(evt) {
			sendDrawEvent(EVENT_JOIN, SESSIONID+"|"+LIVEDRAW_FILEID+"|"+LIVEDRAW_SID);
			setBrushColor("000");
			setBrushWidth(10.0);
			setBrush("brush");
		};
}

var liveDraw = {
	save: function() {
		var xhr = new XMLHttpRequest();
		/*xhr.upload.addEventListener("loadstart", uploadStart, false);
		xhr.upload.addEventListener("progress", uploadProgress, false);*/
		xhr.upload.addEventListener("load", function(ev){ console.log("Upload complete"); }, false);
		xhr.open("PUT", "/api/create?"+escape(LIVEDRAW_FILEID + "-edited.png"));//LIVEDRAW_FILEID defined in love.tpl
		xhr.setRequestHeader("x-is-base64","yes");
		xhr.send(canvasEle.toDataURL("image/png").replace(/^data:image\/png;base64,/, ""));
	}
};

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
	canvasImg.crossOrigin = "anonymous";
	canvasImg.onload = function() {
		if(canvasImg.width > maxWidth)
			scaleFactor = maxWidth / canvasImg.width;
		else
			scaleFactor = 1.00;
		
		canvasStableImageDataNeeded = false;
		
		resetCanvasImage(true);
		
		webSocket_On = true;
		webSocket_tryConnect();
		
		canvasEle.width = canvasImg.width;
		canvasEle.height = canvasImg.height;
		
		canvasEle.style.width = (canvasEle.width*scaleFactor)+"px";
		canvasEle.style.height = (canvasEle.height*scaleFactor)+"px";
		
		canvasPos = $(canvasEle).position();
		
		canvasCTX.drawImage(this, 0, 0);
	};
	canvasImg.src = canvasEle.getAttribute("data-file-url");
});

$(document).unload(function() {
	webSocket_On = false;
	sendDrawEvent(EVENT_LEAVE, ""); 
});