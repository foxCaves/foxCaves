<%+ head %>
<% local RAWNAME = FILE.fileid .. FILE.extension %>
<% local ESCAPED_NAME = G.ngx.ctx.escape_html(FILE.name) %>
<center>
	<h3>Viewing file: <%= ESCAPED_NAME %></h3>
	<h4>Uploaded by: <%= FILE.username %><br />Uploaded on: <%= G.os.date("%d.%m.%Y %H:%M", FILE.time) %><br />Size: <%= G.ngx.ctx.format_size(FILE.size) %><h4>
	<% if FILE.type == 1 then %>
		<a href="https://d3rith5u07eivj.cloudfront.net/<%= RAWNAME %>"><img src="https://d3rith5u07eivj.cloudfront.net/<%= RAWNAME %>"></a>
	<% elseif FILE.type == 2 then %>
		<noscript>JavaScript required to preview code/text</noscript>
		<pre class="prettyprint linenums" style="display: none;" data-thumbnail-source="<%= FILE.thumbnail %>"></pre>
	<% else %>
		<h5>File cannot be viewed. Download it.</h5>
	<% end %>
	<h2><a href="https://d3rith5u07eivj.cloudfront.net/<%= RAWNAME %>" target="_blank">Download file</a></h2>
	<%+ advert %>
</center>
<%+ foot %>
