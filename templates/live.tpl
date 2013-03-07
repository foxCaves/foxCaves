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
			<select onchange="localUser.brushData.setBrush(this.options[this.selectedIndex].value);">
				<option>rectangle</option>
				<option>circle</option>
				<option selected="selected">brush</option>
				<option>erase</option>
				<option>line</option>
				<option>text</option>
				<option>restore</option>
			</select>
			<input id="live-draw-text-input" type="text" style="display:none" placeholder="drawtext" />
			<input id="live-draw-font-input" type="text" style="display:none" placeholder="font" />
			<br />
			<span style="color:white;">0</span>
			<input type="range" value="10" min="1" max="100" step="0.1" style="display: block;" onchange="localUser.brushData.setWidth(this.value);" />
			<span style="color:white;">100</span>
			<br />
			<div id="color-selector">
				<svg id="color-selector-inner" xmlns="http://www.w3.org/2000/svg" version="1.1" >
				  <line x1="0" y1="5" x2="10" y2="5" style="stroke:black;stroke-width:1px" />
				  <line x1="5" y1="0" x2="5" y2="10" style="stroke:black;stroke-width:1px" />
				</svg>
			</div>
			<div id="lightness-selector"><div id="lightness-selector-inner"></div></div>
		</fieldset>
		<fieldset>
			<legend>Utils</legend>
			<% if G.ngx.ctx.user then %><input type="button" value="Save Image" class="btn" onclick="liveDrawInterface.save();" /><% end %>
			<a href="/d/<%= RAWNAME %>" class="btn">Download original file</a>
			<a class="btn" download="<%= LDSID %>-edited.png" onclick="this.href=finalCanvas.toDataURL('image/png')">Download</a>
		</fieldset>
	</div>
	<script type="text/javascript">var SESSIONID = "<% if G.ngx.ctx.user then %><%= G.ngx.ctx.user.sessionid %><% else %>GUEST<% end %>"; var LIVEDRAW_FILEID = "<%= FILEID %>"; var LIVEDRAW_SID = "<%= LDSID %>";</script>
	<script type="text/javascript" src="<%= STATIC_URL_PREFIX %>/js/live.js"></script>
<%+ foot %>
