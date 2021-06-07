var loadingEles = 0;

function loadDone() {
	loadingEles--;
	if(loadingEles == 0)
		window.prettyPrint && prettyPrint();
}

var sizePostFixes = [" B", " kB", " MB", " GB", " TB", " PB", " EB", " ZB", " YB"];

function formatSize(size) {
	var sinc = 0;

	while(size > 1024) {
		sinc = sinc + 1;
		size = size / 1024;
		if(sinc == 8)
			break;
	}

	size = Math.ceil(size * 100.0) / 100.0;

	return size + sizePostFixes[sinc];
}

function docReady() {
	var eles = document.getElementsByTagName("pre");
	for(i=0; i < eles.length; i++) {
		var ele = eles[i];
		var src = ele.getAttribute('data-thumbnail-source');
		if(!src) continue;
		ele.style.display = "";
		ele.innerHTML = "[Loading preview...]";
		loadingEles++;
		$.get(SHORT_URL+'/thumbs/'+src, function(data) {
			ele.innerHTML = data;
			loadDone();
		});
	}

	if(loadingEles <= 0) {
		loadingEles = 1;
		loadDone();
	}
}

$(document).ready(function(){
	docReady();

	if(PUSH_CHANNEL == "")
		return;

	pushHandlers.push(function(action, usedbytes) {
		if(action != "U")
			return false;
		$('#used_bytes_text').text(formatSize(usedbytes));
		$('#used_bytes_bar').css('width', Math.ceil((usedbytes / TOTALBYTES) * 100.0) + '%');
		return true;
	});

	function messageReceived(e) {
		var cmds = e.data.split("|");

		for(var i = 0;i < cmds.length;i++) {
			var action = cmds[i].trim();

			if(action == "")
				continue;

			var param = action.substr(1);
			action = action.charAt(0);

			for(var j = 0;j < pushHandlers.length;j++)
				if(pushHandlers[j](action, param))
					break;
		}
	};

	var currentSocket;
	function reconnectSocket(oldSocket) {
		if (oldSocket && currentSocket !== oldSocket) {
			return;
		}
		
		var useSSL = (window.location.protocol == "https:");
		var socket = new WebSocket((useSSL ? "wss:" : "ws:") + window.location.hostname + "/api/events?" + PUSH_CHANNEL);
		currentSocket = socket;

		function reconnectInner() {
			reconnectSocket(socket);
		}
		socket.onmessage = messageReceived;
		socket.onclose = reconnectInner;
		socket.onerror = reconnectInner;
	};

	reconnectSocket();
});
