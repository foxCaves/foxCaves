<%+ head %>
<%+ account_type %>
<h2>Manage links (<a href="#" onclick="newLink();">Create</a>)</h2>
<table border="1" width="100%">
	<% for _, linkid in next, LINKS do
		local link = link_get(linkid) %>
		<tr>
			<td>http://fox.gy/g<%= linkid %></td><td><%= G.escape_html(link) %></td>
			<td><a href="?delete=<%= linkid %>">Delete</a></td>
		</tr>
	<% end %>
</table>
<script type="text/javascript" src="<%= STATIC_URL_PREFIX %>/js/mylinks.min.js"></script>
<%+ foot %>
