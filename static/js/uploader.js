var dropZoneDefaultInnerHTML = "";
var dropZoneTransferInProgress = false;

var dropZoneUploads = new Array();

var dropZoneFileNumber = 0;
var dropZoneFileCount = 0;

function handleDropFileSelect(evt) {
	var dropZone = document.getElementById("uploader");
	handleDragOver(evt);

	var files = evt.dataTransfer.files;
	
	for(var i=0;i<files.length;i++) {
		dropZoneUploads.push(files[i]);
		dropZoneFileCount++;
	}
	
	processNextFile();
}

function processNextFile() {
	if(dropZoneTransferInProgress) return;
	
	resetDropZone();
	
	var dropZone = document.getElementById("uploader_cur");
	
	if(dropZoneUploads.length <= 0) {
		dropZoneFileNumber = 0;
		dropZoneFileCount = 0;
		dropZone.innerHTML = "";
		return;
	}
	
	var theFile = dropZoneUploads.shift();
	
	dropZoneTransferInProgress = true;
	if(dropZoneFileNumber == 0) {
		dropZone.innerHTML = '<div class="container">Uploading<br />File: <div id="barUpload" style="margin-left: 50px; margin-right: 50px;" class="progress progress-striped"><div class="bar" style="width: 0%;"></div></div><br />Total: <div id="barUploadTotal" style="margin-left: 50px; margin-right: 50px;" class="progress progress-striped"><div class="bar" style="width: 0%;"></div></div></div>';
	}
	
	var dropZoneFileReader = new FileReader();
	dropZoneFileReader.onloadend = function (evt) {
		fileUpload(theFile.name, evt.target.result);
	};
	dropZoneFileReader.readAsArrayBuffer(theFile);
}

function fileUpload(name, fileData) {	
	var xhr = new XMLHttpRequest();
	xhr.upload.addEventListener("loadstart", uploadStart, false);
	xhr.upload.addEventListener("progress", uploadProgress, false);
	xhr.upload.addEventListener("load", uploadComplete, false);
	xhr.onreadystatechange = function() {
		if(xhr.readyState == 4) {
			dropZoneTransferInProgress = false;
			
			dropZoneFileNumber++;
			$('#barUploadTotal div.bar').css("width", ((dropZoneFileNumber / dropZoneFileCount) * 100.0) + "%");
			
			if(xhr.status == 200) {
				var file = xhr.responseText.split("\n");
				var fileInfo = file[1].split(">");
				var fileid = fileInfo[0];
				addFileLI(fileid);
				processNextFile();
			} else {
				processNextFile();
				alert("Upload error: " + xhr.responseText);
			}
		}
	};
	xhr.open("PUT", "/api/create?"+escape(name));
	xhr.send(fileData);
}

function uploadStart(evt) {
	_setUploadProgress(0);
}

function uploadComplete(evt) {
	_setUploadProgress(100);
}

function uploadProgress(evt) {
	if(evt.lengthComputable) {
		_setUploadProgress((evt.loaded / evt.total) * 100.0);
	}
}

function _setUploadProgress(progress_percent) {
	$('#barUpload div.bar').css("width", progress_percent + "%");
}

function resetDropZone() {
	var dropZone = document.getElementById("uploader");
	var dropZoneSub = document.getElementById('uploader_sub');
	
	dropZoneSub.innerHTML = dropZoneDefaultInnerHTML;
	
	dropZone.style.color = "";
	dropZone.style.borderColor = "";
	dropZoneTransferInProgress = false;
}

function handleDragOver(evt) {
	if(dropZoneTransferInProgress) return;
	
    evt.stopPropagation();
    evt.preventDefault();
	
	var dropZone = document.getElementById("uploader");
	var dropZoneSub = document.getElementById("uploader_sub");
	
	if(evt.type == "dragover") {
		dropZoneSub.innerHTML = 'Drop file now to upload';
		dropZone.style.color = "#B333E5";
		dropZone.style.borderColor = "#B333E5";
	} else if(evt.type == "dragleave") {
		resetDropZone();
	}

    evt.dataTransfer.dropEffect = (evt.type == "dragover" ? "copy" : "");
    dropZone.className = (evt.type == "dragover" ? "hover" : "");
}

function setupDropZone() {
	// Setup the dnd listeners.
	var dropZoneMain = document.getElementById('uploader');
	dropZoneMain.innerHTML = "<div id='uploader_sub'>Drag & drop files here to upload them</div><div id='uploader_cur'></div>";
	
	dropZoneDefaultInnerHTML = document.getElementById('uploader_sub').innerHTML;
	
	dropZoneMain.addEventListener("dragover", handleDragOver, false);
	dropZoneMain.addEventListener("dragleave", handleDragOver, false);
	dropZoneMain.addEventListener("drop", handleDropFileSelect, false);
}

setupDropZone();

function refreshFiles() {
	$.get('/api/list?idonly', function(data) {
		var files = data.split("\n");
		var files_rev = new Array();
		for(var i=0;i<files.length;i++) {
			var fileid = files[i];
			if(!fileid || fileid == "")
				continue;
			files_rev[fileid] = true;
			if(!document.getElementById("file_"+fileid)) {
				addFileLI(fileid);
			}
		}
		
		$('#file_manage_div li').each(function(i, ele) {
			var fileid = $(ele).attr('id').substr(5);
			if(!files_rev[fileid]) {
				removeFileLI(fileid);
			}
		});
	});
	
	return false;
}

function addFileLI(fileid) {
	$.get("/api/filehtml?" + fileid, function(data) {
		var ele = document.getElementById("file_manage_div");
		ele.innerHTML = data + ele.innerHTML;
	});
}

function removeFileLI(fileid) {
	$('#file_'+fileid).remove();
}

function deleteFile(fileid, filename) {
	if(!window.confirm('Do you really want to delete '+filename+'?'))
		return false;
	
	var eleSel = $("#file_"+fileid+" div.image_manage_main");
	eleSel.css("border", "1px solid red");
	
	$.get('/api/delete?'+fileid, function(data) {
		if(data.charAt(0) == '+') {
			removeFileLI(fileid);
		} else {
			eleSel.css("border", "");
			alert("Error deleting file :(");
		}
	});
	
	return false;
}

$(".image_manage_ul li .image_manage_main .image_manage_top").each(function(idx, elem) {
	elem.style.cursor="move";
});

var bin = document.getElementById("recycle_bin").style.display = "";

bin.addEventListener("dragover", function(ev){ ev.dataTransfer.dropEffect = "move"; }, false);
bin.addEventListener("dragleave", function(ev){ ev.dataTransfer.dropEffect = "none"; }, false);
bin.addEventListener("drop", function(ev){ console.log(ev); }, false);