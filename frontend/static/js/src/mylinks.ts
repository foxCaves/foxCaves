function newLink() {
	const res = prompt("Please enter the link to shorten:", "https://");
	if(!res)
		return;
	createLink(res);
}

function createLink(linkurl: string) {
	$.get("/api/shorten?url="+encodeURIComponent(linkurl), (data) => {
		prompt("Here is your shortened link", data.url);
		document.location.reload();
	});
}
