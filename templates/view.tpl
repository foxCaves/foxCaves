<%+ head %>
<% local RAWNAME = FILE.fileid .. FILE.extension %>
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
					<input readonly="readonly" type="text" value="https://fox.gy/v<%= FILE.fileid %>" />
				</div>
			</div>
			<div class="control-group">
				<label class="control-label">
					Direct link
				</label>
				<div class="controls">
					<input readonly="readonly" type="text" value="https://fox.gy/f<%= FILE.fileid %><%= FILE.extension %>" />
				</div>
			</div>
			<div class="control-group">
				<label class="control-label">
					Download link
				</label>
				<div class="controls">
					<input readonly="readonly" type="text" value="https://fox.gy/d<%= FILE.fileid %><%= FILE.extension %>" />
				</div>
			</div>
		</form>
	</div>
	<a href="/d/<%= RAWNAME %>" class="btn btn-large btn-block btn-primary">Download file</a>
	<div id="preview-wrapper">
	<% if FILE.type == FILE_TYPE_IMAGE then %>
		<img src="/f/<%= RAWNAME %>">
	<% elseif FILE.type == FILE_TYPE_TEXT then %>
		<noscript>JavaScript required to preview code/text</noscript>
		<pre class="prettyprint linenums" style="display: none;" data-thumbnail-source="<%= FILE.thumbnail %>"></pre>
	<% elseif FILE.type == FILE_TYPE_VIDEO then %>
		<video width="320" height="240" controls="controls">
			<source src="/f/<%= RAWNAME %>" type="<%= MIMETYPES[FILE.extension] %>" />
			Your browser is too old.
		</video>
	<% elseif FILE.type == FILE_TYPE_AUDIO then %>
		<audio controls="controls">
			<source src="/f/<%= RAWNAME %>" type="<%= MIMETYPES[FILE.extension] %>" />
			Your browser is too old.
		</audio>
	<% elseif FILE.type == FILE_TYPE_IFRAME then %>
		<iframe src="/f/<%= RAWNAME %>" style="min-width:400px;width:100%;min-height:600px;height:100%;border:3px solid #B333E5;box-sizing:border-box;" type="<%= MIMETYPES[FILE.extension] %>"> 
		</iframe>
	<% else %>
		<h5>File cannot be viewed. Download it.</h5>
	<% end %>
	</div>
	<%+ advert %>
<%+ foot %>
