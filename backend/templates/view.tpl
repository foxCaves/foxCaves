<%+ head %>
	<h3>Viewing file: <%= file.name %></h3>
	<div class="well well-small" style="text-align: left;">
		<form class="form-horizontal">
			<div class="control-group">
				<label class="control-label">Uploaded by</label>
				<div class="controls" style="padding-top: 5px;"><%= owner %></div>
			</div>
			<div class="control-group">
				<label class="control-label">Uploaded on</label>
				<div class="controls" style="padding-top: 5px;"><%= G.os.date("%d.%m.%Y %H:%M", file.time) %></div>
			</div>
			<div class="control-group">
				<label class="control-label">Size</label>
				<div class="controls" style="padding-top: 5px;"><%= G.ngx.ctx.format_size(file.size) %></div>
			</div>
			<div class="control-group">
				<label class="control-label" for="view-link">View link</label>
				<div class="controls">
					<input readonly="readonly" id="view-link" type="text" value="<%= file.view_url %>" />
				</div>
			</div>
			<div class="control-group">
				<label class="control-label" for="direct-link">Direct link</label>
				<div class="controls">
					<input readonly="readonly" id="direct-link" type="text" value="<%= file.direct_url %>" />
				</div>
			</div>
			<div class="control-group">
				<label class="control-label" for="download-link">Download link</label>
				<div class="controls">
					<input readonly="readonly" id="download-link" type="text" value="<%= file.download_url %>" />
				</div>
			</div>
		</form>
	</div>
	<a href="<%= file.download_url %>" class="btn btn-large btn-block btn-primary">Download file</a>
	<div id="preview-wrapper">
	<% if file.type == FILE_TYPE_IMAGE then %>
		<a href="<%= file.direct_url %>"><img src="<%= file.direct_url %>"></a>
	<% elseif file.type == FILE_TYPE_TEXT then %>
		<noscript>JavaScript required to preview code/text</noscript>
		<pre class="prettyprint linenums" style="display: none;" data-thumbnail-source="<%= file.thumbnail_url %>"></pre>
	<% elseif file.type == FILE_TYPE_VIDEO then %>
		<video controls="controls" crossOrigin="anonymous">
			<source src="<%= file.direct_url %>" type="<%= MIMETYPES[file.extension] %>" />
			Your browser is too old.
		</video>
	<% elseif file.type == FILE_TYPE_AUDIO then %>
		<audio id="audioplayer" crossOrigin="anonymous">
			<source src="<%= file.direct_url %>" type="<%= MIMETYPES[file.extension] %>" />
			Your browser is too old.
		</audio>
		<p>
			<button class="btn btn-large btn-success" onclick="return dancerPlay();" type="button"><i class="icon-play"></i></button>
			<button class="btn btn-large btn-warning" onclick="return dancerPause();" type="button"><i class="icon-pause"></i></button>
		</p>
		<canvas style="position: fixed; z-index: 20000; top: 0; left: 0; pointer-events: none;" id="audiovis"></canvas>
		<script type="text/javascript" src="/static/js/dancer.js"></script>
		<script type="text/javascript" src="/static/js/audiovis.js"></script>
	<% elseif file.type == FILE_TYPE_IFRAME then %>
		<iframe id="pdf-view" src="<%= file.direct_url %>" type="<%= MIMETYPES[file.extension] %>"></iframe>
	<% else %>
		<h5>File cannot be viewed. Download it.</h5>
	<% end %>
	</div>
	<script type="text/javascript" src="/static/js/view.js"></script>
<%+ foot %>
