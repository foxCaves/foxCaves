<% MAINTITLE = "My files" %>
<%+ _includes/head %>
<div id="uploader"></div>
<br />
<h2 id="file-refresh"><%= MAINTITLE %> (<a class="pointer" onclick="return refreshFiles();">Refresh</a>)</h2>
<form id="filter-form" style="display:none;margin-top:10px;" class="form-search">
	<input id="name-filter" type="text" placeholder="filter" class="input-medium search-query">
</form>
<br />
<ul id="file_manager"></ul>
<div style="display: none;" id="recycle_bin"></div>
<script type="text/javascript" src="/static/js/myfiles.js"></script>
<%+ _includes/foot %>
