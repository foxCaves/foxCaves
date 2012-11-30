<%+ head %>
<% local RAWNAME = FILEID .. FILE.extension %>
	<h3>Live drawing file: <%= FILE.name %></h3>
	<div class="well well-small" style="text-align: left;">
		<form class="form-horizontal">
			<div class="control-group">
				<label class="control-label">
					Invite others to this livedraw:
				</label>
				<div class="controls">
					<input readonly="readonly" type="text" value="http://fox.gy/l<%= FILEID %>?<%= LDSID %>" />
				</div>
			</div>
		</form>
	</div>
	<a href="/d/<%= RAWNAME %>" class="btn btn-large btn-block btn-primary">Download original file</a>
	<br />
	<div id="livedraw-wrapper">
		<canvas id="livedraw" data-file-url="https://d16l38yicn0lym.cloudfront.net/f<%= RAWNAME %>"></canvas>
	</div>
	<script type="text/javascript">var SESSIONID = "<% if G.ngx.ctx.user then %><%= G.ngx.ctx.user.sessionid %><% else %>GUEST<% end %>"; var LIVEDRAW_FILEID = "<%= FILEID %>"; var LIVEDRAW_SID = "<%= LDSID %>";</script>
	<script type="text/javascript" src="<%= STATIC_URL_PREFIX %>/js/live.js"></script>
<%+ foot %>
