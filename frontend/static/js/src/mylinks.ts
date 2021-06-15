function newLink() {
	const res = prompt("Please enter the link to shorten:", "https://");
	if(!res)
		return;
	createLink(res);
}

function createLink(linkurl: string) {
	$.post("/api/v1/links?url="+encodeURIComponent(linkurl), '', (data) => {
		prompt("Here is your shortened link", data.short_url);
		document.location.reload();
	});
}

function refreshLinks() {

}

interface LinkInfo {
	short_url: string;
	user: number;
	url: string;
	time: number;
	id: string;
}

interface LinkPush {
	link: LinkInfo;
}

$(() => {
	pushHandlers['link:create'] = function (data: LinkPush) {
		console.log(data);
	};
	pushHandlers['link:delete'] = function (data: LinkPush) {
		console.log(data);
	};
	pushHandlers['link:refresh'] = function (data: LinkPush) {
		console.log(data);
	};

	refreshLinks();
});
