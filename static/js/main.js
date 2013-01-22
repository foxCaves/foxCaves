var loadingEles = 0;

function loadDone() {
	loadingEles--;
	if(loadingEles == 0) {
		window.prettyPrint && prettyPrint();
	}
}

function formatSize(size) {
	var sinc = 0;
	
	while(size > 1024) {
		sinc = sinc + 1;
		size = size / 1024;
		if(sinc == 8) {
			break;
		}
	}
	
	size = Math.ceil(size * 100.0) / 100.0;
	
	switch(sinc) {
		case 0:
			return size+" B";
		case 1:
			return size+" kB";
		case 2:
			return size+" MB";
		case 3:
			return size+" GB";
		case 4:
			return size+" TB";
		case 5:
			return size+" PB";
		case 6:
			return size+" EB";
		case 7:
			return size+" ZB";
		case 8:
			return size+" YB";
	}
	return "WTF?!";
}

function docReady() {
	var eles = document.getElementsByTagName("pre");
	for(i=0; i < eles.length; i++) {
		var ele = eles[i];
		var src = ele.getAttribute('data-thumbnail-source');
		if(!src) continue;
		ele.style.display = "";
		ele.innerHTML = "[Loading preview...]";
		loadingEles++;
		$.get('https://d16l38yicn0lym.cloudfront.net/thumbs/'+src, function(data) {
			ele.innerHTML = data;
			loadDone();
		});
	}
	
	if(loadingEles <= 0) {
		loadingEles = 1;
		loadDone();
	}
}

$(document).ready(function(){
	docReady();

	if(PUSH_CHANNEL == "")
		return;
	
	pushHandlers.push(function(action, usedbytes) {
		if(action != "U")
			return false;
		$('#used_bytes_text').text(formatSize(usedbytes));
		$('#used_bytes_bar').css('width', Math.ceil((usedbytes / TOTALBYTES) * 100.0) + '%');
		return true;
	});
	
	/*TODO: Fix history API with this
	$("a:not([href=#])").click(function(ev) {
		preventDefault(ev);
		loadPage(ev.currentTarget.href);
	});*/
	
	function messageReceived(text, id, channel) {
		var cmds = text.split("|");

		for(var i=0;i<cmds.length;i++) {
			var action = cmds[i].trim();

			if(action == "") {
				continue;
			}

			var param = action.substr(1);
			action = action.charAt(0);

			for(var j=0;j<pushHandlers.length;j++) {
				if(pushHandlers[j](action, param)) {
					break;
				}
			}
		}
    };

    var pushstream = new PushStream({
      host: window.location.hostname,
      port: window.location.port,
	  useSSL: (window.location.port == 443),
	  urlPrefixStream: "/push/stream",
	  urlPrefixEventsource: "/push/eventsource",
	  urlPrefixLongpolling: "/push/longpolling",
	  urlPrefixWebsocket: "/push/websocket"
    });
    pushstream.onmessage = messageReceived;
    pushstream.addChannel(PUSH_CHANNEL);
    pushstream.connect();
});
