<%+ head %>
<% local RAWNAME = FILEID .. FILE.extension %>
	<h3>Live drawing file: <%= FILE.name %></h3>
	<div class="well well-small" style="text-align: left;">
		<form class="form-horizontal">
			<div class="control-group" for="inviteid">
				<label class="control-label">
					Invite others to this livedraw:
				</label>
				<div class="controls">
					<input type="text" readonly="readonly" id="inviteid" value="http://fox.gy/l<%= FILEID %>?<%= LDSID %>" />
				</div>
			</div>
		</form>
	</div>
	<div style="text-align:center;" id="livedraw-wrapper">
		<canvas id="livedraw" style="margin:auto" data-file-url="https://d16l38yicn0lym.cloudfront.net/f<%= RAWNAME %>"></canvas>
	</div>
	<div id="live-draw-options">
		<fieldset>
			<legend>Brush Settings</legend>
			<select onchange="setBrush(this.options[this.selectedIndex].value);">
				<option>rectangle</option>
				<option>circle</option>
				<option selected="selected">brush</option>
				<option>erase</option>
				<option>line</option>
			</select>
			<br />
			<span style="color:white;">0</span>
			<input type="range" value="10" min="1" max="100" step="0.1" onchange="setBrushWidth(this.value);" />
			<span style="color:white;">100</span>
			<div class="color-selector"</div>
		</fieldset>
		<fieldset>
			<legend>Utils</legend>
			<input type="button" value="Save Image" class="btn" onclick="liveDrawInterface.save();" />
			<a href="/d/<%= RAWNAME %>" class="btn">Download original file</a>
			<a class="btn" download="<%= LDSID %>-edited.png" onclick="this.href=canvasEle.toDataURL('image/png')">Download</a>
		</fieldset>
	</div>
	<script type="text/javascript">var SESSIONID = "<% if G.ngx.ctx.user then %><%= G.ngx.ctx.user.sessionid %><% else %>GUEST<% end %>"; var LIVEDRAW_FILEID = "<%= FILEID %>"; var LIVEDRAW_SID = "<%= LDSID %>";</script>
	<script type="text/javascript" src="<%= STATIC_URL_PREFIX %>/js/live.js"></script>
<%+ foot %>
