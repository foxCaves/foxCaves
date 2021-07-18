declare const prettyPrint: (() => void) |  undefined;

let loadingEles = 0;

function loadDone() {
	loadingEles--;
	if(loadingEles == 0 && prettyPrint) {
		prettyPrint();
	}
}

interface TimedElement {
	time: number;
}
function sortByTime<T extends TimedElement>(arr: Array<T>) {
	return arr.sort((a, b) => {
		return a.time - b.time;
	});
}

const sizePostFixes = [" B", " kB", " MB", " GB", " TB", " PB", " EB", " ZB", " YB"];

function formatDate(time: number) {
	const d = new Date(time * 1000);
	return d.toISOString();
}

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

function htmlEscape(str: string) {
	return str;
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
		$.get(src, function(data) {
			ele.innerHTML = data;
			loadDone();
		});
	}

	if(loadingEles <= 0) {
		loadingEles = 1;
		loadDone();
	}
}

async function fetchCurrentUser() {
	const res = await fetch('/api/v1/users/self');
	if (res.status !== 200) {
		currentUser = undefined;
		fetchCurrentUserDone();
		return;
	}
	currentUser = await res.json();
	fetchCurrentUserDone();
}

function fetchCurrentUserDone() {
	if (currentUser) {
		$('.show_loginonly').show();
		$('.show_guestonly').hide();
	} else {
		$('.show_loginonly').hide();
		$('.show_guestonly').show();
	}
	const evt = new Event('fetchCurrentUserDone');
	document.dispatchEvent(evt);
}

async function doLogout() {
	await fetch('/api/v1/users/self/logout', { method: 'POST' });
	document.location.href = '/';
}

function renderUsedSpace() {
	if (!currentUser) {
		return;
	}
	$('#used_bytes_text').text(formatSize(currentUser.usedbytes));
	$('#total_bytes_text').text(formatSize(currentUser.totalbytes));
	$('#used_bytes_bar').css('width', Math.ceil((currentUser.usedbytes / currentUser.totalbytes) * 100.0) + '%');
}

async function submitForm(url: string, method: string, data: BodyInit) {
    const res = await fetch(url, {
        method,
        body: data,
    });
    if (res.status === 200) {
        return { ok: true };
    }
    const resp = await res.json();
    return { ok: false, error: resp.error };
}

async function submitFormSimple(url: string, method: string, data: { [key: string]: string }) {
    const res = await submitForm(url, method, new URLSearchParams(data));
    if (res.ok) {
        return true;
    }
    alert(`Error: ${res.error}`);
	return false;
}


$(async () => {
	docReady();

	await fetchCurrentUser();

	if (!currentUser) {
		return;
	}

	$('#username_text').text(currentUser.username);

	renderUsedSpace();

	pushHandlers.usedbytes = function(data) {
		currentUser!.usedbytes = data.usedbytes;
		renderUsedSpace();
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
		const socket = new WebSocket((useSSL ? "wss:" : "ws:") + window.location.hostname + "/api/v1/ws/events");
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
