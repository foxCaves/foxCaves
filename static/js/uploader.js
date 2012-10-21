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

function addFileLI(fileid) {
	var ele = document.getElementById("file_manage_div");
	getFileLI(function(newFile) {
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
			removeFileLI(fileid);
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

/**
*
*  Base64 encode / decode
*  http://www.webtoolkit.info/
*
**/
 
var Base64 = {
 
	// private property
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
 
	// public method for encoding
	encode : function (input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;
 
		input = Base64._utf8_encode(input);
 
		while (i < input.length) {
 
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);
 
			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;
 
			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}
 
			output = output +
			this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
			this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
 
		}
 
		return output;
	},
 
	// public method for decoding
	decode : function (input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
 
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 
		while (i < input.length) {
 
			enc1 = this._keyStr.indexOf(input.charAt(i++));
			enc2 = this._keyStr.indexOf(input.charAt(i++));
			enc3 = this._keyStr.indexOf(input.charAt(i++));
			enc4 = this._keyStr.indexOf(input.charAt(i++));
 
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
 
			output = output + String.fromCharCode(chr1);
 
			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}
 
		}
 
		output = Base64._utf8_decode(output);
 
		return output;
 
	},
 
	// private method for UTF-8 encoding
	_utf8_encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";
 
		for (var n = 0; n < string.length; n++) {
 
			var c = string.charCodeAt(n);
 
			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
 
		}
 
		return utftext;
	},
 
	// private method for UTF-8 decoding
	_utf8_decode : function (utftext) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;
 
		while ( i < utftext.length ) {
 
			c = utftext.charCodeAt(i);
 
			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}
 
		}
 
		return string;
	}
 
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

}
setupOptionMenu();

setupDropZone();
setupFileDragging();