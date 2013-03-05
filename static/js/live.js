var MathPI2 = Math.PI * 2.0;

var finalCanvas, canvasPos;

var webSocket_buffer = "";

var scaleFactor = 1.0;

var localUser = {
	brushData: {
		width: 0,
		color: "black",
		brush: null,
		setWidth: function(bWidth) {
			if(bWidth == this.width)
				return;
			this.width = bWidth;
			this.setBrushAttribsLocal();
			networking.sendDrawEvent(EVENT_WIDTH, this.width);
		},
		setColor: function(bColor) {
			this.color = bColor;
			this.setBrushAttribsLocal();
			networking.sendDrawEvent(EVENT_COLOR, bColor);
		},
		setBrush: function(brush) {
			this.brush = paintBrushes[brush];
			backgroundCanvasCTX.globalCompositeOperation = "source-over";
			this.brush.select(localUser, foregroundCanvasCTX, backgroundCanvasCTX);
			if(this.brush.selectLocal)
				this.brush.selectLocal(localUser, foregroundCanvasCTX, backgroundCanvasCTX);
			networking.sendDrawEvent(EVENT_BRUSH, brush);
		},
		setBrushAttribsLocal: function() {
			backgroundCanvasCTX.lineWidth = this.width;
			backgroundCanvasCTX.strokeStyle = this.color;
			backgroundCanvasCTX.fillStyle = this.color;
			
			foregroundCanvasCTX.strokeStyle = this.color;
			foregroundCanvasCTX.fillStyle = this.color;
			if(localUser.brushData.brush && localUser.brushData.brush.keepLineWidth != true)
				foregroundCanvasCTX.lineWidth = this.width
		}
	},
	cursorData: {
		x: 0,
		y: 0,
		lastX: 0,
		lastY: 0
	}
};



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
		select: function(user, foregroundCanvasCTX, backgroundCanvasCTX) {
			backgroundCanvasCTX.lineCap = "butt";
			foregroundCanvasCTX.lineWidth = localUser.brushData.width;
		},
		down: function(x, y, user) {
			user.cursorData.lastX = x;
			user.cursorData.lastY = y;
			this.active = true;
		},
		up: function(x, y, user, backgroundCanvasCTX) {
			if(user.cursorData.lastX == x && user.cursorData.lastY == y) {
				x++;
				y++;
			}
			backgroundCanvasCTX.strokeRect(x, y, user.cursorData.lastX - x, user.cursorData.lastY - y);
			this.active = false;
		},
		move: function(x, y, user, backgroundCanvasCTX) {
			return true;
		},
		preview: function(x, y, user, foregroundCanvasCTX) {
			if(!this.active)
				return;
			foregroundCanvasCTX.strokeRect(x, y, user.cursorData.lastX - x, user.cursorData.lastY - y);
		}
	},
	circle: {
		select: function(user, foregroundCanvasCTX, backgroundCanvasCTX) {
			backgroundCanvasCTX.lineCap = "butt";
			foregroundCanvasCTX.lineWidth = localUser.brushData.width;
		},
		down: function(x, y, user) {
			this.active = true;
			user.cursorData.lastX = x;
			user.cursorData.lastY = y;
		},
		up: function(x, y, user, backgroundCanvasCTX) {
			if(user.cursorData.lastX == x && user.cursorData.lastY == y) {
				x++;
				y++;
			}
			backgroundCanvasCTX.beginPath();
			x = user.cursorData.lastX - x;
			y = user.cursorData.lastY - y;
			backgroundCanvasCTX.arc(user.cursorData.lastX, user.cursorData.lastY, Math.sqrt(x*x + y*y), 0, MathPI2, false);
			backgroundCanvasCTX.stroke();
			this.active = false;
		},
		move: function(x, y, user, backgroundCanvasCTX) {
			return true;
		},
		preview: function(x, y, user, foregroundCanvasCTX) {
			if(!this.active)
				return;
			foregroundCanvasCTX.beginPath();
			x = user.cursorData.lastX - x;
			y = user.cursorData.lastY - y;
			foregroundCanvasCTX.arc(user.cursorData.lastX, user.cursorData.lastY, Math.sqrt(x*x + y*y), 0, MathPI2, false);
			foregroundCanvasCTX.stroke();
		}
	},
	brush: {
		keepLineWidth: true,
		select: function(user, foregroundCanvasCTX, backgroundCanvasCTX) {
			backgroundCanvasCTX.lineCap = "round";
			foregroundCanvasCTX.lineWidth = 1;
		},
		down: function(x, y, user) {
			user.cursorData.lastX = x;
			user.cursorData.lastY = y;
		},
		up: function(x, y, user, backgroundCanvasCTX) {
			if(user.cursorData.lastX == x && user.cursorData.lastY == y) {
				x++;
				y++;
			}
			backgroundCanvasCTX.beginPath();
			backgroundCanvasCTX.moveTo(user.cursorData.lastX, user.cursorData.lastY);
			backgroundCanvasCTX.lineTo(x, y);
			backgroundCanvasCTX.stroke();			
		},
		move: function(x, y, user, backgroundCanvasCTX) {
			backgroundCanvasCTX.beginPath();
			backgroundCanvasCTX.moveTo(user.cursorData.lastX, user.cursorData.lastY);
			backgroundCanvasCTX.lineTo(x, y);
			backgroundCanvasCTX.stroke();
			user.cursorData.lastX = x;
			user.cursorData.lastY = y;
		},
		preview: function(x, y, user, foregroundCanvasCTX) {
			foregroundCanvasCTX.beginPath();
			foregroundCanvasCTX.arc(x, y, user.brushData.width/2, 0, 2*Math.PI);
			foregroundCanvasCTX.stroke();
		}
	},
	erase: {
		keepLineWidth: true,
		select: function(user, foregroundCanvasCTX, backgroundCanvasCTX) {
			backgroundCanvasCTX.lineCap = "round";
			backgroundCanvasCTX.globalCompositeOperation = "destination-out";
			foregroundCanvasCTX.lineWidth = 1;
		},
		down: function(x, y, user) {
			user.cursorData.lastX = x;
			user.cursorData.lastY = y;
		},
		up: function(x, y, user, backgroundCanvasCTX) {
			if(user.cursorData.lastX == x && user.cursorData.lastY == y) {
				x++;
				y++;
			}
			backgroundCanvasCTX.beginPath();
			backgroundCanvasCTX.moveTo(user.cursorData.lastX, user.cursorData.lastY);
			backgroundCanvasCTX.lineTo(x, y);
			backgroundCanvasCTX.stroke();			
		},
		move: function(x, y, user, backgroundCanvasCTX) {
			backgroundCanvasCTX.beginPath();
			backgroundCanvasCTX.moveTo(user.cursorData.lastX, user.cursorData.lastY);
			backgroundCanvasCTX.lineTo(x, y);
			backgroundCanvasCTX.stroke();
			user.cursorData.lastX = x;
			user.cursorData.lastY = y;
		},
		preview: function(x, y, user, foregroundCanvasCTX) {
			foregroundCanvasCTX.beginPath();
			foregroundCanvasCTX.arc(x, y, user.brushData.width/2, 0, 2*Math.PI);
			foregroundCanvasCTX.stroke();
		}
	},
	line: {
		select: function(user, foregroundCanvasCTX, backgroundCanvasCTX) {
			backgroundCanvasCTX.lineCap = "butt";
			foregroundCanvasCTX.lineWidth = localUser.brushData.width;
		},
		down: function(x, y, user) {
			user.cursorData.lastX = x;
			user.cursorData.lastY = y;
			this.active = true;
		},
		up: function(x, y, user, backgroundCanvasCTX) {
			if(user.cursorData.lastX == x && user.cursorData.lastY == y) {
				x++;
				y++;
			}
			backgroundCanvasCTX.beginPath();
			backgroundCanvasCTX.moveTo(user.cursorData.lastX, user.cursorData.lastY);
			backgroundCanvasCTX.lineTo(x, y);
			backgroundCanvasCTX.stroke();
			this.active = false;
		},
		move: function(x, y, user, backgroundCanvasCTX) {
			return true;
		},
		preview: function(x, y, user, foregroundCanvasCTX) {
			if(!this.active)
				return;
			foregroundCanvasCTX.beginPath();
			foregroundCanvasCTX.moveTo(user.cursorData.lastX, user.cursorData.lastY);
			foregroundCanvasCTX.lineTo(x, y);
			foregroundCanvasCTX.stroke();
			return true;
		}
	},
	text: {
		select: function(user, foregroundCanvasCTX, backgroundCanvasCTX) {
		},
		selectLocal: function() {
			this.textInput = document.getElementById("live-draw-text-input")
			this.textInput.style.display = "inline";
		},
		down: function() {
		},
		up: function(x, y, user, backgroundCanvasCTX) {
			backgroundCanvasCTX.font = (scaleFactor * user.brushData.width) + "px Verdana"
			backgroundCanvasCTX.textAlign = "left";
			backgroundCanvasCTX.textBaseline = "top";
			backgroundCanvasCTX.fillText(
				this.textInput.value,
				x,
				y
			)
		},
		move: function(x, y, user, backgroundCanvasCTX) {
			return true;
		},
		preview: function(x, y, user, foregroundCanvasCTX) {
			foregroundCanvasCTX.font = (scaleFactor * user.brushData.width) + "px Verdana"
			foregroundCanvasCTX.fillText(
				this.textInput.value,
				x,
				y
			)
		}
	}
};



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

function sign(x) { return x ? x < 0 ? -1 : 1 : 0; }

function clamp(val, min, max) { return Math.max(min, Math.min(max, val)) }

var liveDrawInput = {
	cursorX: 0,
	cursorY: 0,
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
		
		if(!localUser.brushData.brush.down(evt.myOffsetX, evt.myOffsetY, localUser))
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
		
		if(!localUser.brushData.brush.up(evt.myOffsetX, evt.myOffsetY, localUser, backgroundCanvasCTX))
			networking.sendBrushEvent(EVENT_MOUSE_UP, evt.myOffsetX, evt.myOffsetY);
		else
			networking.sendBrushEvent(EVENT_MOUSE_CURSOR, evt.myOffsetX, evt.myOffsetY);
		
		localUser.cursorData.lastX = null;
		localUser.cursorData.lastY = null;
	},
	mouseMove: function(evt, backgroundCanvasCTX) {
		preventDefault(evt);
		
		setOffsetXAndY(evt);
		
		this.cursorX = evt.myOffsetX;
		this.cursorY = evt.myOffsetY;
		
		if(!this.isDrawing) {
			networking.sendBrushEvent(EVENT_MOUSE_CURSOR, evt.myOffsetX, evt.myOffsetY);
			return;
		}
		
		if(!localUser.brushData.brush.move(evt.myOffsetX, evt.myOffsetY, localUser, backgroundCanvasCTX))
			networking.sendBrushEvent(EVENT_MOUSE_MOVE, evt.myOffsetX, evt.myOffsetY);
		else
			networking.sendBrushEvent(EVENT_MOUSE_CURSOR, evt.myOffsetX, evt.myOffsetY);
	},
	mouseScroll: function(evt) {
		var delta;
		if ('wheelDelta' in event)
			delta = sign(event.wheelDelta)*2;
		else
			delta = sign(-event.detail)*2;
			
		localUser.brushData.setWidth(clamp(localUser.brushData.width+delta, 1, 100))
		evt.preventDefault();
		//return false;
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
						width: parseFloat(payload[2]),
						color: payload[3],
						brush: paintBrushes[payload[4]]
					},
					cursorData: {
						x: parseFloat(payload[5]),
						y: parseFloat(payload[6]),
						lastX: 0,
						lastY: 0
					},  	
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
				from.cursorData.x = parseFloat(payload[1]);
				from.cursorData.y = parseFloat(payload[2]);
				break;
			case EVENT_MOUSE_MOVE:
			case EVENT_MOUSE_DOWN:
			case EVENT_MOUSE_UP:
				this.recvBrushEvent(from, evtype, payload[1], payload[2]);
				break;
			case EVENT_WIDTH:
				from.brushData.width = parseFloat(payload[1]);
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
		from.cursorData.x = x;
		from.cursorData.y = y;
		
		var brush = from.brushData.brush;
		backgroundCanvasCTX.lineWidth = from.brushData.width;
		backgroundCanvasCTX.strokeStyle = from.brushData.color;
		backgroundCanvasCTX.fillStyle = from.brushData.color;
		
		brush.select(from, foregroundCanvasCTX, backgroundCanvasCTX);
		
		switch(evtype) {
			case EVENT_MOUSE_DOWN:
				brush.down(x, y, from);
				break;
			case EVENT_MOUSE_UP:
				brush.up(x, y, from, backgroundCanvasCTX);
				break;
			case EVENT_MOUSE_MOVE:
				brush.move(x, y, from, backgroundCanvasCTX);
				break;
		}
		
		localUser.brushData.setBrushAttribsLocal();
		
		localUser.brushData.brush.select(from, foregroundCanvasCTX, backgroundCanvasCTX);
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
			localUser.brushData.setColor("black");
			localUser.brushData.setWidth(10.0);
			localUser.brushData.setBrush("brush");
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

var defaultFont = "24px Verdana";

function paintCanvas() {
	if(!localUser.brushData.brush)
		return;
	foregroundCanvasCTX.clearRect(0, 0, foregroundCanvas.width, foregroundCanvas.height);
	
		
	localUser.brushData.brush.preview(liveDrawInput.cursorX, liveDrawInput.cursorY, localUser, foregroundCanvasCTX);
	
	foregroundCanvasCTX.textAlign = "left";
	foregroundCanvasCTX.textBaseline = "top";
	
	var offset;
	var user;
	
	for(var i=0;i<paintUsers.length;++i) {
		if(paintUsers[i]) {
			user = paintUsers[i];
				
			user.brushData.brush.preview(user.cursorData.x, user.cursorData.y, user, foregroundCanvasCTX);
				
			var offset = Math.sqrt(Math.pow(user.brushData.width)*2)
			
			foregroundCanvasCTX.font = defaultFont;
			foregroundCanvasCTX.fillText(
				user.name,
				user.cursorData.x + user.brushData.width,
				user.cursorData.y + user.brushData.width
			)
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
			
		defaultFont = (12/scaleFactor)+"px Verdana";
		
		networking.connect();
		
		backgroundCanvas.width = foregroundCanvas.width = finalCanvas.width = this.width;
		backgroundCanvas.height = foregroundCanvas.height = finalCanvas.height = this.height;
		
		finalCanvas.style.width = (finalCanvas.width*scaleFactor)+"px";
		finalCanvas.style.height = (finalCanvas.height*scaleFactor)+"px";
		
		canvasPos = $(finalCanvas).position();
		
		backgroundCanvasCTX.drawImage(this, 0, 0);
		
		window.setInterval(paintCanvas, 1/30);
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
	
	finalCanvas.addEventListener("mousewheel", function(evt) { liveDrawInput.mouseScroll(evt) }, false);
	finalCanvas.addEventListener('DOMMouseScroll', function(evt) { liveDrawInput.mouseScroll(evt) }, false);
}

$(document).ready(function() {
	setupCanvas();
	loadImage();
});

$(document).unload(function() {
	networking.sendDrawEvent(EVENT_LEAVE, "");
	networking.close();
});