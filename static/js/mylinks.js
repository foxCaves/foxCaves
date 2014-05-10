function newLink() {
	var res = prompt("Please enter the link to shorten:", "http://");
	if(!res)
		return;
	createLink(res);
}

function createLink(linkurl) {
	$.get("/api/shorten?"+linkurl, function(data) {
		data = data.trim();
		prompt("Here is your shortened link", "https://fox.re/g" + data);
		document.location.reload();
	});
}