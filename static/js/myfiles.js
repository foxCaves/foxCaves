var dropZoneDefaultInnerHTML = "";
var dropZoneTransferInProgress = false;

var dropZoneUploads = new Array();

var dropZoneFileNumber = 0;
var dropZoneFileCount = 0;

function handleDropFileSelect(evt) {
	var dropZone = document.getElementById("uploader");
	handleDragOver(evt);

	var files = evt.originalEvent.dataTransfer.files;
	
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
		dropZone.innerHTML = '<div class="container">Uploading<br />File: <span id="curFileName">N/A</span><div id="barUpload" style="margin-left: 50px; margin-right: 50px;" class="progress progress-striped"><div class="bar" style="width: 0%;"></div></div><br />Total: <div id="barUploadTotal" style="margin-left: 50px; margin-right: 50px;" class="progress progress-striped"><div class="bar" style="width: 0%;"></div></div></div>';
	}
	
	var dropZoneFileReader = new FileReader();
	dropZoneFileReader.onloadend = function (evt) {
		fileUpload(theFile.name, evt.target.result);
	};
	dropZoneFileReader.readAsArrayBuffer(theFile);
}

function fileUpload(name, fileData) {	
	$('#curFileName').text(name);

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
				//Comes from long-polling!
				//var file = xhr.responseText.split("\n");
				//var fileInfo = file[1].split(">");
				//var fileid = fileInfo[0];
				//addFileLI(fileid);
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

function preventDefault(evt) {
    evt.stopPropagation();
    evt.preventDefault();	
}


function handleDragOver(evt, evttype) {
    evt.stopPropagation();
    evt.preventDefault();
	
	if(!evttype) {
		evttype = evt.type;
	}
	
	var dropZone = document.getElementById("uploader");
	var dropZoneSub = document.getElementById("uploader_sub");
	
	if(evttype == "dragenter") {
		if(currFileDrag)
			return;
		dropZoneSub.innerHTML = 'Drop file now to upload';
		dropZone.style.color = "#B333E5";
		dropZone.style.borderColor = "#B333E5";
	} else if(evttype == "dragleave") {
		if(evt.originalEvent && evt.originalEvent.pageX != "0")
			return;
		resetDropZone();
	}
	
	if(evt.originalEvent) {
		evt.originalEvent.dataTransfer.dropEffect = (evttype == "dragenter" ? "copy" : "");
	}
    dropZone.className = (evttype == "dragenter" ? "hover" : "");
}

function setupDropZone() {
	var dropZoneMain = document.getElementById('uploader');
	dropZoneMain.innerHTML = "<div id='uploader_sub'>Drag & drop files anywhere on this page to upload them</div><div id='uploader_cur'></div>";
	
	dropZoneDefaultInnerHTML = document.getElementById('uploader_sub').innerHTML;
	
	var docSel = $("*:not(#recycle_bin)");
	docSel.bind("dragenter.dropZone", handleDragOver);
	docSel.bind("dragleave.dropZone", handleDragOver);
	docSel.bind("dragover.dropZone", preventDefault);
	docSel.bind("drop.dropZone", handleDropFileSelect);
}

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

function getFileLI(fileid, func) {
	$.get("/api/filehtml?" + fileid, function(data) {
		data = data.trim();
		
		if(data[0] == '-') {
			func(null);
			return;
		}
	
		var newFile = document.createElement("ul");
		newFile.innerHTML = data;
		newFile = newFile.firstChild;
		newFile.style.cursor = "move";

		func(newFile);
	})
}

function addFileLI(fileid, no_refresh_if_exist) {
	if(document.getElementById("file_"+fileid)) {
		if(!no_refresh_if_exist) {
			refreshFileLI(fileid);
		}
		return;
	}
	var ele = document.getElementById("file_manage_div");
	getFileLI(fileid, function(newFile) {
		if(!newFile) return;
		ele.insertBefore(newFile, ele.firstChild);
	});
}

function removeFileLI(fileid) {
	$('#file_'+fileid).remove();
}

function refreshFileLI(fileid) {
	getFileLI(fileid, function(newFile) {
		if(!newFile) {
			removeFileLI(fileid);
			return;
		}
		$('#file_'+fileid).replaceWith(newFile);
	});
}

function deleteFile(fileid, filename) {
	if(filename && !window.confirm('Do you really want to delete '+filename+'?'))
		return false;
	
	var eleSel = $("#file_"+fileid+" div.image_manage_main");
	eleSel.css("border", "1px solid red");
	
	$.get('/api/delete?'+fileid, function(data) {
		if(data.charAt(0) == '+') {
			//Comes from long-polling
			//removeFileLI(fileid);
		} else {
			refreshFileLI(fileid);
			alert("Error deleting file :(");
		}
	}).error(function() {
		refreshFileLI(fileid);
		alert("Error deleting file :(");
	});;
	
	return false;
}

var currFileDrag;

function setupFileDragging() {
	$(".image_manage_ul li .image_manage_main .image_manage_top").each(function(idx, elem) {
		elem.style.cursor="move";
	});
	
	var trashBin = document.getElementById("recycle_bin");

	function startFileDrag(ev) {
		currFileDrag = ev.target;
		trashBin.style.opacity = "0.7";
	}
	
	function endFileDrag(ev) {
		currFileDrag = false;
		trashBin.style.opacity = "0.5";
	}
	
	$(".image_manage_ul li").each(function(idx, elem) {
		elem.addEventListener("dragstart", startFileDrag, false);
		elem.addEventListener("dragend", endFileDrag, false);
	});


	trashBin.style.display = "";
	
	trashBin.addEventListener("dragover", preventDefault);

	trashBin.addEventListener("dragenter", function(ev){
		ev.stopPropagation();
		ev.preventDefault();
		
		handleDragOver(ev, "dragleave");
		
		if(!currFileDrag)
			return;
		
		ev.dataTransfer.dropEffect = "move";
		ev.target.style.opacity = "1";
	}, false);

	trashBin.addEventListener("dragleave", function(ev){
		ev.stopPropagation();
		ev.preventDefault();
		
		ev.dataTransfer.dropEffect = "";
		trashBin.style.opacity = "0.7";
	}, false);

	trashBin.addEventListener("drop", function(ev){
		ev.stopPropagation();
		ev.preventDefault();
		
		if(!currFileDrag)
			return;
			
		deleteFile(currFileDrag.id.substr(5));
		trashBin.style.opacity = "";
	}, false);
}

var headUtil;

function setupHeadUtils() {
	var headUtl = document.getElementById("head-util-container");
	var jqHeadUtl = $(headUtl);
	var parent = headUtl.parentNode
	var jqParent = $(parent);
	
	var refreshNode = document.createTextNode(' ');
	headUtil = {
		clear: function (ev) {
			while (headUtl.hasChildNodes())
				headUtl.removeChild(headUtl.lastChild);
		},
		
		appendElement: function(elem) {
			headUtl.appendChild(elem);
		},
		
		removeElement: function(elem) {
			headUtl.removeChild(elem);
		},
		
		show: function(callback) {
			jqHeadUtl.slideDown(200, callback);
			jqParent.addClass("expanded");
			parent.appendChild(refreshNode);
			parent.removeChild(refreshNode);
		},
		
		hide: function(callback) {
			jqHeadUtl.slideUp(200, callback);
			jqParent.removeClass("expanded");
		},
		
		toggle: function (callback) {
			jqHeadUtl.toggle(200, callback);
		}
	};
}

function setupOptionMenu() {
	function getFileLIFromEvt(ev) {
		return ev.target.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode;;
	}

	function handleBase64Request(ev) {
		var fileName = getFileLIFromEvt(ev).getAttribute("data-file-id");
		$.get("/api/base64?"+fileName, function(data) {
			var headUtl = document.getElementById("head-util-container");
			var text = document.createElement("textarea");
			text.value = data;
			headUtl.appendChild(text);
		});
	}

	$(".getbase64").each(function(idx, elem) {
		elem.onclick = handleBase64Request;
	});
	
	function handleImageEdit(event) {
	}
	
	$(".edit").each(function(idx, elem) {
		elem.onclick = handleBase64Request;
	});
}

function startImageEdit(event) {

}

$(document).ready(function() {
	setupHeadUtils();
	
	setupOptionMenu();

	setupDropZone();
	setupFileDragging();
	
	pushHandlers.push(function(action, file) {
		if(action == '+') {
			addFileLI(file, true);
			return true;
		} else if(action == '-') {
			removeFileLI(file);
			return true;
		} else if(action == '=') {
			refreshFileLI(file);
			return true;
		}
		return false;
	});
});