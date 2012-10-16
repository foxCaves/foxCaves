var dropZoneDefaultInnerHTML = "";

function handleDropFileSelect(evt) {
	var dropZone = document.getElementById("uploader");

	handleDragOver(evt);

	var files = evt.dataTransfer.files;
	var fileReader = new FileReader();
	var theFile = files[0];
	
	if(!theFile) return;
	
	dropZone.innerHTML = 'Loading file';
	
	fileReader.onloadend = function (evtx) {
		fileUpload(theFile.name, evtx.target.result);
	};
	fileReader.readAsArrayBuffer(theFile);
}

function fileUpload(name, fileData) {
	var dropZone = document.getElementById("uploader");
	dropZone.innerHTML = '<div class="container">Uploading<br /><div id="barUpload" style="margin-left: 50px; margin-right: 50px;" class="progress progress-striped"><div class="bar" style="width: 0%;"></div></div></div>';

	var xhr = new XMLHttpRequest();
	xhr.upload.addEventListener("loadstart", uploadStart, false);
	xhr.upload.addEventListener("progress", uploadProgress, false);
	xhr.upload.addEventListener("load", uploadComplete, false);
	xhr.onreadystatechange = function() {
		if(xhr.readyState == 4) {
			if(xhr.status == 200) {
				document.location.href = "/" + xhr.responseText;
			} else {
				setupDropZone();
				alert("Upload error: " + xhr.responseText);
			}
		}
	};
	xhr.open("PUT", "/create?"+escape(name));
	xhr.send(fileData);
}

function uploadStart(evt) { }

function uploadComplete(evt) { }

function uploadProgress(evt) {
	if(evt.lengthComputable) {
		$('#barUpload div.bar').css("width", ((evt.loaded / evt.total) * 100) + "%");
	}
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
	
	var dropZone = document.getElementById("uploader");
	if(evt.type == "dragover") {
		dropZone.innerHTML = 'Drop file now to upload';
	} else if(evt.type == "dragleave") {
		dropZone.innerHTML = dropZoneDefaultInnerHTML;
	}

    evt.dataTransfer.dropEffect = (evt.type == "dragover" ? "copy" : "");
    evt.target.className = (evt.type == "dragover" ? "hover" : "");
}

function setupDropZone() {
	// Setup the dnd listeners.
	var dropZone = document.getElementById('uploader');

	dropZone.innerHTML = "Drag & drop files here to upload them";
	dropZone.style.border = "2px dashed #555";
	dropZone.style.borderRadius = "7px";
	dropZone.style.fontWeight = "bold";
	dropZone.style.textAlign = "center";
	dropZone.style.color = "#555";
	dropZone.style.padding = "1em 0";
	
	dropZoneDefaultInnerHTML = dropZone.innerHTML;

	dropZone.addEventListener("dragover", handleDragOver, false);
	dropZone.addEventListener("dragleave", handleDragOver, false);
	dropZone.addEventListener("drop", handleDropFileSelect, false);
}

setupDropZone();
