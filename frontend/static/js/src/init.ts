const pushHandlers: {
	[key: string]: (data: any) => boolean | void;
} = {};

function preventDefault(evt: Event | JQuery.Event) {
	evt.stopPropagation();
	evt.preventDefault();
}

declare const PUSH_CHANNEL: string;
declare const SHORT_URL: string;
declare const TOTALBYTES: number;
