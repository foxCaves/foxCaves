navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

navigator.getUserMedia({video : true}, function(stream) { 
	console.log("FUCK");
	var canvasElement = document.createElement("canvas");
	var renderContext = canvasElement.getContext("2d");
	
	var video = document.createElement("video");
	
	video.src = window.URL.createObjectURL(stream);
	
	body = document.getElementsByTagName("body")[0];
	
	var button = document.createElement("input");
	
	button.type = "button";
	
	button.addEventListener("click", function(event) {
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
})
