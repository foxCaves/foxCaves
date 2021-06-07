var pushHandlers = new Array();

function preventDefault(evt) {
	evt.stopPropagation();
	evt.preventDefault();
}

window.addEventListener("popstate", function(ev) {
	if(!ev.state)
		return;
	preventDefault(ev);
	loadPage(ev.state.url, true);
});

function loadPage(href, fromHistory) {
	var container = $('#main-container');

	$.ajax({
		url: href,
		beforeSend: function(xhr) {
			xhr.setRequestHeader("X-Is-Js-Request", "1");
		},
		success: function(data, status, xhr) {
			var xSplit = data.lastIndexOf("|");

			var json = $.parseJSON(data.substring(xSplit + 1));

			for(var idx in json) {
				if(!json.hasOwnProperty(idx))
					continue;
				var val = json[idx];
				switch(idx) {
					case "pushchan":
						if(val != PUSH_CHANNEL) {
							document.location.reload();
							return;
						}
						break;
					case "active_nav":
						$('#nav-main > li').removeClass("active");
						$('#nav-main > li[data-menu-id="'+val+'"]').addClass("active");
						break;
					case "title":
						document.title = val;
						break;
					default:
						$('#'+idx).html(val);
						break;
				}
			}

			$('[data-toggle="dropdown"]').parent().removeClass('open');

			data = data.substring(0, xSplit - 1);

			container.html(data);
			container.css("opacity", "1");

			if(!fromHistory)
				history.pushState({url: href}, document.title, href);
			else
				history.replaceState({url: href}, document.title, href);

			docReady();
		},
		error: function() {
			container.css("opacity", "1");
			document.location.href = href;
		},
		timeout: 10000,
		dataType: "text"
	});
}

//history.replaceState({url: document.location.href}, document.title, document.location.href);
