<tr id="link_<%= link.id %>">
    <td><a target="_blank" href="<%= link.short_url %>"><%= link.short_url %></a></td>
    <td><a target="_blank" href="<%= G.escape_html(link.url) %>"><%= G.escape_html(link.url) %></a></td>
    <td><a title="Delete" href="/api/v1/links/<%= link.id %>/delete?redirect=1">Delete</a></td>
</tr>
