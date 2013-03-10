var dropZoneDefaultInnerHTML = "";
var dropZoneTransferInProgress = false;

var dropZoneUploads = new Array();

var dropZoneFileNumber = 0;
var dropZoneFileCount = 0;

function handleDropFileSelect(event) {
	var dropZone = document.getElementById("uploader");
	handleDragOver(event);

	var datTrans = event.originalEvent.dataTransfer;

	if(datTrans.files.length > 0) { 
		var files = datTrans.files;
		for(var i=0;i<files.length;i++) {
			dropZoneUploads.push(files[i]);
			dropZoneFileCount++;
		}
	} else if(datTrans.items.length > 0) {
		dropZoneUploads.push(datTrans.getData("text/plain"));
		dropZoneFileCount++;
	}
	processNextFile();
}

function formatZeros(val, len) {
	var val = val.toString();
	return (new Array(len - val.length + 1).join("0"))+val;
}

var currentUpload;
var wasAborted = false;

function abortCurrentFileUpload() {
	wasAborted = true;
	currentUpload.abort();
	wasAborted = false;
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
	if(dropZoneFileNumber == 0)
		dropZone.innerHTML = '<div class="container">Uploading<br />File: <span id="curFileName">N/A</span><div id="barUpload" style="margin-left: 50px; margin-right: 50px;" class="progress progress-striped"><div class="bar" style="width: 0%;"></div></div><br />Total: <div id="barUploadTotal" style="margin-left: 50px; margin-right: 50px;" class="progress progress-striped"><div class="bar" style="width: 0%;"></div></div><input type="button"  value="Abort upload" class="btn" onclick="abortCurrentFileUpload();" /></div>';

	if(typeof theFile == "object") {
		var dropZoneFileReader = new FileReader();
		dropZoneFileReader.onloadend = function (event) {
			fileUpload(theFile.name, new Int8Array(event.target.result));
		};
		dropZoneFileReader.readAsArrayBuffer(theFile);
	} else if(typeof theFile == "string") {
		var t = new Date();
		fileUpload("Paste-"+
			formatZeros(t.getDate(), 2)+"."+
			formatZeros(t.getMonth(), 2)+"."+
			formatZeros(t.getYear(), 4)+" "+
			formatZeros(t.getHours(), 2)+"."+
			formatZeros(t.getMinutes(), 2)+"."+
			formatZeros(t.getSeconds(), 2)+".txt",
			theFile
		);
	}
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
				if(!wasAborted)
					alert("Upload error: " + xhr.responseText);
			}
		}
	};
	xhr.open("PUT", "/api/create?"+escape(name));
	currentUpload = xhr;
	xhr.send(fileData);
}

function uploadStart(event) {
	_setUploadProgress(0);
}

function uploadComplete(event) {
	_setUploadProgress(100);
}

function uploadProgress(event) {
	if(event.lengthComputable) {
		_setUploadProgress((event.loaded / event.total) * 100.0);
	}
}

function _setUploadProgress(progress_percent) {
	$('#barUpload div.bar').css("width", progress_percent + "%");
}

function resetDropZone() {
	var dropZone = document.getElementById("uploader");
	var dropZoneSub = document.getElementById('uploader_sub');

	dropZoneSub.innerHTML = dropZoneDefaultInnerHTML;

	$(dropZone).removeClass("active");

	dropZoneTransferInProgress = false;
}

function handleDragOver(event, eventtype) {
	event.stopPropagation();
	event.preventDefault();

	if(!eventtype)
		eventtype = event.type;

	var dropZone = document.getElementById("uploader");
	var dropZoneSub = document.getElementById("uploader_sub");

	if(eventtype == "dragenter") {
		if(currFileDrag)
			return;
		dropZoneSub.innerHTML = 'Drop file now to upload';
		$(dropZone).addClass("active");
	} else if(eventtype == "dragleave") {
		if(event.originalEvent && event.originalEvent.pageX != "0" && event.originalEvent.pageX != 0)
			return;

		resetDropZone();
	}

	if(event.originalEvent)
		event.originalEvent.dataTransfer.dropEffect = (eventtype == "dragenter" ? "copy" : "");

	dropZone.className = eventtype == "dragenter" ? "hover" : "";
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

	document.getElementsByTagName("body")[0].addEventListener("mouseout", function(e) { resetDropZone(); }, false);
}

function refreshFiles() {
	$.get('/api/list?idonly', function(data) {
		var files = data.split("\n");
		var files_rev = new Array();
		for(var i = 0;i < files.length;i++) {
			var fileid = files[i];
			if(!fileid || fileid == "")
				continue;
			files_rev[fileid] = true;
			if(!document.getElementById("file_"+fileid))
				addFileLI(fileid);
		}

		$('#file_manage_div > li').each(function(i, ele) {
			var fileid = $(ele).attr('id').substr(5);
			if(!files_rev[fileid])
				removeFileLI(fileid);
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

		var newFile = document.createElement("ul");//Fake
		newFile.innerHTML = data;
		newFile = newFile.firstChild;

		$(newFile).find(".image_manage_top, .image_manage_bottom").each(function(idx, elem) {
			elem.style.cursor="move";
		});

		func(newFile);
	})
}

function addFileLI(fileid, no_refresh_if_exist) {
	if(document.getElementById("file_"+fileid)) {
		if(!no_refresh_if_exist)
			refreshFileLI(fileid);
		return;
	}
	var ele = document.getElementById("file_manage_div");
	getFileLI(fileid, function(newFile) {
		if(!newFile)
			return;
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

	$("#file_"+fileid).css("border", "1px solid red");//Highlight file deletion

	$.get('/api/delete?'+fileid, function(data) {
		if(data.charAt(0) != '+') {
			refreshFileLI(fileid);
			alert("Error deleting file :(");
		}
	}).error(function() {
		refreshFileLI(fileid);
		alert("Error deleting file :(");
	});

	return false;
}

var currFileDrag;

function setupFileDragging() {
	$(".image_manage_top, .image_manage_bottom").each(function(idx, elem) {
		elem.style.cursor="move";
	});

	var trashBin = document.getElementById("recycle_bin");

	function startFileDrag(ev) {
		currFileDrag = ev.target;
		window.setTimeout("currFileDrag.style.opacity = '0.2';", 1);
		trashBin.style.opacity = "0.7";
	}

	function endFileDrag(ev) {
		currFileDrag.style.opacity = "1";
		currFileDrag = false;
		trashBin.style.opacity = "0.5";
	}

	$(".image_manage_ul li").each(function(idx, elem) {
		elem.addEventListener("dragstart", startFileDrag, false);
		elem.addEventListener("dragend", endFileDrag, false);
	});

	trashBin.style.display = "";

	trashBin.addEventListener("dragover", preventDefault);

	trashBin.addEventListener("dragenter", function(ev) {
		ev.stopPropagation();
		ev.preventDefault();

		handleDragOver(ev, "dragleave");

		if(!currFileDrag)
			return;

		ev.dataTransfer.dropEffect = "move";
		ev.target.style.opacity = "1";
	}, false);

	trashBin.addEventListener("dragleave", function(ev) {
		ev.stopPropagation();
		ev.preventDefault();

		ev.dataTransfer.dropEffect = "";
		trashBin.style.opacity = "0.7";
	}, false);

	trashBin.addEventListener("drop", function(ev) {
		ev.stopPropagation();
		ev.preventDefault();

		if(!currFileDrag)
			return;

		deleteFile(currFileDrag.id.substr(5));
		trashBin.style.opacity = "";
	}, false);
}


function setupOptionMenu() {
	function getFileLIFromevent(ev) {
		return ev.target.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode;
	}

	var handleBase64Request = function(event) {
		var fileName = getFileLIFromevent(event).getAttribute("data-file-id");
		$.get("/api/base64?" + fileName, function(data) {
			var text = document.createElement("textarea");
			text.rows = "20";
			text.cols = "100";
			text.value = data;

			text.style.width = "60%";
		});
	}
}

function hasValidType(types) {
	for(var i = 0;types.length > i;++i)
		if(types[i] == "text/plain")
			return true;
	return false;
}

function setupPasting() {
	document.getElementsByTagName("body")[0].addEventListener("paste", function(event) {
		if(event.clipboardData.items.length >= 1) {
			if(!hasValidType(event.clipboardData.types))
				return;
			dropZoneUploads.push(event.clipboardData.getData("text/plain"));//Upload clipboard contents
			dropZoneFileCount++;
			processNextFile();
		}
	}, false);
}

function setupSearch() {
	document.getElementById("filter-form").style.display = "inline";
	var previewWrapper = document.getElementById("file_manage_div");
	document.getElementById("name-filter").addEventListener("keyup", function(){
		var nodes = previewWrapper.childNodes;
		var val = this.value.toLowerCase();
		for(i = 0;i < nodes.length;++i)
			if(nodes[i].nodeType == 1)
				if(nodes[i].firstChild.nextSibling.title.toLowerCase().indexOf(val) == -1)
					nodes[i].style.display = "none";
				else if(nodes[i].style.display == "none")
					nodes[i].style.display = "inline-block";
	});
}

function setupMassOperations() {
	var form = document.getElementById("file-mass-action-form");
	form.addEventListener("submit", function(event) {
		event.preventDefault();

		var operation = this.action.value;

		var count = 0;

		var str = "";

		var elems = $(".image_manage_ul > li[id^=file_]").each(function(k, v) {
			if(v.style.display == "none")
				return true;
			str += ("|" + v.getAttribute("data-file-id"));
			count++;
		});

		if(!confirm("Are you sure you want to " + operation + " all selected(" + count + ") files?"))
			return

		$.ajax({
			method: "POST",
			url: "/api/deletemulti",
			data: str,
			success: function(data) {
				if(data == "+")
					alert("Done.");
			}
		});
	});
}

$(document).ready(function() {
	//setupOptionMenu();

	setupDropZone();
	setupFileDragging();

	setupPasting();

	setupSearch();

	setupMassOperations();

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