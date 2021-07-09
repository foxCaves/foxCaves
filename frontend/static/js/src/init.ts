const pushHandlers: {
	[key: string]: (data: any) => boolean | void;
} = {};

interface FileInfo {
	extension: string;
	download_url: string;
	name: string;
	mimetype: string;
	time: number;
	id: string;
	thumbnail_url?: string;
	thumbnail_image: string;
	user: number;
	type: number;
	size: number;
	view_url: string;
	direct_url: string;
}

const FILE_TYPE_OTHER = 0;
const FILE_TYPE_IMAGE = 1;
const FILE_TYPE_TEXT = 2;
const FILE_TYPE_VIDEO = 3;
const FILE_TYPE_AUDIO = 4;
const FILE_TYPE_IFRAME = 5;

function preventDefault(evt: Event | JQuery.Event) {
	evt.stopPropagation();
	evt.preventDefault();
}

interface UserInfo {
	id: number;
	username: string;
	email: string;
	apikey: string;
	usedbytes: number;
	totalbytes: number;
}
let currentUser: UserInfo | undefined = undefined;
declare const SHORT_URL: string;
