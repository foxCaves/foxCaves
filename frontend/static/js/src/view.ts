async function loadOwnerInfo(userid: number) {
	const resU = await fetch(`/api/v1/users/${userid}`);
	const user = await resU.json();
	document.getElementById('view-owner')!.innerText = user.username;
}

async function makeFilePreview(file: FileInfo) {
	switch (file.type) {
		case FILE_TYPE_IMAGE:
			return `<a href="${file.direct_url}"><img src="${file.direct_url}"></a>`;
		case FILE_TYPE_TEXT:
			return `<pre class="prettyprint linenums" style="display: none;" data-thumbnail-source="${file.thumbnail_url}"></pre>`;
		case FILE_TYPE_VIDEO:
			return `<video controls="controls" crossOrigin="anonymous">
						<source src="${file.direct_url}" type="${file.mimetype}" />
						Your browser is too old to play video.
					</video>`;
		case FILE_TYPE_AUDIO:
			return `<audio id="audioplayer" crossOrigin="anonymous">
						<source src="${file.direct_url}" type="${file.mimetype}" />
						Your browser is too old to play audio.
					</audio>
					<p>
						<button class="btn btn-large btn-success" onclick="return dancerPlay();" type="button"><i class="icon-play"></i></button>
						<button class="btn btn-large btn-warning" onclick="return dancerPause();" type="button"><i class="icon-pause"></i></button>
					</p>
					<canvas style="position: fixed; z-index: 20000; top: 0; left: 0; pointer-events: none;" id="audiovis"></canvas>`;
		case FILE_TYPE_IFRAME:
			return `<iframe id="pdf-view" src="${file.direct_url}" type="${file.mimetype}"></iframe>`;
	}
}

async function loadFileInfo() {
	const split = document.location.pathname.split('/');
	const id = split[split.length - 1];
	const res = await fetch(`/api/v1/files/${id}`);
	const file = (await res.json()) as FileInfo;

	document.getElementById('view-name')!.innerText = file.name;
	document.getElementById('view-time')!.innerText = formatDate(file.time);
	document.getElementById('view-size')!.innerText = formatSize(file.size);
	(document.getElementById('view-link')! as HTMLInputElement).value = file.view_url;
	(document.getElementById('direct-link')! as HTMLInputElement).value = file.direct_url;
	(document.getElementById('download-link')! as HTMLInputElement).value = file.download_url;
	(document.getElementById('download-button')! as HTMLAnchorElement).href = file.download_url;
	loadOwnerInfo(file.user).catch((e) => console.error(e));

	const preview = await makeFilePreview(file);
	const previewWrapper = document.getElementById("preview-wrapper")!;
	previewWrapper.innerHTML = preview || '<h5>File cannot be viewed. Download it.</h5>';
}

$(async () => {
	await loadFileInfo();

	const previewWrapper = document.getElementById("preview-wrapper")!;

	const preview = previewWrapper.childNodes[1]! as HTMLElement;

	if (preview.tagName.toLowerCase() === 'video') {
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
	}
});
