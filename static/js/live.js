var MathPI2 = Math.PI * 2.0;

var canvasCTX, finalCanvas, canvasPos;

var webSocket_buffer = "";

var scaleFactor = 1.0;

var brushWidth, brushColor, currentBrush;
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



var paintBrushes = {
	rectangle: {
		select: function(brushState, foregroundCanvasCTX, backgroundCanvasCTX) {
			backgroundCanvasCTX.lineCap = "butt";
			foregroundCanvasCTX.lineWidth = brushWidth;
		},
		down: function(x, y, brushState) {
			brushState.lastX = x;
			brushState.lastY = y;
			this.active = true;
		},
		up: function(x, y, brushState, backgroundCanvasCTX) {
			if(brushState.lastX == x && brushState.lastY == y) {
				x++;
				y++;
			}
			backgroundCanvasCTX.strokeRect(x, y, brushState.lastX - x, brushState.lastY - y);
			this.active = false;
		},
		move: function(x, y, brushState, backgroundCanvasCTX) {
			return true;
		},
		preview: function(x, y, brushState, previewCanvasCTX) {
			if(!this.active)
				return;
			previewCanvasCTX.strokeRect(x, y, brushState.lastX - x, brushState.lastY - y);
		}
	},
	circle: {
		select: function(brushState, foregroundCanvasCTX, backgroundCanvasCTX) {
			backgroundCanvasCTX.lineCap = "butt";
			foregroundCanvasCTX.lineWidth = brushWidth;
		},
		down: function(x, y, brushState) {
			this.active = true;
			brushState.lastX = x;
			brushState.lastY = y;
		},
		up: function(x, y, brushState, backgroundCanvasCTX) {
			if(brushState.lastX == x && brushState.lastY == y) {
				x++;
				y++;
			}
			backgroundCanvasCTX.beginPath();
			x = brushState.lastX - x;
			y = brushState.lastY - y;
			backgroundCanvasCTX.arc(brushState.lastX, brushState.lastY, Math.sqrt(x*x + y*y), 0, MathPI2, false);
			backgroundCanvasCTX.stroke();
			this.active = false;
		},
		move: function(x, y, brushState, backgroundCanvasCTX) {
			return true;
		},
		preview: function(x, y, brushState, previewCanvasCTX) {
			if(!this.active)
				return;
			previewCanvasCTX.beginPath();
			x = brushState.lastX - x;
			y = brushState.lastY - y;
			previewCanvasCTX.arc(brushState.lastX, brushState.lastY, Math.sqrt(x*x + y*y), 0, MathPI2, false);
			previewCanvasCTX.stroke();
		}
	},
	brush: {
		select: function(brushState, foregroundCanvasCTX, backgroundCanvasCTX) {
			backgroundCanvasCTX.lineCap = "round";
			foregroundCanvasCTX.lineWidth = 1;
		},
		down: function(x, y, brushState) {
			brushState.lastX = x;
			brushState.lastY = y;
		},
		up: function(x, y, brushState, backgroundCanvasCTX) {
			if(brushState.lastX == x && brushState.lastY == y) {
				x++;
				y++;
			}
			backgroundCanvasCTX.beginPath();
			backgroundCanvasCTX.moveTo(brushState.lastX, brushState.lastY);
			backgroundCanvasCTX.lineTo(x, y);
			backgroundCanvasCTX.stroke();			
		},
		move: function(x, y, brushState, backgroundCanvasCTX) {
			backgroundCanvasCTX.beginPath();
			backgroundCanvasCTX.moveTo(brushState.lastX, brushState.lastY);
			backgroundCanvasCTX.lineTo(x, y);
			backgroundCanvasCTX.stroke();
			brushState.lastX = x;
			brushState.lastY = y;
		},
		preview: function(x, y, brushState, previewCanvasCTX) {
			previewCanvasCTX.lineWidth = "1px";
			previewCanvasCTX.fillStyle = "";
		
			previewCanvasCTX.beginPath();
			previewCanvasCTX.arc(x, y, brushWidth/2, 0, 2*Math.PI);
			previewCanvasCTX.stroke();
		}
	},
	erase: {
		select: function(brushState, foregroundCanvasCTX, backgroundCanvasCTX) {
			backgroundCanvasCTX.lineCap = "round";
			backgroundCanvasCTX.globalCompositeOperation = "destination-out";
			foregroundCanvasCTX.lineWidth = 1;
		},
		down: function(x, y, brushState) {
			brushState.lastX = x;
			brushState.lastY = y;
		},
		up: function(x, y, brushState, backgroundCanvasCTX) {
			if(brushState.lastX == x && brushState.lastY == y) {
				x++;
				y++;
			}
			backgroundCanvasCTX.beginPath();
			backgroundCanvasCTX.moveTo(brushState.lastX, brushState.lastY);
			backgroundCanvasCTX.lineTo(x, y);
			backgroundCanvasCTX.stroke();			
		},
		move: function(x, y, brushState, backgroundCanvasCTX) {
			backgroundCanvasCTX.beginPath();
			backgroundCanvasCTX.moveTo(brushState.lastX, brushState.lastY);
			backgroundCanvasCTX.lineTo(x, y);
			backgroundCanvasCTX.stroke();
			brushState.lastX = x;
			brushState.lastY = y;
		},
		preview: function(x, y, brushState, previewCanvasCTX) {
			foregroundCanvasCTX.lineWidth = "1px";
			previewCanvasCTX.fillStyle = "";
			
			previewCanvasCTX.beginPath();
			previewCanvasCTX.arc(x, y, brushWidth/2, 0, 2*Math.PI);
			previewCanvasCTX.stroke();
		}
	},
	line: {
		select: function(brushState, foregroundCanvasCTX, backgroundCanvasCTX) {
			backgroundCanvasCTX.lineCap = "butt";
			foregroundCanvasCTX.lineWidth = brushWidth;
		},
		down: function(x, y, brushState) {
			brushState.lastX = x;
			brushState.lastY = y;
			this.active = true;
		},
		up: function(x, y, brushState, backgroundCanvasCTX) {
			if(brushState.lastX == x && brushState.lastY == y) {
				x++;
				y++;
			}
			backgroundCanvasCTX.beginPath();
			backgroundCanvasCTX.moveTo(brushState.lastX, brushState.lastY);
			backgroundCanvasCTX.lineTo(x, y);
			backgroundCanvasCTX.stroke();
			this.active = false;
		},
		move: function(x, y, brushState, backgroundCanvasCTX) {
			return true;
		},
		preview: function(x, y, brushState, previewCanvasCTX) {
			if(!this.active)
				return;
			foregroundCanvasCTX.lineWidth = "1px";
			previewCanvasCTX.beginPath();
			previewCanvasCTX.moveTo(brushState.lastX, brushState.lastY);
			previewCanvasCTX.lineTo(x, y);
			previewCanvasCTX.stroke();
			return true;
		}
	}
};

function setBrushWidth(bWidth) {
	if(bWidth == brushWidth)
		return;
	brushWidth = bWidth;
	setBrushAttribsLocal();
	networking.sendDrawEvent(EVENT_WIDTH, brushWidth);
}

function setBrushColor(bColor) {
	brushColor = bColor;
	setBrushAttribsLocal();
	networking.sendDrawEvent(EVENT_COLOR, brushColor);
}

function setBrush(brush) {
	setBrushAttribsLocal();
	currentBrush = paintBrushes[brush];
	backgroundCanvasCTX.globalCompositeOperation = "source-over";
	currentBrush.select(brushState, foregroundCanvasCTX, backgroundCanvasCTX);
	networking.sendDrawEvent(EVENT_BRUSH, brush);
}


function setBrushAttribsLocal() {
	backgroundCanvasCTX.lineWidth = brushWidth;
	backgroundCanvasCTX.strokeStyle = brushColor;
	backgroundCanvasCTX.fillStyle = brushColor;
	
	foregroundCanvasCTX.strokeStyle = brushColor;
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

var liveDrawInput = {
	localCursorX: 0,
	localCursorY: 0,
	isDrawing: false,
	mouseOut: function(evt, backgroundCanvasCTX) {
		//this.mouseUp(evt, backgroundCanvasCTX);
	},
	mouseOver: function(evt) {
	},
	mouseDown: function(evt) {
		if(evt.button != 0)
			return;
		preventDefault(evt);
		
		this.isDrawing = true;
		
		setOffsetXAndY(evt);
		
		if(!currentBrush.down(evt.myOffsetX, evt.myOffsetY, brushState))
			networking.sendBrushEvent(EVENT_MOUSE_DOWN, evt.myOffsetX, evt.myOffsetY);
		else
			networking.sendBrushEvent(EVENT_MOUSE_CURSOR, evt.myOffsetX, evt.myOffsetY);
	},
	mouseUp: function(evt, backgroundCanvasCTX) {
		preventDefault(evt);
		
		
			
		setOffsetXAndY(evt);
		if(!this.isDrawing)
			return
		this.isDrawing = false;
		
		if(!currentBrush.up(evt.myOffsetX, evt.myOffsetY, brushState, backgroundCanvasCTX))
			networking.sendBrushEvent(EVENT_MOUSE_UP, evt.myOffsetX, evt.myOffsetY);
		else
			networking.sendBrushEvent(EVENT_MOUSE_CURSOR, evt.myOffsetX, evt.myOffsetY);
		
		brushState.lastX = null;
		brushState.lastY = null;
	},
	mouseMove: function(evt, backgroundCanvasCTX) {
		preventDefault(evt);
		
		setOffsetXAndY(evt);
		
		this.localCursorX = evt.myOffsetX;
		this.localCursorY = evt.myOffsetY;
		
		if(!this.isDrawing)
			return;
		
		if(!currentBrush.move(evt.myOffsetX, evt.myOffsetY, brushState, backgroundCanvasCTX))
			networking.sendBrushEvent(EVENT_MOUSE_MOVE, evt.myOffsetX, evt.myOffsetY);
		else
			networking.sendBrushEvent(EVENT_MOUSE_CURSOR, evt.myOffsetX, evt.myOffsetY);
	},
	mouseScroll: function(evt) {
	}
}

var liveDrawInterface = {
	save: function() {
		var xhr = new XMLHttpRequest();
		/*xhr.upload.addEventListener("loadstart", uploadStart, false);
		xhr.upload.addEventListener("progress", uploadProgress, false);*/
		xhr.upload.addEventListener("load", function(ev){ console.log("Upload complete"); }, false);
		xhr.open("PUT", "/api/create?"+escape(LIVEDRAW_FILEID + "-edited.png"));//LIVEDRAW_FILEID defined in love.tpl
		xhr.setRequestHeader("x-is-base64","yes");
		xhr.send(finalCanvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "").replace(/[\r\n]/g,""));
	}
};

var backgroundCanvasCTX;
var foregroundCanvasCTX;
var finalCanvasCTX;

var backgroundCanvas;
var foregroundCanvas;
var finalCanvas;

var networking = {
	shouldConnect: false,
	recvRaw: function(msg) {
		msg = msg.trim();
		if(msg.length < 1)
			return;
		this.recvDirectEvent(msg.charAt(0), msg.substr(1));
	},
	recvDirectEvent: function(evtype, payload) {
		if(evtype == EVENT_ERROR) {
			this.close();
			alert("Network error: " + payload + "\nPlease refresh this page to rejoin!");
			return;
		}
		payload = payload.split("|");
		switch(evtype) {
			case EVENT_JOIN:
				paintUsers[payload[0]] = {
					name: payload[1],
					brushData: {
						width: payload[2],
						color: payload[3],
						brush: paintBrushes[payload[4]]
					},
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
					this.sendDrawEvent(EVENT_IMGBURST, payload[1]+"|"+finalCanvas.toDataURL("image/png").replace(/[\r\n]/g,"")+"|");
				else if(payload[1] == "a") {
					var toSet = new Image();
					toSet.onload = function() {
						backgroundCanvasCTX.drawImage(toSet, 0, 0, finalCanvas.width, finalCanvas.height);
					}
					toSet.src = payload[2];
				}
				break;
			default:
				this.recvDrawEvent(evtype, payload);
				break;
		}
	},
	sendDrawEvent: function(evtype, payload) {
		this.sendRaw(evtype + payload);
	},
	sendBrushEvent: function(evtype, x, y) {
		this.sendDrawEvent(evtype, x+"|"+y);
	},
	recvDrawEvent: function(evtype, payload) {
		var from = paintUsers[payload[0]];
		switch(evtype) {
			case EVENT_MOUSE_CURSOR:
				from.cursorX = payload[1];
				from.cursorY = payload[2];
				break;
			case EVENT_MOUSE_MOVE:
			case EVENT_MOUSE_DOWN:
			case EVENT_MOUSE_UP:
				this.recvBrushEvent(from, evtype, payload[1], payload[2]);
				break;
			case EVENT_WIDTH:
				from.brushData.width = payload[1];
				break;
			case EVENT_COLOR:
				from.brushData.color = payload[1];
				break;
			case EVENT_BRUSH:
				from.brushData.brush = paintBrushes[payload[1]];
				break;
			case EVENT_RESET:
				break;
		}
	},
	recvBrushEvent: function(from, evtype, x, y) {
		from.cursorX = x;
		from.cursorY = y;
		
		var brush = from.brushData.brush;
		backgroundCanvasCTX.lineWidth = from.brushData.width;
		backgroundCanvasCTX.strokeStyle = from.brushData.color;
		backgroundCanvasCTX.fillStyle = from.brushData.color;
		
		brush.select(from.brushState, foregroundCanvasCTX, backgroundCanvasCTX);
		
		switch(evtype) {
			case EVENT_MOUSE_DOWN:
				brush.down(x, y, from.brushState);
				break;
			case EVENT_MOUSE_UP:
				brush.up(x, y, from.brushState, backgroundCanvasCTX);
				break;
			case EVENT_MOUSE_MOVE:
				brush.move(x, y, from.brushState, backgroundCanvasCTX);
				break;
		}
		
		backgroundCanvasCTX.lineWidth = brushWidth;
		backgroundCanvasCTX.strokeStyle = brushColor;
		backgroundCanvasCTX.fillStyle = brushColor;
		
		currentBrush.select(brushState, foregroundCanvasCTX, backgroundCanvasCTX);
	},
	connect: function() {
		this.shouldConnect = true;
		var webSocket = new WebSocket("wss://foxcav.es:8002/", "paint");
		
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
				networking.recvRaw(data[i]);
			}
		};
		
		webSocket.onclose = webSocket.onerror = function(evt) {//Unwanted disconnect
			if(!networking.shouldConnect)
				return;
			window.setTimeout(function() { networking.connect() }, 200);
			webSocket.close();
		}
		
		webSocket.onopen = function(evt) {
			networking.sendDrawEvent(EVENT_JOIN, SESSIONID+"|"+LIVEDRAW_FILEID+"|"+LIVEDRAW_SID);
			setBrushColor("black");
			setBrushWidth(10.0);
			setBrush("brush");
		};
		this.socket = webSocket;
	},
	close: function() {
		this.shouldConnect = false;
		this.socket.close();
	},
	sendRaw: function(msg) {
		msg = msg.trim();
		if(msg.length == 0)
			return;
		this.socket.send(msg+"\n");
	}
}

function paintCanvas() {
	if(!currentBrush)
		return;
	foregroundCanvasCTX.clearRect(0, 0, foregroundCanvas.width, foregroundCanvas.height);
	
	currentBrush.preview(liveDrawInput.localCursorX, liveDrawInput.localCursorY, brushState, foregroundCanvasCTX);
	
	for(var i=0;i<paintUsers.length;++i) {
		if(paintUsers[i]) {
			console.log(paintUsers[i]);
			paintUsers[i].brushData.brush.preview(paintUsers[i].cursorX, liveDrawInput.cursorY, paintUsers[i].brushState, foregroundCanvasCTX);
		}
	}
	finalCanvasCTX.clearRect(0, 0, finalCanvas.width, finalCanvas.height);
	
	finalCanvasCTX.drawImage(backgroundCanvas, 0, 0);
	finalCanvasCTX.drawImage(foregroundCanvas, 0, 0);
}

function loadImage() {
	var baseImage = new Image();
	baseImage.crossOrigin = "anonymous";	
	
	baseImage.onload = function() {
	
		var maxWidth = $('#livedraw-wrapper').width();
	
		if(this.width > maxWidth)
			scaleFactor = maxWidth / this.width;
		else
			scaleFactor = 1.00;
		
		networking.connect();
		
		backgroundCanvas.width = foregroundCanvas.width = finalCanvas.width = this.width;
		backgroundCanvas.height = foregroundCanvas.height = finalCanvas.height = this.height;
		
		finalCanvas.style.width = (finalCanvas.width*scaleFactor)+"px";
		finalCanvas.style.height = (finalCanvas.height*scaleFactor)+"px";
		
		canvasPos = $(finalCanvas).position();
		
		backgroundCanvasCTX.drawImage(this, 0, 0);
		
		window.setInterval(paintCanvas, 1000);
	};
	baseImage.src = finalCanvas.getAttribute("data-file-url");
}

function setupCanvas() {
	backgroundCanvas = document.createElement("canvas");
	foregroundCanvas = document.createElement("canvas");
	finalCanvas = document.getElementById("livedraw");
	
	backgroundCanvasCTX = backgroundCanvas.getContext("2d");
	foregroundCanvasCTX = foregroundCanvas.getContext("2d");
	finalCanvasCTX = finalCanvas.getContext("2d");
	
	finalCanvas.addEventListener("mousedown", function(evt) { liveDrawInput.mouseDown(evt) }, false);
	finalCanvas.addEventListener("mouseup", function(evt) { liveDrawInput.mouseUp(evt, backgroundCanvasCTX) }, false);
	finalCanvas.addEventListener("mousemove", function(evt) { liveDrawInput.mouseMove(evt, backgroundCanvasCTX) }, false);
	finalCanvas.addEventListener("mouseout", function(evt) { liveDrawInput.mouseOut(evt, backgroundCanvasCTX) }, false);
	finalCanvas.addEventListener("mouseover", function(evt) { liveDrawInput.mouseOver(evt) }, false);
	finalCanvas.addEventListener("scroll", function(evt) { liveDrawInput.mouseOver(evt) }, false);
}

$(document).ready(function() {
	setupCanvas();
	loadImage();
});

$(document).unload(function() {
	networking.sendDrawEvent(EVENT_LEAVE, "");
	networking.close();
});