<tr>
    <td><a target="_blank" href="<%= SHORT_URL %>/g<%= linkid %>"><%= SHORT_URL %>/g<%= linkid %></a></td>
    <td><a target="_blank" href="<%= G.escape_html(link) %>"><%= G.escape_html(link) %></a></td>
    <td><a href="/api/deletelink?id=<%= linkid %>&redirect=1">Delete</a></td>
</tr>
