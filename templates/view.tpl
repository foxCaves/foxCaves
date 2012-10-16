<%+ head %>
<% local RAWNAME = FILE.fileid .. FILE.extension %>
<center>
	<h3>Viewing file: <%= FILE.name %></h3>
	<h4>Uploaded by: <%= FILE.username %><br />Uploaded on: <%= G.os.date("%d.%m.%Y %H:%M", FILE.time) %><br />Size: <%= G.ngx.ctx.format_size(FILE.size) %><h4>
	<% if FILE.type == 1 then %>
		<img src="https://d3rith5u07eivj.cloudfront.net/<%= RAWNAME %>">
	<% elseif FILE.type == 2 then %>
		<noscript>JavaScript required to preview code/text</noscript>
		<pre class="prettyprint linenums" style="display: none;" data-thumbnail-source="<%= FILE.thumbnail %>"></pre>
	<% else %>
		<h5>File cannot be viewed. Download it.</h5>
	<% end %>
	<h2><a href="https://foxcav.es/f/<%= RAWNAME %>" target="_blank">Download file</a></h2>
	<%+ advert %>
</center>
<%+ foot %>
