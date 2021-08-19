REQUIRE_LOGGED_IN = true;

interface FilePush {
	file: FileInfo;
}

const FILES: { [key: string]: FileInfo } = {};

let dropZoneDefaultInnerHTML = "";
let dropZoneTransferInProgress = false;

const dropZoneUploads: (File | string)[] = [];

let dropZoneFileNumber = 0;
let dropZoneFileCount = 0;

function handleDropFileSelect(event: JQuery.Event) {
	handleDragOverJQ(event);

	const datTrans = (event as JQuery.DragEvent).originalEvent!.dataTransfer!;

	if(datTrans.files.length > 0) {
		const files = datTrans.files;
		for(let i=0;i<files.length;i++) {
			dropZoneUploads.push(files[i]!);
			dropZoneFileCount++;
		}
	} else if(datTrans.items.length > 0) {
		dropZoneUploads.push(datTrans.getData("text/plain"));
		dropZoneFileCount++;
	}
	processNextFile();
}

function getDownloadURLFromImageManager(object: HTMLElement) {
	return (object.children[2]!.children[0]!.children[1]! as HTMLAnchorElement).href;
}

function getFileIDFromID(id: string): string {
	return id.substr(5);
}

function formatZeros(val: number, len: number): string {
	return val.toString().padStart(len, '0');
}

let currentUpload: XMLHttpRequest;
let wasAborted = false;

function abortCurrentFileUpload() {
	wasAborted = true;
	currentUpload.abort();
	wasAborted = false;
}

function processNextFile() {
	if(dropZoneTransferInProgress) return;

	resetDropZone();

	const dropZone = document.getElementById("uploader_cur")!;

	if(dropZoneUploads.length <= 0) {
		dropZoneFileNumber = 0;
		dropZoneFileCount = 0;
		dropZone.innerHTML = "";
		return;
	}

	const theFile = dropZoneUploads.shift();

	dropZoneTransferInProgress = true;
	if (dropZoneFileNumber == 0) {
		dropZone.innerHTML = '<div class="container">Uploading<br />File: <span id="curFileName">N/A</span><div id="barUpload" style="margin-left: 50px; margin-right: 50px;" class="progress progress-striped"><div class="bar" style="width: 0%;"></div></div><br />Total: <div id="barUploadTotal" style="margin-left: 50px; margin-right: 50px;" class="progress progress-striped"><div class="bar" style="width: 0%;"></div></div><input type="button"  value="Abort upload" class="btn" onclick="abortCurrentFileUpload();" /></div>';
	}

	if (theFile instanceof File) {
		const dropZoneFileReader = new FileReader();
		const name = theFile.name;
		dropZoneFileReader.onloadend = function (event) {
			fileUpload(name, new Int8Array(<ArrayBuffer>event.target!.result!));
		};
		dropZoneFileReader.readAsArrayBuffer(theFile);
	} else if (theFile) {
		const t = new Date();
		fileUpload("Paste-"+
			formatZeros(t.getDate(), 2)+"."+
			formatZeros(t.getMonth(), 2)+"."+
			formatZeros(t.getFullYear(), 4)+" "+
			formatZeros(t.getHours(), 2)+"."+
			formatZeros(t.getMinutes(), 2)+"."+
			formatZeros(t.getSeconds(), 2)+".txt",
			theFile
		);
	}
}

function fileUpload(name: string, fileData: ArrayBufferLike | string) {
	$('#curFileName').text(name);

	const xhr = new XMLHttpRequest();
	xhr.upload.addEventListener("loadstart", uploadStart, false);
	xhr.upload.addEventListener("progress", uploadProgress, false);
	xhr.upload.addEventListener("load", uploadComplete, false);
	xhr.onreadystatechange = function() {
		if(xhr.readyState == 4) {
			dropZoneTransferInProgress = false;

			dropZoneFileNumber++;
			$('#barUploadTotal div.bar').css("width", ((dropZoneFileNumber / dropZoneFileCount) * 100.0) + "%");

			if(xhr.status == 200) {
				processNextFile();
				const response = JSON.parse(xhr.responseText) as FileInfo;
				FILES[response.id] = convertToDates(response);
				addFileLI(response.id);
			} else {
				processNextFile();
				if (!wasAborted) {
					alert("Upload error: " + xhr.responseText);
				}
			}
		}
	};
	xhr.open("POST", "/api/v1/files?name="+encodeURIComponent(name));
	currentUpload = xhr;
	xhr.send(fileData);
}

function uploadStart() {
	_setUploadProgress(0);
}

function uploadComplete() {
	_setUploadProgress(100);
}

function uploadProgress(event: ProgressEvent) {
	if(event.lengthComputable) {
		_setUploadProgress((event.loaded / event.total) * 100.0);
	}
}

function _setUploadProgress(progress_percent: number) {
	$('#barUpload div.bar').css("width", progress_percent + "%");
}

function resetDropZone() {
	const dropZone = document.getElementById("uploader")!;
	const dropZoneSub = document.getElementById('uploader_sub')!;

	dropZoneSub.innerHTML = dropZoneDefaultInnerHTML;

	$(dropZone).removeClass("active");

	dropZoneTransferInProgress = false;
}

function handleDragOverJQ(event: JQuery.Event) {
	handleDragOver((event as JQuery.DragEvent).originalEvent!);
}

function handleDragOver(event: DragEvent, eventtype?: string) {
	preventDefault(event);

	if (!eventtype) {
		eventtype = event.type;
	}

	const dropZone = document.getElementById("uploader")!;
	const dropZoneSub = document.getElementById("uploader_sub")!;

	if(eventtype == "dragenter") {
		if(currFileDrag) {
			return;
		}
		dropZoneSub.innerHTML = 'Drop file now to upload';
		$(dropZone).addClass("active");
	} else if(eventtype == "dragleave") {
		if(event.pageX !== 0) {
			return;
		}
		resetDropZone();
	}

	event.dataTransfer!.dropEffect = (eventtype == "dragenter" ? "copy" : "none");

	dropZone.className = eventtype == "dragenter" ? "hover" : "";
}

function setupDropZone() {
	const dropZoneMain = document.getElementById('uploader')!;
	dropZoneMain.innerHTML = "<div id='uploader_sub'>Drag & drop files anywhere on this page to upload them</div><div id='uploader_cur'></div>";

	dropZoneDefaultInnerHTML = document.getElementById('uploader_sub')!.innerHTML;

	const docSel = $("*:not(#recycle_bin)");
	docSel.on("dragenter", handleDragOverJQ);
	docSel.on("dragleave.dropZone", handleDragOverJQ);
	docSel.on("dragover.dropZone", preventDefault);
	docSel.on("drop.dropZone", handleDropFileSelect);

	document.body.addEventListener("mouseout", function() { resetDropZone(); }, false);
}

function refreshFiles() {
	fetch(`/api/v1/files?t=${Date.now()}`)
	.then(response => response.json())
	.then(data => data.map(convertToDates))
	.then(data => {
		const files = sortByTime(data as FileInfo[]);
		const files_rev: { [key: string]: boolean } = {};
		for (const file of files) {
			FILES[file.id] = file;
			files_rev[file.id] = true;
			if(!document.getElementById("file_"+file.id)) {
				addFileLI(file.id);
			}
		}

		$('#file_manager > li').each(function(_, ele) {
			const id = getFileIDFromID($(ele).attr('id')!);
			if(!files_rev[id]) {
				delete FILES[id];
				removeFileLI(id);
			}
		});
	});

	return false;
}

function getFileLI(id: string) {
	const file = FILES[id];
	if (!file) {
		return;
	}
	const escapedName = htmlEscape(file.name);
	const addDropdown = (file.type == FILE_TYPE_IMAGE) ? `<li class="dropdown-submenu">
		<a>Convert to</a>
		<ul class="file_convert dropdown-menu">
			<li><a>jpg</a></li>
			<li><a>png</a></li>
			<li><a>gif</a></li>
			<li><a>bmp</a></li>
		</ul>
	</li>` : '';
	const fileLI = `<li draggable="true" id="file_${file.id}" class="image_manage_main" style="background-image:url('${file.thumbnail_image}')">
		<div class="image_manage_top" title="${formatDate(file.created_at)} [${escapedName}]">${escapedName}</div>
		<a href="/view?id=${file.id}"></a>
		<div class="image_manage_bottom">
			<span>
				<a title="View" href="${file.view_url}"><i class="icon-picture icon-white"></i> </a>
				<a title="Download" href="${file.download_url}"><i class="icon-download icon-white"></i> </a>
				<div class="dropdown">
					<a title="Options" class="dropdown-toggle" data-toggle="dropdown" href=""><i class="icon-wrench icon-white"></i> </a>
					<ul class="dropdown-menu">
						<li><a class="file_rename">Rename</a></li>
						<li><a href="/live?id=${file.id}">Edit</a></li>
						${addDropdown}
					</ul>
				</div>
				<a title="Delete" class="pointer"><i class="icon-remove icon-white"></i> </a>
			</span>
			${formatSize(file.size)}
		</div>
	</li>`;

	const newFileTmp = document.createElement("ul");//Fake
	newFileTmp.innerHTML = fileLI;
	const newFile = newFileTmp.firstChild! as HTMLElement;
	return newFile;
}

function startFileDrag(this: HTMLElement, event: DragEvent) {
	currFileDrag = this;
	const fileName = (this.children[0]! as HTMLElement).innerText;
	event.dataTransfer!.setData(
		"DownloadURL",
		fileName + ":" + getDownloadURLFromImageManager(this)
	);
	window.setTimeout("currFileDrag.style.opacity = '0.2';", 1);
	trashBin.style.opacity = "0.7";
}

function endFileDrag() {
	currFileDrag!.style.opacity = "1";
	currFileDrag = undefined;
	trashBin.style.opacity = "0.05";
}

function setupFileJS(parent: JQuery | HTMLElement) {
	if (!('find' in parent)) {
		parent = $(parent);
	}

	parent.find(".file_rename").click(async function(e) {
		preventDefault(e);
		const id = getFileIDFromID((this.parentNode!.parentNode!.parentNode!.parentNode!.parentNode!.parentNode! as HTMLElement).id);
		const newName = prompt("Enter new name", FILES[id]!.name);
		if (newName) {
			const res = await fetch(`/api/v1/files/${id}`, {
				method: "PATCH",
				body: new URLSearchParams({ name: newName }),
			});

			const data = await res.json();
			if (res.status !== 200) {
				alert("Error renaming file: " + data.error);
				return;
			}
			FILES[id] = data;
			refreshFileLI(id);
		}
	});

	parent.find(".file_convert > li > a").click(async function(e) {
		preventDefault(e);
		const id = getFileIDFromID((this.parentNode!.parentNode!.parentNode!.parentNode!.parentNode!.parentNode!.parentNode!.parentNode! as HTMLElement).id);
		const newExtension = this.innerText;
		const res = await fetch(`/api/v1/files/${id}/convert`, {
			method: "POST",
			body: new URLSearchParams({ extension: newExtension }),
		});
		const data = await res.json();
		if (res.status !== 200) {
			alert("Error converting file: " + data.error);
			return;
		}
		FILES[id] = data;
		refreshFileLI(id);
	});

	parent.find(".image_manage_bottom > span > a[title=Delete]").click(function(e) {
		preventDefault(e);
		deleteFile(getFileIDFromID((this.parentNode!.parentNode!.parentNode! as HTMLElement).id), true);
	});

	parent.each(function(_idx, elem) {
		elem.addEventListener("dragstart", startFileDrag, false);
		elem.addEventListener("dragend", endFileDrag, false);
	});
}

function addFileLI(id: string, no_refresh_if_exist?: boolean) {
	if(document.getElementById("file_"+id)) {
		if(!no_refresh_if_exist) {
			refreshFileLI(id);
		}
		return;
	}
	const ele = document.getElementById("file_manager")!;
	const newFile = getFileLI(id);
	if (!newFile) {
		removeFileLI(id);
		return;
	}
	ele.insertBefore(newFile, ele.firstChild);
	setupFileJS(newFile);
}

function removeFileLI(id: string) {
	$('#file_'+id).remove();
}

function refreshFileLI(id: string) {
	const newFile = getFileLI(id);
	if (!newFile) {
		removeFileLI(id);
		return;
	}
	$('#file_'+id).replaceWith(newFile);
	setupFileJS(newFile);
}

function deleteFile(id: string, doConfirm?: boolean) {
	if(doConfirm && !confirm("Are you sure you want to delete this file")) {
		return;
	}

	$("#file_"+id).css("border", "1px solid red"); //Highlight file deletion

	fetch(`/api/v1/files/${id}`, { method: 'DELETE' })
	.then(response => {
		if(response.status < 200 || response.status > 299) {
			alert("Error deleting file :(");
			refreshFiles();
			return;
		}
		removeFileLI(id);
	});

	return false;
}

let currFileDrag: HTMLElement | undefined;
let trashBin: HTMLElement;

function setupFileDragging() {
	setupFileJS($(".image_manage_main"));

	trashBin = document.getElementById("recycle_bin")!;

	trashBin.style.display = "";

	trashBin.addEventListener("dragover", preventDefault);

	trashBin.addEventListener("dragenter", function(ev) {
		ev.stopPropagation();
		ev.preventDefault();

		handleDragOver(ev, "dragleave");

		if(!currFileDrag)
			return;

		ev.dataTransfer!.dropEffect = "move";
		(ev.target! as HTMLElement).style.opacity = "1";
	}, false);

	trashBin.addEventListener("dragleave", function(ev) {
		ev.stopPropagation();
		ev.preventDefault();

		ev.dataTransfer!.dropEffect = "none";
		trashBin.style.opacity = "0.7";
	}, false);

	trashBin.addEventListener("drop", function(ev) {
		ev.stopPropagation();
		ev.preventDefault();

		if(!currFileDrag) {
			return;
		}	

		deleteFile(getFileIDFromID(currFileDrag.id));
		trashBin.style.opacity = "";
	}, false);
}



function setupPasting() {
	document.body.addEventListener("paste", function(event) {
		if(event.clipboardData!.items.length >= 1) {
			if(!event.clipboardData!.types.includes("text/plain"))
				return;
			dropZoneUploads.push(event.clipboardData!.getData("text/plain"));//Upload clipboard contents
			dropZoneFileCount++;
			processNextFile();
		}
	}, false);
}

function setupSearch() {
	document.getElementById("filter-form")!.style.display = "inline";
	const previewWrapper = document.getElementById("file_manager")!;
	document.getElementById("name-filter")!.addEventListener("keyup", function(){
		const nodes = previewWrapper.childNodes;
		const val = (this as HTMLInputElement).value.toLowerCase();
		for(let i = 0;i < nodes.length;++i) {
			const node = (nodes[i]! as HTMLElement);
			if(node.nodeType != 1) {
				continue;
			}
			if((node.children[0]! as HTMLElement).innerText.toLowerCase().indexOf(val) == -1) {
				node.style.display = "none";
			} else if(node.style.display == "none") {
				node.style.display = "";
			}
		}		
	});
}

$(() => {
	//setupOptionMenu();

	setupDropZone();
	setupFileDragging();

	setupPasting();

	setupSearch();

	pushHandlers['file:create'] = function (data: FilePush) {
		FILES[data.file.id] = convertToDates(data.file);
		addFileLI(data.file.id, true);
	};
	pushHandlers['file:delete'] = function (data: FilePush) {
		delete FILES[data.file.id];
		removeFileLI(data.file.id);
	};
	pushHandlers['file:refresh'] = function (data: FilePush) {
		for (const key of Object.keys(data.file)) {
			(FILES[data.file.id] as any)[key] = (data.file as any)[key];
		}
		FILES[data.file.id] = convertToDates(FILES[data.file.id]!);
		refreshFileLI(data.file.id);
	};

	refreshFiles();
});
