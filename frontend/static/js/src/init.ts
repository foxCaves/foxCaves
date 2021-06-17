const pushHandlers: {
	[key: string]: (data: any) => boolean | void;
} = {};

function preventDefault(evt: Event | JQuery.Event) {
	evt.stopPropagation();
	evt.preventDefault();
}

declare const USER_ID: number;
declare const SHORT_URL: string;
declare const TOTALBYTES: number;
