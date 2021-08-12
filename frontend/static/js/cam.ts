navigator.getUserMedia({video : true}, function(stream) {
	const canvasElement = document.createElement("canvas");
	const renderContext = canvasElement.getContext("2d")!;

	const video = document.createElement("video");

	video.src = window.URL.createObjectURL(stream);

	const body = document.body;

	const button = document.createElement("input");

	button.type = "button";

	button.addEventListener("click", function() {
		renderContext.drawImage(video, 0, 0);
	});

	button.value = "snapshot";

	video.addEventListener("loadedmetadata", function() {

		canvasElement.width = video.videoWidth;
		canvasElement.height = video.videoHeight;

		body.appendChild(video);
		body.appendChild(canvasElement);
		body.appendChild(button);
	}, false);
	video.play();
}, (err) => {
	console.error(err);
	alert('could not access user video');
})
