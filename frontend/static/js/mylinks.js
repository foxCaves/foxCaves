function newLink() {
	var res = prompt("Please enter the link to shorten:", "https://");
	if(!res)
		return;
	createLink(res);
}

function createLink(linkurl) {
	$.get("/api/shorten?url="+encodeURIComponent(linkurl), function(data) {
		data = data.trim();
		prompt("Here is your shortened link", SHORT_URL+"/g" + data);
		document.location.reload();
	});
}
