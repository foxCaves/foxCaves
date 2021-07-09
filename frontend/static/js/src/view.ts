async function loadFileInfo() {
	const split = document.location.pathname.split('/');
	const id = split[split.length - 1];
	const res = await fetch(`/api/v1/files/${id}`);
	const file = (await res.json()) as FileInfo;

	document.getElementById('view-name')!.innerText = file.name;
	document.getElementById('view-time')!.innerText = formatDate(file.time);
	document.getElementById('view-size')!.innerText = formatSize(file.size);
	document.getElementById('view-link')!.innerText = file.view_url;
	document.getElementById('direct-link')!.innerText = file.direct_url;
	document.getElementById('download-link')!.innerText = file.download_url;
	(document.getElementById('download-button')! as HTMLAnchorElement).href = file.download_url;

	const resU = await fetch(`/api/v1/users/${file.user}`);
	const user = await resU.json();
	document.getElementById('view-owner')!.innerText = user.username;
}

$(async () => {
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
