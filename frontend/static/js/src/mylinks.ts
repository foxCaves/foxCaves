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

const LINKS: { [key: string]: LinkInfo } = {};

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
	const newLink = getLinkRow(id);
	if (!newLink) {
		removeLinkRow(id);
		return;
	}
	$('#link_'+id).replaceWith(newLink);
	setupLinkJS(newLink);
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

function getLinkRow(id: string) {
	const link = LINKS[id]!;
	if (!link) {
		return;
	}
	const escpaedURL = htmlEscape(link.url);
	const row = `<tr id="link_${link.id}">
		<td><a target="_blank" href="${link.short_url}">${link.short_url}</a></td>
		<td><a target="_blank" href="${escpaedURL}">${escpaedURL}</a></td>
		<td><a title="Delete" href="/api/v1/links/${link.id}/delete?redirect=1">Delete</a></td>
	</tr>`;
	const rowTmp = document.createElement("tbody");//Fake
	rowTmp.innerHTML = row;
	return rowTmp.firstChild! as HTMLElement;
}

function addLinkRow(id: string, no_refresh_if_exist?: boolean) {
	if(document.getElementById("link_"+id)) {
		if(!no_refresh_if_exist) {
			refreshLinkRow(id);
		}
		return;
	}
	const ele = document.getElementById("links_table")!;
	const newLink = getLinkRow(id);
	if (!newLink) {
		removeLinkRow(id);
		return;
	}
	ele.insertBefore(newLink, ele.firstChild);
	setupLinkJS(newLink);
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

$(() => {
	setupLinkJS($('#links_table'));

	pushHandlers['link:create'] = function (data: LinkPush) {
		LINKS[data.link.id] = data.link;
		addLinkRow(data.link.id);
	};
	pushHandlers['link:delete'] = function (data: LinkPush) {
		delete LINKS[data.link.id];
		removeLinkRow(data.link.id);
	};
	pushHandlers['link:refresh'] = function (data: LinkPush) {
		for (const key of Object.keys(data.link)) {
			(LINKS[data.link.id] as any)[key] = (data.link as any)[key];
		}
		refreshLinkRow(data.link.id);
	};

	refreshLinks();
});
