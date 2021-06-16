function newLink() {
	const res = prompt("Please enter the link to shorten:", "https://");
	if(!res) {
		return;
	}
	createLink(res);
}

function createLink(linkurl: string) {
	$.post("/api/v1/links?url="+encodeURIComponent(linkurl), '', (data) => {
		prompt("Here is your shortened link", data.short_url);
	});
}

function deleteLink(id: string, doConfirm?: boolean) {
	if(doConfirm && !confirm("Are you sure you want to delete this link")) {
		return;
	}

	$("#link_"+id).css("border", "1px solid red");//Highlight deletion

	$.ajax({url: `/api/v1/links/${id}`, method: 'DELETE' })
	.done(function() { })
	.fail(function() {
		refreshLinkRow(id);
		alert("Error deleting link :(");
	});

	return false;
}

function getLinkIDFromID(id: string) {
	return id.substr(5);
}

function refreshLinkRow(id: string) {
	getLinkRow(id, function(newLink) {
		if(!newLink) {
			removeLinkRow(id);
			return;
		}
		$('#link_'+id).replaceWith(newLink);
		setupLinkJS(newLink);
	});
}

function setupLinkJS(parent: JQuery | HTMLElement) {
	if (!('find' in parent)) {
		parent = $(parent);
	}

	parent.find("a[title=Delete]").click(function(e) {
		preventDefault(e);
		deleteLink(getLinkIDFromID((this.parentNode!.parentNode! as HTMLElement).id), true);
	});
}

function getLinkRow(id: string, func: (newLink: HTMLElement | null) => void) {
	$.get(`/api/v1/links/${id}/html`, function(data) {
		data = data.trim();

		const newFileTmp = document.createElement("tbody");//Fake
		newFileTmp.innerHTML = data;
		const newFile = newFileTmp.firstChild!;

		func(newFile as HTMLElement);
	});
}

function addLinkRow(id: string, no_refresh_if_exist?: boolean) {
	if(document.getElementById("link_"+id)) {
		if(!no_refresh_if_exist) {
			refreshLinkRow(id);
		}
		return;
	}
	const ele = document.getElementById("links_table")!;
	getLinkRow(id, function(newLink) {
		if(!newLink) {
			return;
		}
		ele.insertBefore(newLink, ele.firstChild);
		setupLinkJS(newLink);
	});
}

function removeLinkRow(id: string) {
	$('#link_'+id).remove();
}

function refreshLinks() {
	$.get(`/api/v1/links?type=idonly&t=${Date.now()}`, function(data) {
		const links = data as string[];
		const links_rev: { [key: string]: boolean } = {};
		for(let i = 0;i < links.length;i++) {
			const linkid = links[i];
			if(!linkid) {
				continue;
			}
			links_rev[linkid] = true;
			if(!document.getElementById("link_"+linkid)) {
				addLinkRow(linkid);
			}
		}

		$('#links_table > tr').each(function(_, ele) {
			const linkid = getLinkIDFromID($(ele).attr('id')!);
			if(!links_rev[linkid]) {
				removeLinkRow(linkid);
			}
		});
	});

	return false;
}

interface LinkInfo {
	short_url: string;
	user: number;
	url: string;
	time: number;
	id: string;
}

interface LinkPush {
	link: LinkInfo;
}

$(() => {
	setupLinkJS($('#links_table'));

	pushHandlers['link:create'] = function (data: LinkPush) {
		addLinkRow(data.link.id);
	};
	pushHandlers['link:delete'] = function (data: LinkPush) {
		removeLinkRow(data.link.id);
	};
	pushHandlers['link:refresh'] = function (data: LinkPush) {
		refreshLinkRow(data.link.id);
	};

	refreshLinks();
});
