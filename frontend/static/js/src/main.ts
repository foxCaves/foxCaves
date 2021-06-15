declare const prettyPrint: (() => void) |  undefined;

let loadingEles = 0;

function loadDone() {
	loadingEles--;
	if(loadingEles == 0 && prettyPrint) {
		prettyPrint();
	}
}

const sizePostFixes = [" B", " kB", " MB", " GB", " TB", " PB", " EB", " ZB", " YB"];

function formatSize(size: number) {
	let sinc = 0;

	while(size > 1024) {
		sinc = sinc + 1;
		size = size / 1024;
		if(sinc == 8)
			break;
	}

	size = Math.ceil(size * 100.0) / 100.0;

	return size + sizePostFixes[sinc]!;
}

function docReady() {
	const eles = document.getElementsByTagName("pre");
	for(let i=0; i < eles.length; i++) {
		const ele = eles[i]!;
		const src = ele.getAttribute('data-thumbnail-source');
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

$(() => {
	docReady();

	if(PUSH_CHANNEL == "")
		return;

	pushHandlers.usedbytes = function(data) {
		$('#used_bytes_text').text(formatSize(data.usedbytes));
		$('#used_bytes_bar').css('width', Math.ceil((data.usedbytes / TOTALBYTES) * 100.0) + '%');
		return true;
	};

	function messageReceived(e: MessageEvent) {
		const cmd = JSON.parse(e.data);

		const handler = pushHandlers[cmd.action];
		if (!handler) {
			return;
		}
		handler(cmd);
	};

	let currentSocket: WebSocket;
	function reconnectSocket(oldSocket?: WebSocket) {
		if (oldSocket && currentSocket !== oldSocket) {
			return;
		}

		const useSSL = (window.location.protocol == "https:");
		const socket = new WebSocket((useSSL ? "wss:" : "ws:") + window.location.hostname + "/api/v1/ws/events?channel=" + PUSH_CHANNEL);
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
