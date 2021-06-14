<%+ head %>
<%+ account_type %>
<h2>Manage links (<a onclick="newLink();">Create</a>)</h2>
<table class="table">
	<thead>
		<tr>
			<th>Short link</th>
			<th>Target</th>
			<th>Actions</th>
		</tr>
	</thread>
	<tbody>
	<% for _, linkid in next, LINKS do
			local link = link_get(linkid) %>
			<tr>
				<td><a target="_blank" href="<%= SHORT_URL %>/g<%= linkid %>"><%= SHORT_URL %>/g<%= linkid %></a></td>
				<td><a target="_blank" href="<%= G.escape_html(link) %>"><%= G.escape_html(link) %></a></td>
				<td><a href="/api/deletelink?id=<%= linkid %>&redirect=1">Delete</a></td>
			</tr>
	<% end %>
	</tbody>
</table>
<script type="text/javascript" src="/static/js/mylinks.js"></script>
<%+ foot %>
