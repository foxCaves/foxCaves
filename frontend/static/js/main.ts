declare const prettyPrint: (() => void) |  undefined;

let loadingEles = 0;

function loadDone() {
	loadingEles--;
	if(loadingEles == 0 && prettyPrint) {
		prettyPrint();
	}
}

interface TimedElement {
	created_at: Date;
	updated_at: Date;
}
function sortByTime<T extends TimedElement>(arr: Array<T>) {
	return arr.sort((a, b) => {
		return a.created_at.getTime() - b.created_at.getTime();
	});
}

function convertToDates<T extends TimedElement>(data: T): T {
	data.created_at = new Date(data.created_at);
	data.updated_at = new Date(data.updated_at);
	return data;
}

const sizePostFixes = [" B", " kB", " MB", " GB", " TB", " PB", " EB", " ZB", " YB"];

function formatDate(d: Date) {
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
		fetch(src)
		.then(res => res.text())
		.then(text => {
			ele.innerHTML = text;
			loadDone();
		});
	}

	if(loadingEles <= 0) {
		loadingEles = 1;
		loadDone();
	}
}

async function fetchCurrentUser() {
	const res = await fetch('/api/v1/users/self/details');
	if (res.status !== 200) {
		currentUser = undefined;
		fetchCurrentUserDone();
		return;
	}
	currentUser = convertToDates(await res.json());
	fetchCurrentUserDone();
}

function fetchCurrentUserDone() {
	if (currentUser) {
		if (REQUIRE_GUEST) {
			document.location.href = '/files';
			return;
		}
		$('.show_loginonly').show();
		$('.show_guestonly').hide();
	} else {
		if (REQUIRE_LOGGED_IN) {
			document.location.href = '/login';
			return;
		}
		$('.show_loginonly').hide();
		$('.show_guestonly').show();
	}
	const evt = new Event('fetchCurrentUserDone');
	document.dispatchEvent(evt);
}

async function doLogout() {
	await fetch('/api/v1/users/sessions/logout', { method: 'POST' });
	document.location.href = '/';
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

document.addEventListener('fetchCurrentUserDone', () => {
	if (!currentUser) {
		return;
	}
	$('#username_text').text(currentUser.username);
});

$(async () => {
	docReady();

	await fetchCurrentUser();

	if (!currentUser) {
		return;
	}

	pushHandlers.user = {
		update(data: UserInfo) {
			if (!currentUser || currentUser.id !== data.id) {
				return;
			}
			for (const key of Object.keys(data)) {
				(currentUser as any)[key] = (data as any)[key];
			}
			const evt = new Event('fetchCurrentUserDone');
			document.dispatchEvent(evt);
		},
	};

	function messageReceived(e: MessageEvent) {
		const cmd = JSON.parse(e.data);

		if (cmd.type !== 'liveloading') {
			return;
		}

		const handlerSet = pushHandlers[cmd.model];
		if (!handlerSet) {
			console.info(`EventPush: Unhandled model ${cmd.model}`);
			return;
		}
		const handler = handlerSet[cmd.action];
		if (!handler) {
			console.info(`EventPush: Unhandled action ${cmd.action} on model ${cmd.model}`);
			return;
		}
		handler(cmd.data);
	};

	let currentSocket: WebSocket;
	function reconnectSocket(oldSocket?: WebSocket) {
		if (oldSocket && currentSocket !== oldSocket) {
			return;
		}

		const useSSL = (window.location.protocol == "https:");
		const socket = new WebSocket((useSSL ? "wss:" : "ws:") + window.location.hostname + "/api/v1/ws/events");
		currentSocket = socket;

		socket.onmessage = messageReceived;
		socket.onclose = () => {
			setTimeout(() => reconnectSocket(socket), 5000);
		};
	};

	reconnectSocket();
});
