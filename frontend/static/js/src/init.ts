const pushHandlers: {
	[key: string]: (data: any) => boolean | void;
} = {};

function preventDefault(evt: Event | JQuery.Event) {
	evt.stopPropagation();
	evt.preventDefault();
}

interface UserInfo {
	id: number;
	username: string;
	usedbytes: number;
	totalbytes: number;
}
let currentUser: UserInfo | undefined = undefined;
declare const SHORT_URL: string;
