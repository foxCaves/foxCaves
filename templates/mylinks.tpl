<%+ head %>
<%+ account_type %>
<h2>Manage links (<a href="#" onclick="newLink();">Create</a>)</h2>
<table border="1" width="100%">
<% for _, linkid in next, LINKS do
		local link = link_get(linkid) %>
		<tr>
			<td><%= SHORT_URL %>/g<%= linkid %></td><td><%= G.escape_html(link) %></td>
			<td><a href="?delete=<%= linkid %>">Delete</a></td>
		</tr>
<% end %>
</table>
<script type="text/javascript" src="/static/js/mylinks.js"></script>
<%+ foot %>