<%+ head %>
<% local RAWNAME = FILE.fileid .. FILE.extension %>
<center>
	<h3>Viewing file: <%= FILE.name %></h3>
	<div class="well well-small" style="text-align: left;">
		<form class="form-horizontal">
			<div class="control-group">
				<label class="control-label">
					Uploaded by
				</label>
				<div class="controls" style="padding-top: 5px;">
					<%= FILE.username %>
				</div>
			</div>
			<div class="control-group">
				<label class="control-label">
					Uploaded on
				</label>
				<div class="controls" style="padding-top: 5px;">
					<%= G.os.date("%d.%m.%Y %H:%M", FILE.time) %>
				</div>
			</div>
			<div class="control-group">
				<label class="control-label">
					Size
				</label>
				<div class="controls" style="padding-top: 5px;">
					<%= G.ngx.ctx.format_size(FILE.size) %>
				</div>
			</div>
			<div class="control-group">
				<label class="control-label">
					View link
				</label>
				<div class="controls">
					<input type="text" value="https://foxcav.es/view/<%= FILE.fileid %>" />
				</div>
			</div>
			<div class="control-group">
				<label class="control-label">
					Download link
				</label>
				<div class="controls">
					<input type="text" value="https://foxcav.es/f/<%= FILE.fileid %><%= FILE.extension %>" />
				</div>
			</div>
		</form>
	</div>
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
