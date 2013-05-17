var MathPI2 = Math.PI * 2.0;

var finalCanvas, canvasPos;

var webSocket_buffer = "";

var scaleFactor = 1.0;

var imagePattern;

var brushSizeSlider;

var localUser = {
	brushData: {
		width: 0,
		color: "black",
		brush: null,
		customData: {
		},
		setWidth: function(bWidth) {
			if(bWidth == this.width)
				return;
			this.width = bWidth;
			brushSizeSlider.value = bWidth;
			this.setBrushAttribsLocal();
			networking.sendDrawEvent(EVENT_WIDTH, bWidth);
		},
		setColor: function(bColor) {
			this.color = bColor;
			this.setBrushAttribsLocal();
			networking.sendDrawEvent(EVENT_COLOR, bColor);
		},
		setBrush: function(brush) {
			if(this.brush && this.brush.unselectLocal)
				this.brush.unselectLocal();

			this.brush = paintBrushes[brush];
			backgroundCanvasCTX.globalCompositeOperation = "source-over";

			if(this.brush.selectLocal)
				this.brush.selectLocal(localUser, foregroundCanvasCTX, backgroundCanvasCTX);
			this.brush.select(localUser, foregroundCanvasCTX, backgroundCanvasCTX);
			networking.sendDrawEvent(EVENT_BRUSH, brush);
		},
		setBrushAttribsLocal: function() {
			backgroundCanvasCTX.lineWidth = this.width * scaleFactor;
			if(localUser.brushData.brush && localUser.brushData.brush.keepBackgroundStrokeStyle != true)
				backgroundCanvasCTX.strokeStyle = this.color;
			backgroundCanvasCTX.fillStyle = this.color;

			foregroundCanvasCTX.strokeStyle = this.color;
			foregroundCanvasCTX.fillStyle = this.color;
			if(localUser.brushData.brush && localUser.brushData.brush.keepLineWidth != true)
				foregroundCanvasCTX.lineWidth = this.width * scaleFactor;
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

var EVENT_CUSTOM = "x";

var EVENT_RESET = "r";
var EVENT_JOIN = "j";
var EVENT_LEAVE = "l";
var EVENT_ERROR = "e";

var EVENT_IMGBURST = "i";

var EVENT_MOUSE_DOUBLE_CLICK = "F";

var paintBrushes = {
	rectangle: {
		select: function(user, foregroundCanvasCTX, backgroundCanvasCTX) {
			backgroundCanvasCTX.lineCap = "butt";
			foregroundCanvasCTX.lineWidth = user.brushData.width * scaleFactor;
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
			backgroundCanvasCTX.strokeStyle = user.brushData.color;
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
			foregroundCanvasCTX.lineWidth = user.brushData.width * scaleFactor;
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
			backgroundCanvasCTX.strokeStyle = user.brushData.color;

			backgroundCanvasCTX.beginPath();
			x = user.cursorData.lastX - x;
			y = user.cursorData.lastY - y;
			backgroundCanvasCTX.arc(user.cursorData.lastX, user.cursorData.lastY, Math.sqrt(x * x + y * y), 0, MathPI2, false);
			backgroundCanvasCTX.stroke();
			this.active = false;
		},
		move: function(x, y, user, backgroundCanvasCTX) {
			return true;
		},
		preview: function(x, y, user, foregroundCanvasCTX) {
			if(!this.active)
				return;
				
			var radius = Math.sqrt(x * x + y * y);
				
			foregroundCanvasCTX.font = "10px Verdana";
			foregroundCanvasCTX.fillText(
				"Radius: " + radius + "px",
				user.cursorData.lastX,
				user.cursorData.lastY
			)
				
			foregroundCanvasCTX.beginPath();
			x = user.cursorData.lastX - x;
			y = user.cursorData.lastY - y;
			foregroundCanvasCTX.arc(user.cursorData.lastX, user.cursorData.lastY, Math.sqrt(x * x + y * y), 0, MathPI2, false);
			foregroundCanvasCTX.stroke();
		}
	},
	brush: {
		keepLineWidth: true,
		select: function(user, foregroundCanvasCTX, backgroundCanvasCTX) {
			foregroundCanvasCTX.lineWidth = 1 / scaleFactor;
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

			this.move(x, y, user, backgroundCanvasCTX);
		},
		move: function(x, y, user, backgroundCanvasCTX) {
			backgroundCanvasCTX.lineCap = "round";
			backgroundCanvasCTX.strokeStyle = user.brushData.color;

			backgroundCanvasCTX.beginPath();
			backgroundCanvasCTX.moveTo(user.cursorData.lastX, user.cursorData.lastY);
			backgroundCanvasCTX.lineTo(x, y);
			backgroundCanvasCTX.stroke();
			user.cursorData.lastX = x;
			user.cursorData.lastY = y;
		},
		preview: function(x, y, user, foregroundCanvasCTX) {
			foregroundCanvasCTX.beginPath();
			foregroundCanvasCTX.arc(x, y, (user.brushData.width / 2 ) * scaleFactor, 0, MathPI2);
			foregroundCanvasCTX.stroke();
		}
	},
	erase: {
		keepLineWidth: true,
		select: function(user, foregroundCanvasCTX, backgroundCanvasCTX) {
			foregroundCanvasCTX.lineWidth = 1 / scaleFactor;
			foregroundCanvasCTX.strokeStyle = "black";
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
			this.move(x, y, user, backgroundCanvasCTX);
		},
		move: function(x, y, user, backgroundCanvasCTX) {
			backgroundCanvasCTX.lineCap = "round";
			backgroundCanvasCTX.globalCompositeOperation = "destination-out";

			backgroundCanvasCTX.beginPath();
			backgroundCanvasCTX.moveTo(user.cursorData.lastX, user.cursorData.lastY);
			backgroundCanvasCTX.lineTo(x, y);
			backgroundCanvasCTX.stroke();
			user.cursorData.lastX = x;
			user.cursorData.lastY = y;
		},
		preview: function(x, y, user, foregroundCanvasCTX) {
			foregroundCanvasCTX.beginPath();
			foregroundCanvasCTX.arc(x, y, (user.brushData.width / 2 ) * scaleFactor, 0, MathPI2);
			foregroundCanvasCTX.stroke();
		}
	},
	restore: {
		keepLineWidth: true,
		keepBackgroundStrokeStyle: true,
		select: function(user, foregroundCanvasCTX, backgroundCanvasCTX) {
			foregroundCanvasCTX.lineWidth = 1 / scaleFactor;
			foregroundCanvasCTX.strokeStyle = "black";
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

			this.move(x, y, user, backgroundCanvasCTX);
		},
		move: function(x, y, user, backgroundCanvasCTX) {
			backgroundCanvasCTX.strokeStyle = imagePattern;
			backgroundCanvasCTX.lineWidth = user.brushData.width * scaleFactor;
			backgroundCanvasCTX.lineCap = "round";

			backgroundCanvasCTX.beginPath();
			backgroundCanvasCTX.moveTo(user.cursorData.lastX, user.cursorData.lastY);
			backgroundCanvasCTX.lineTo(x, y);
			backgroundCanvasCTX.stroke();
			user.cursorData.lastX = x;
			user.cursorData.lastY = y;
		},
		preview: function(x, y, user, foregroundCanvasCTX) {
			foregroundCanvasCTX.beginPath();
			foregroundCanvasCTX.arc(x, y, (user.brushData.width / 2) * scaleFactor, 0, MathPI2);
			foregroundCanvasCTX.stroke();
		}
	},
	line: {
		select: function(user, foregroundCanvasCTX, backgroundCanvasCTX) {
			foregroundCanvasCTX.lineWidth = user.brushData.width;
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
			backgroundCanvasCTX.lineCap = "butt";
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
		keepLineWidth: true,
		usesCustomData: true,
		defaultCustomData: {
			text: "",
			font: "Verdana",
		},
		setup: function(user) {
			if(user != localUser)
				return;
			this.textInput = document.getElementById("live-draw-text-input");
			this.fontInput = document.getElementById("live-draw-font-input");

			this.textInput.addEventListener("keyup", function(event) {
				localUser.brushData.brush.setText(this.value);
			});

			this.fontInput.addEventListener("keyup", function(event) {
				localUser.brushData.brush.setFont(this.value);
			});
		},
		select: function(user, foregroundCanvasCTX, backgroundCanvasCTX) {
		},
		selectLocal: function(user) {
			this.textInput.style.display = this.fontInput.style.display = "block";
		},
		unselectLocal: function() {
			this.textInput.style.display = this.fontInput.style.display = "none";
		},
		down: function() {
		},
		up: function(x, y, user, backgroundCanvasCTX) {
			backgroundCanvasCTX.font = (scaleFactor * user.brushData.width) + "px " + user.brushData.customData.text.font;
			backgroundCanvasCTX.textAlign = "left";
			backgroundCanvasCTX.textBaseline = "top";
			backgroundCanvasCTX.fillText(
				user.brushData.customData.text.text,
				x,
				y
			)
		},
		move: function(x, y, user, backgroundCanvasCTX) {
			return true;
		},
		preview: function(x, y, user, foregroundCanvasCTX) {
			foregroundCanvasCTX.font = (scaleFactor * user.brushData.width) + "px " + user.brushData.customData.text.font;
			foregroundCanvasCTX.fillText(
				user.brushData.customData.text.text,
				x,
				y
			)
		},
		setText: function(text) {
			localUser.brushData.customData.text.text = text;
			networking.sendBrushPacket("text", "text", text);
		},
		setFont: function(font) {
			localUser.brushData.customData.text.font = font
			networking.sendBrushPacket("text", "font", font);
		}/*,
		setFontSize: function(user, fontSize) {
			user.brushData.customData.text.fontSize = fontSize
			networking.sendCustomPacket("text", "fontSize", fontSize);
		}*/
	},
	polygon: {
		usesCustomData: true,
		setup: function(user) {
			user.brushData.customData.polygon.verts = [];
		},
		select: function() {
		},
		down: function() {
		},
		up: function(x, y, user, backgroundCanvasCTX) {
			user.brushData.customData.polygon.verts.push({x: x, y: y});
		},
		move: function(x, y, user, backgroundCanvasCTX) {
			return true;
		},
		preview: function(x, y, user, foregroundCanvasCTX) {
			var verts = user.brushData.customData.polygon.verts;
			if(verts.length == 0)
				return;
			foregroundCanvasCTX.beginPath();
			foregroundCanvasCTX.moveTo(verts[0].x, verts[0].y);
			for(var i = 1;verts.length>i;++i)
				foregroundCanvasCTX.lineTo(verts[i].x, verts[i].y);
			foregroundCanvasCTX.lineTo(x, y);
			foregroundCanvasCTX.lineTo(verts[0].x, verts[0].y);
			foregroundCanvasCTX.fill();
		},
		doubleClick: function(x, y, user, backgroundCanvasCTX) {
			backgroundCanvasCTX.strokeStyle = user.brushData.color;

			var verts = user.brushData.customData.polygon.verts;
			if(verts.length == 0)
				return;
			backgroundCanvasCTX.beginPath();
				backgroundCanvasCTX.moveTo(verts[0].x, verts[0].y);
			for(var i = 1;verts.length > i;++i)
				backgroundCanvasCTX.lineTo(verts[i].x, verts[i].y);
			backgroundCanvasCTX.lineTo(verts[0].x, verts[0].y);
			backgroundCanvasCTX.fill();

			user.brushData.customData.polygon.verts.length = 0;//flush the array
		}
	}
};



function setOffsetXAndY(event) {
	var x,y;

	if(!event.offsetX) {
		x = event.pageX - canvasPos.left;
		y = event.pageY - canvasPos.top;
	} else {
		x = event.offsetX;
		y = event.offsetY;
	}

	x = Math.round(x);
	y = Math.round(y);
	if(x < 0) x = 0;
	if(y < 0) y = 0;

	event.myOffsetX = x / scaleFactor;
	event.myOffsetY = y / scaleFactor;
}

function sign(x) { return x ? x < 0 ? -1 : 1 : 0; }

function clamp(val, min, max) { return Math.max(min, Math.min(max, val)) }

var liveDrawInput = {
	cursorX: 0,
	cursorY: 0,
	isDrawing: false,
	mouseOut: function(event, backgroundCanvasCTX) {
		//this.mouseUp(event, backgroundCanvasCTX);
	},
	mouseOver: function(event) {
	},
	mouseDown: function(event) {
		if(event.button != 0)
			return;
		preventDefault(event);

		this.isDrawing = true;

		setOffsetXAndY(event);

		var sendX = event.myOffsetX / scaleFactor;
		var sendY = event.myOffsetY / scaleFactor;

		if(!localUser.brushData.brush.down(event.myOffsetX, event.myOffsetY, localUser))
			networking.sendBrushEvent(EVENT_MOUSE_DOWN, sendX, sendY);
		else
			networking.sendBrushEvent(EVENT_MOUSE_CURSOR, sendX, sendY);
	},
	mouseUp: function(event, backgroundCanvasCTX) {
		if(event.button != 0)
			return;
		preventDefault(event);

		setOffsetXAndY(event);
		if(!this.isDrawing)
			return
		this.isDrawing = false;

		var sendX = event.myOffsetX / scaleFactor;
		var sendY = event.myOffsetY / scaleFactor;

		if(!localUser.brushData.brush.up(event.myOffsetX, event.myOffsetY, localUser, backgroundCanvasCTX))
			networking.sendBrushEvent(EVENT_MOUSE_UP, sendX, sendY);
		else
			networking.sendBrushEvent(EVENT_MOUSE_CURSOR, sendX, sendY);

		localUser.cursorData.lastX = null;
		localUser.cursorData.lastY = null;
	},
	mouseMove: function(event, backgroundCanvasCTX) {
		preventDefault(event);

		setOffsetXAndY(event);

		this.cursorX = event.myOffsetX;
		this.cursorY = event.myOffsetY;

		var sendX = event.myOffsetX / scaleFactor;
		var sendY = event.myOffsetY / scaleFactor;

		if(!this.isDrawing) {
			networking.sendBrushEvent(EVENT_MOUSE_CURSOR, sendX, sendY);
			return;
		}

		if(!localUser.brushData.brush.move(event.myOffsetX, event.myOffsetY, localUser, backgroundCanvasCTX))
			networking.sendBrushEvent(EVENT_MOUSE_MOVE, sendX, sendY);
		else
			networking.sendBrushEvent(EVENT_MOUSE_CURSOR, sendX, sendY);
	},
	mouseScroll: function(event) {
		var delta;
		if ('wheelDelta' in event)
			delta = sign(event.wheelDelta) * 2;
		else
			delta = sign(-event.detail) * 2;

		localUser.brushData.setWidth(clamp(localUser.brushData.width + delta, 1, maxBrushWidth))
		event.preventDefault();
		//return false;
	},
	doubleClick: function(event) {
		if(localUser.brushData.brush.doubleClick)
			localUser.brushData.brush.doubleClick(event.myOffsetX, event.myOffsetY, localUser, backgroundCanvasCTX);

		setOffsetXAndY(event);

		this.cursorX = event.myOffsetX;
		this.cursorY = event.myOffsetY;

		var sendX = event.myOffsetX / scaleFactor;
		var sendY = event.myOffsetY / scaleFactor;

		event.preventDefault();
		networking.sendBrushEvent(EVENT_MOUSE_DOUBLE_CLICK, sendX, sendY);
	}
}

var liveDrawInterface = {
	save: function() {
		var xhr = new XMLHttpRequest();
		/*xhr.upload.addEventListener("loadstart", uploadStart, false);
		xhr.upload.addEventListener("progress", uploadProgress, false);*/
		xhr.upload.addEventListener("load", function(ev) { console.log("Upload complete"); }, false);
		xhr.open("PUT", "/api/create?" + escape(LIVEDRAW_FILEID + "-edited.png"));//LIVEDRAW_FILEID defined in love.tpl
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
	recvDirectEvent: function(eventype, payload) {
		if(eventype == EVENT_ERROR) {
			this.close();
			alert("Network error: " + payload + "\nPlease refresh this page to rejoin!");
			return;
		}
		payload = payload.split("|");
		switch(eventype) {
			case EVENT_JOIN:
				var from;
				from = paintUsers[payload[0]] = {
					name: payload[1],
					brushData: {
						width: parseFloat(payload[2]),
						color: payload[3],
						brush: paintBrushes[payload[4]],
						customData: {}
					},
					cursorData: {
						x: parseFloat(payload[5]) * scaleFactor,
						y: parseFloat(payload[6]) * scaleFactor,
						lastX: 0,
						lastY: 0
					},  
				};
				for(brush in paintBrushes) {
					if(paintBrushes[brush].usesCustomData) {
						var dataSet = {};
						var defaultSet = paintBrushes[brush].defaultCustomData
						for(attrib in paintBrushes[brush].defaultCustomData)
							dataSet[attrib] = defaultSet[attrib];
						from.brushData.customData[brush] = dataSet;
					}
					if(paintBrushes[brush].setup)
						paintBrushes[brush].setup(from);
				}
				break;
			case EVENT_LEAVE:
				paintUsers[payload[0]] = null;
				break;
			case EVENT_IMGBURST:
				if(payload[0] == "r")
					this.sendDrawEvent(EVENT_IMGBURST, payload[1] + "|" + finalCanvas.toDataURL("image/png").replace(/[\r\n]/g,"") + "|");
				else if(payload[1] == "a") {
					var toSet = new Image();
					toSet.onload = function() {
						backgroundCanvasCTX.drawImage(toSet, 0, 0, finalCanvas.width, finalCanvas.height);
					}
					toSet.src = payload[2];
				}
				break;
			default:
				this.recvDrawEvent(eventype, payload);
				break;
		}
	},
	sendDrawEvent: function(eventype, payload) {
		this.sendRaw(eventype + payload);
	},
	sendBrushEvent: function(eventype, x, y) {
		this.sendDrawEvent(eventype, x + "|" + y);
	},
	recvDrawEvent: function(eventype, payload) {
		var from = paintUsers[payload[0]];
		switch(eventype) {
			case EVENT_MOUSE_CURSOR:
				from.cursorData.x = parseFloat(payload[1]) * scaleFactor;
				from.cursorData.y = parseFloat(payload[2]) * scaleFactor;
				break;
			case EVENT_MOUSE_MOVE:
			case EVENT_MOUSE_DOWN:
			case EVENT_MOUSE_UP:
			case EVENT_MOUSE_DOUBLE_CLICK:
				this.recvBrushEvent(from, eventype, payload[1], payload[2]);
				break;
			case EVENT_WIDTH:
				from.brushData.width = parseFloat(payload[1]);
				break;
			case EVENT_COLOR:
				from.brushData.color = payload[1];
				break;
			case EVENT_CUSTOM:
				if(!from.brushData.customData[payload[1]])
					from.brushData.customData[payload[1]] = {};
				from.brushData.customData[payload[1]][payload[2]] = payload[3];
				break;
			case EVENT_BRUSH:
				from.brushData.brush = paintBrushes[payload[1]];
				break;
			case EVENT_RESET:
				break;
		}
	},
	recvBrushEvent: function(from, eventype, x, y) {
		x *= scaleFactor;
		y *= scaleFactor;
		from.cursorData.x = x;
		from.cursorData.y = y;

		var brush = from.brushData.brush;
		backgroundCanvasCTX.lineWidth = from.brushData.width * scaleFactor;//Needed in order to draw correctly
		backgroundCanvasCTX.strokeStyle = from.brushData.color;
		backgroundCanvasCTX.fillStyle = from.brushData.color;

		brush.select(from, foregroundCanvasCTX, backgroundCanvasCTX);

		switch(eventype) {
			case EVENT_MOUSE_DOWN:
				brush.down(x, y, from);
				break;
			case EVENT_MOUSE_UP:
				brush.up(x, y, from, backgroundCanvasCTX);
				break;
			case EVENT_MOUSE_MOVE:
				brush.move(x, y, from, backgroundCanvasCTX);
				break;
			case EVENT_MOUSE_DOUBLE_CLICK:
				brush.doubleClick(x, y, from, backgroundCanvasCTX);
				break;
		}

		localUser.brushData.setBrushAttribsLocal();

		localUser.brushData.brush.select(from, foregroundCanvasCTX, backgroundCanvasCTX);
	},
	sendBrushPacket: function(brushName, key, val) {
		this.sendRaw(EVENT_CUSTOM + brushName + "|" + key + "|" + val);
	},
	connect: function() {
		this.shouldConnect = true;
		var webSocket = new WebSocket("wss://foxcav.es:8002/", "paint");

		webSocket.onmessage = function(event) {
			var data = webSocket_buffer + event.data;
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
			for(var i = 0;i < data.length;i++)
				networking.recvRaw(data[i]);
		};

		webSocket.onclose = webSocket.onerror = function(event) {//Unwanted disconnect
			if(!networking.shouldConnect)
				return;
			window.setTimeout(function() { networking.connect() }, 200);
			webSocket.close();
		}

		webSocket.onopen = function(event) {
			networking.sendDrawEvent(EVENT_JOIN, SESSIONID + "|" + LIVEDRAW_FILEID + "|" + LIVEDRAW_SID);
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
		this.socket.send(msg + "\n");
	}
}

var defaultFont = "24px Verdana";

var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
window.requestAnimationFrame = requestAnimationFrame;

function paintCanvas() {
	requestAnimationFrame(paintCanvas);
	if(!localUser.brushData.brush)
		return;

	foregroundCanvasCTX.clearRect(0, 0, foregroundCanvas.width, foregroundCanvas.height);

	localUser.brushData.brush.select(localUser, foregroundCanvasCTX, backgroundCanvasCTX);
	localUser.brushData.brush.preview(liveDrawInput.cursorX, liveDrawInput.cursorY, localUser, foregroundCanvasCTX);

	foregroundCanvasCTX.textAlign = "left";
	foregroundCanvasCTX.textBaseline = "top";

	var user;

	for(var i= 0 ;i < paintUsers.length;++i)
		if(paintUsers[i]) {
			user = paintUsers[i];

			user.brushData.brush.select(user, foregroundCanvasCTX, backgroundCanvasCTX);
			user.brushData.brush.preview(user.cursorData.x, user.cursorData.y, user, foregroundCanvasCTX);

			foregroundCanvasCTX.font = defaultFont;
			foregroundCanvasCTX.fillText(
				user.name,
				user.cursorData.x + user.brushData.width,
				user.cursorData.y + user.brushData.width
			)
		}

	finalCanvasCTX.clearRect(0, 0, finalCanvas.width, finalCanvas.height);

	finalCanvasCTX.drawImage(backgroundCanvas, 0, 0);
	finalCanvasCTX.drawImage(foregroundCanvas, 0, 0);

	localUser.brushData.brush.select(localUser, foregroundCanvasCTX, backgroundCanvasCTX);
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

		defaultFont = (12 / scaleFactor) + "px Verdana";

		networking.connect();

		backgroundCanvas.width = foregroundCanvas.width = finalCanvas.width = this.width;
		backgroundCanvas.height = foregroundCanvas.height = finalCanvas.height = this.height;

		finalCanvas.style.width = (finalCanvas.width * scaleFactor) + "px";
		finalCanvas.style.height = (finalCanvas.height * scaleFactor) + "px";

		canvasPos = $(finalCanvas).position();

		backgroundCanvasCTX.drawImage(this, 0, 0);

		imagePattern = backgroundCanvasCTX.createPattern(this, "no-repeat");
		
		

		requestAnimationFrame(paintCanvas);

		//window.setInterval(, 1/40);
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

	finalCanvas.addEventListener("mousedown", function(event) { liveDrawInput.mouseDown(event) }, false);
	finalCanvas.addEventListener("mouseup", function(event) { liveDrawInput.mouseUp(event, backgroundCanvasCTX) }, false);
	finalCanvas.addEventListener("mousemove", function(event) { liveDrawInput.mouseMove(event, backgroundCanvasCTX) }, false);
	finalCanvas.addEventListener("mouseout", function(event) { liveDrawInput.mouseOut(event, backgroundCanvasCTX) }, false);
	finalCanvas.addEventListener("mouseover", function(event) { liveDrawInput.mouseOver(event) }, false);

	finalCanvas.addEventListener("mousewheel", function(event) { liveDrawInput.mouseScroll(event) }, false);
	finalCanvas.addEventListener('DOMMouseScroll', function(event) { liveDrawInput.mouseScroll(event) }, false);
	finalCanvas.addEventListener('dblclick', function(event) { liveDrawInput.doubleClick(event) }, false);

}

function setupColorSelector() {
	var hlSelector = document.getElementById("color-selector");
	var hlSelectorMarker = document.getElementById("color-selector-inner");
	var sSelector = document.getElementById("saturisation-selector");
	var sSelectorMarker = document.getElementById("saturisation-selector-inner");
	var oSelector = document.getElementById("opacity-selector");
	var oSelectorMarker = document.getElementById("opacity-selector-inner");

	var hue = 0;
	var saturisation = 100;
	var lightness = 0;
	var opacity = 1;

	var hlSelectorDown;
	var sSelectorDown;
	var oSelectorDown;

	function setHSLColor(h, s, l, o) {
		localUser.brushData.setColor(
			hlSelector.style.outlineColor =
			sSelector.style.outlineColor =
			oSelector.style.outlineColor =
			"hsla(" + h + ", " + s + "%, " + l + "%, " + o + ")"
		);
	}
	var hlSelectorMouseMoveListener;
	var sSelectorMouseMoveListener;
	var oSelectorMouseMoveListener;

	hlSelector.addEventListener("mousedown", function(event) { if(event.button == 0) { hlSelectorDown = true; hlSelectorMouseMoveListener.call(this, event); } });
	hlSelector.addEventListener("mouseup", function(event) { if(event.button == 0) hlSelectorDown = false; });
	hlSelector.addEventListener("mousemove", hlSelectorMouseMoveListener = function(event) {
		if(!hlSelectorDown)
			return;

		hue = (event.offsetX / this.offsetWidth) * 360;
		lightness = (event.offsetY / this.offsetHeight) * 100;

		var buildStr = "-webkit-linear-gradient(top, hsl(" + hue + ", 100%, " + lightness + "%), hsl";
		sSelector.style.backgroundImage = buildStr + "(" + hue + ", 0%, " + lightness + "%))";
		oSelector.style.backgroundImage = buildStr + "a(" + hue + ", 0%, " + lightness + "%, " + opacity + "))";

		hlSelectorMarker.style.left = (event.offsetX - 5) + "px";
		hlSelectorMarker.style.top = (event.offsetY - 5) + "px";

		setHSLColor(hue, saturisation, lightness, opacity);
	});

	sSelector.addEventListener("mousedown", function(event) { if(event.button == 0) { sSelectorDown = true; sSelectorMouseMoveListener.call(this, event); }});
	sSelector.addEventListener("mouseup", function(event) { if(event.button == 0) sSelectorDown = false; });
	sSelector.addEventListener("mousemove", sSelectorMouseMoveListener = function(event) {
		if(!sSelectorDown)
			return;

		saturisation = (1 - event.offsetY / this.offsetHeight) * 100;

		sSelectorMarker.style.top = event.offsetY + "px";

		hlSelector.style.backgroundImage="-webkit-linear-gradient(top, black, transparent, white),\
		-webkit-linear-gradient(left, hsl(0, " + saturisation + "%, 50%), hsl(60, " + saturisation + "%, 50%), hsl(120, " + saturisation + "%, 50%),\
		hsl(180, " + saturisation + "%, 50%), hsl(240, " + saturisation + "%, 50%), hsl(300, " + saturisation + "%, 50%), hsl(0, " + saturisation + "%, 50%))";

		setHSLColor(hue, saturisation, lightness, opacity);
	});

	oSelector.addEventListener("mousedown", function(event) { if(event.button == 0) { oSelectorDown = true; oSelectorMouseMoveListener.call(this, event); }});
	oSelector.addEventListener("mouseup", function(event) { if(event.button == 0) oSelectorDown = false; });
	oSelector.addEventListener("mousemove", oSelectorMouseMoveListener = function(event) {
		if(!oSelectorDown)
			return;

		opacity = (1 - event.offsetY / this.offsetHeight);

		oSelectorMarker.style.top = event.offsetY + "px";

		setHSLColor(hue, saturisation, lightness, opacity);
	});
}

function setupBrushes() {
	for(brush in paintBrushes) {
		if(paintBrushes[brush].usesCustomData) {
			var dataSet = {};
			var defaultSet = paintBrushes[brush].defaultCustomData;
			for(attrib in paintBrushes[brush].defaultCustomData)
				dataSet[attrib] = defaultSet[attrib];
			localUser.brushData.customData[brush] = dataSet;
		}
		if(paintBrushes[brush].setup)
			paintBrushes[brush].setup(localUser);
	}
}

$(document).ready(function() {
	brushSizeSlider = document.getElementById("brush-width-slider");

	setupCanvas();
	setupColorSelector();
	setupBrushes();
	loadImage();
});

$(document).unload(function() {
	networking.sendDrawEvent(EVENT_LEAVE, "");
	networking.close();
});