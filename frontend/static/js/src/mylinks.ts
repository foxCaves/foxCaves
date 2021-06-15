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
