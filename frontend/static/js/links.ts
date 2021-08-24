REQUIRE_LOGGED_IN = true;

interface LinkInfo extends TimedElement {
	short_url: string;
	user: number;
	url: string;
	id: string;
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
	fetch("/api/v1/links?url="+encodeURIComponent(linkurl), { method: 'POST' })
	.then(res => res.json())
	.then(data => {
		LINKS[data.id] = convertToDates(data);
		addLinkRow(data.id);
		prompt("Here is your shortened link", data.short_url);
	});
}

function deleteLink(id: string, doConfirm?: boolean) {
	if(doConfirm && !confirm("Are you sure you want to delete this link")) {
		return;
	}

	$("#link_"+id).css("border", "1px solid red"); //Highlight deletion

	fetch(`/api/v1/links/${id}`, { method: 'DELETE' })
	.then(response => {
		if(response.status < 200 || response.status > 299) {
			alert("Error deleting link :(");
			refreshLinks();
			return;
		}
		removeLinkRow(id);
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
		<td><a title="Delete" class="pointer">Delete</a></td>
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
	fetch(`/api/v1/links?t=${Date.now()}`)
	.then(response => response.json())
	.then(data => data.map(convertToDates))
	.then(data => {
		const links = sortByTime(data as LinkInfo[]);
		const links_rev: { [key: string]: boolean } = {};
		for (const link of links) {
			LINKS[link.id] = link;
			links_rev[link.id] = true;
			if(!document.getElementById("link_"+link.id)) {
				addLinkRow(link.id);
			}
		}

		$('#links_table > tr').each(function(_, ele) {
			const id = getLinkIDFromID($(ele).attr('id')!);
			if (!links_rev[id]) {
				delete LINKS[id];
				removeLinkRow(id);
			}
		});
	});

	return false;
}

$(() => {
	setupLinkJS($('#links_table'));

	pushHandlers.link = {
		create(data: LinkInfo) {
			LINKS[data.id] = convertToDates(data);
			addLinkRow(data.id);
		},
		delete(data: LinkInfo) {
			delete LINKS[data.id];
			removeLinkRow(data.id);
		},
		update(data: LinkInfo) {
			for (const key of Object.keys(data)) {
				(LINKS[data.id] as any)[key] = (data as any)[key];
			}
			LINKS[data.id] = convertToDates(LINKS[data.id]!);
			refreshLinkRow(data.id);
		},
	};

	refreshLinks();
});
