$(() => {
	const previewWrapper = document.getElementById("preview-wrapper")!;

	const preview = previewWrapper.childNodes[1]! as HTMLElement;

	switch(preview.tagName.toLowerCase()) {
		case 'audio':
			break;
		case 'video':
			preview.addEventListener("click", (ev) => {
				const video = ev.target as HTMLVideoElement;
				if(video.paused)
					video.play();
				else
					video.pause();
			});
			preview.addEventListener("dblclick", (ev) => {
				if(!document.fullscreenElement) {
					(ev.target as HTMLVideoElement).requestFullscreen()
				} else {
					document.exitFullscreen();
				}
			});
			break;
		case 'img':
			break;
	}
});
