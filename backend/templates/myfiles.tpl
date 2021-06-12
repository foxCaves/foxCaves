<%+ head %>
<%+ account_type %>
<div id="uploader"></div>
<h2 id="file-refresh">Manage files (<a onclick="return refreshFiles();">Refresh</a>)</h2>
<form id="filter-form" style="display:none;margin-top:10px;" class="form-search">
	<input id="name-filter" type="text" placeholder="filter" class="input-medium search-query">
</form>
<ul id="file_manager">
<% for _, fileid in next, FILES do
		local file = file_get(fileid) %>
<%+ filehtml %>
<% end %>
</ul>
<form id="file-mass-action-form">
	<fieldset>
		<legend>Mass operation</legend>
		<select name="todo">
			<option>delete</option>
		</select>
		<input type="submit" value="Execute" class="btn">
	</fieldset>
</form>
<div style="display: none;" id="recycle_bin"></div>
<script type="text/javascript" src="/static/js/myfiles.js"></script>
<%+ foot %>
