function newLink() {
	var res = prompt("Please enter the link to shorten:", "https://");
	if(!res)
		return;
	createLink(res);
}

function createLink(linkurl) {
	$.get("/api/shorten?url="+encodeURIComponent(linkurl), function(data) {
		data = JSON.parse(data);
		prompt("Here is your shortened link", data.url);
		document.location.reload();
	});
}
