$(document).ready(function() {
	var previewWrapper = document.getElementById("preview-wrapper");

	var preview = previewWrapper.childNodes[1];

	switch(preview.tagName.toLowerCase()) {
		case 'audio':
			break;
		case 'video':
			preview.addEventListener("click", function(ev) {
				var video = ev.target;
				if(video.paused)
					video.play();
				else
					video.pause();
			});
			preview.addEventListener("dblclick", function(ev) {
				var video = ev.target;
				if(document.mozFullscreen || document.webkitIsFullscreen) {
					if(video.mozCancelFullScreen)
						video.mozCancelFullScreen();
					else if(video.webkitCancelFullScreen)
						video.webkitCancelFullScreen();

				} else {
					if(video.mozRequestFullScreen)
						video.mozRequestFullScreen();
					else if(video.webkitEnterFullScreen)
						video.webkitEnterFullScreen();
				}
			});
			break;
		case 'img':
			break;
	}
});
