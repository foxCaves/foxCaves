let dropZoneDefaultInnerHTML = "";
let dropZoneTransferInProgress = false;

const dropZoneUploads: (File | string)[] = [];

let dropZoneFileNumber = 0;
let dropZoneFileCount = 0;

const mimetypes: {
	[key: string]: string;
} = {
	"bmp" : "image/bmp",
	"c" : "text/plain",
	"cpp" : "text/plain",
	"cs" : "text/plain",
	"css" : "text/css",
	"flac" : "audio/flac",
	"gif" : "image/gif",
	"h" : "text/plain",
	"htaccess" : "text/plain",
	"htm" : "text/html",
	"html" : "text/html",
	"java" : "text/plain",
	"jpeg" : "image/jpeg",
	"jpg" : "image/jpeg",
	"js" : "text/javascript",
	"lua" : "text/plain",
	"mp3" : "audio/mpeg",
	"mp4" : "video/mp4",
	"ogg" : "audio/ogg",
	"pdf" : "application/pdf",
	"php" : "text/plain",
	"php3" : "text/plain",
	"php4" : "text/plain",
	"php5" : "text/plain",
	"php6" : "text/plain",
	"phtm" : "text/plain",
	"phtml" : "text/plain",
	"pl" : "text/plain",
	"png" : "image/png",
	"py" : "text/plain",
	"shtm" : "text/html",
	"shtml" : "text/html",
	"txt" : "text/plain",
	"vb" : "text/plain",
	"wav" : "audio/wav",
	"webm" : "video/webm"
}

function getMimeTypeFromFile(file: string) {
	return mimetypes[/([\d\w]+)$/.exec(file)![0]!] || "application/octet-stream";
}

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
			} else {
				processNextFile();
				if(!wasAborted)
					alert("Upload error: " + xhr.responseText);
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
	$.get(`/api/v1/files?type=idonly&t=${Date.now()}`, function(data) {
		const files = data as string[];
		const files_rev: { [key: string]: boolean } = {};
		for(let i = 0;i < files.length;i++) {
			const fileid = files[i];
			if(!fileid) {
				continue;
			}
			files_rev[fileid] = true;
			if(!document.getElementById("file_"+fileid)) {
				addFileLI(fileid);
			}
		}

		$('#file_manager > li').each(function(_, ele) {
			const fileid = $(ele).attr('id')!.substr(5);
			if(!files_rev[fileid])
				removeFileLI(fileid);
		});
	});

	return false;
}

function getFileLI(fileid: string, func: (newFile: HTMLElement | null) => void) {
	$.get(`/api/v1/files/${fileid}/html`, function(data) {
		data = data.trim();

		if(data[0] == '-') {
			func(null);
			return;
		}

		const newFileTmp = document.createElement("ul");//Fake
		newFileTmp.innerHTML = data;
		const newFile = newFileTmp.firstChild!;

		$(newFile).find(".image_manage_top, .image_manage_bottom").each(function(_, elem) {
			elem.style.cursor="move";
		});

		func(newFile as HTMLElement);
	})
}

function startFileDrag(this: HTMLElement, event: DragEvent) {
	currFileDrag = this;
	const fileName = (this.children[0]! as HTMLElement).innerText;
	event.dataTransfer!.setData(
		"DownloadURL",
		getMimeTypeFromFile(fileName) + fileName + ":" + getDownloadURLFromImageManager(this)
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

	parent.find(".image_manage_bottom > span > a[title=Delete]").click(function(e) {
		preventDefault(e);
		deleteFile(getFileIDFromID((this.parentNode!.parentNode!.parentNode! as HTMLElement).id), true);
	});

	parent.each(function(_idx, elem) {
		elem.addEventListener("dragstart", startFileDrag, false);
		elem.addEventListener("dragend", endFileDrag, false);
	});
}

function addFileLI(fileid: string, no_refresh_if_exist?: boolean) {
	if(document.getElementById("file_"+fileid)) {
		if(!no_refresh_if_exist) {
			refreshFileLI(fileid);
		}
		return;
	}
	const ele = document.getElementById("file_manager")!;
	getFileLI(fileid, function(newFile) {
		if(!newFile) {
			return;
		}
		ele.insertBefore(newFile, ele.firstChild);
		setupFileJS(newFile);
	});
}

function removeFileLI(fileid: string) {
	$('#file_'+fileid).remove();
}

function refreshFileLI(fileid: string) {
	getFileLI(fileid, function(newFile) {
		if(!newFile) {
			removeFileLI(fileid);
			return;
		}
		$('#file_'+fileid).replaceWith(newFile);
		setupFileJS(newFile);
	});
}

function deleteFile(fileid: string, doConfirm?: boolean) {
	if(doConfirm && !confirm("Are you sure you want to delete this file")) {
		return;
	}

	$("#file_"+fileid).css("border", "1px solid red");//Highlight file deletion

	$.ajax({url: `/api/v1/files/${fileid}`, method: 'DELETE' })
	.done(function() { })
	.fail(function() {
		refreshFileLI(fileid);
		alert("Error deleting file :(");
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

		deleteFile(currFileDrag.id.substr(5));
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

interface FilePush {
	id: string;
}

$(() => {
	//setupOptionMenu();

	setupDropZone();
	setupFileDragging();

	setupPasting();

	setupSearch();

	pushHandlers['file:create'] = function (data: FilePush) {
		addFileLI(data.id, true);
	};
	pushHandlers['file:delete'] = function (data: FilePush) {
		removeFileLI(data.id);
	};
	pushHandlers['file:refresh'] = function (data: FilePush) {
		refreshFileLI(data.id);
	};

	refreshFiles();
});
