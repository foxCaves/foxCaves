<%+ head %>
<% local RAWNAME = FILE.fileid .. FILE.extension %>
	<h3>Live drawing file: <%= FILE.name %></h3>
	<div class="well well-small" style="text-align: left;">
		<form class="form-horizontal">
			<div class="control-group">
				<label class="control-label">
					Invite others to this livedraw:
				</label>
				<div class="controls">
					<input readonly="readonly" type="text" value="https://fox.gy/l<%= FILE.fileid %>" />
				</div>
			</div>
		</form>
	</div>
	<a href="/d/<%= RAWNAME %>" class="btn btn-large btn-block btn-primary">Download original file</a>
	<br />
	<div id="livedraw-wrapper">
		<canvas id="livedraw" data-file-url="/f/<%= RAWNAME %>"></canvas>
	</div>
	<script type="text/javascript" src="/static/js/live.js"></script>
	<%+ advert %>
<%+ foot %>
