<%+ head %>
<%+ account_type %>
<div id="uploader"></div>
<h2 style="float:left;">Manage files (<a href="#" onclick="return refreshFiles();">Refresh</a>)</h2>
<form id="filter-form" style="display:none;float:right;margin-top:10px;" class="form-search">
	<input id="name-filter" type="text" placeholder="filter" class="input-medium search-query">
</form>
<ul class="image_manage_ul" id="file_manage_div">
	<% for _,fileid in next, FILES do
		local file = file_get(fileid) %>
		<%+ filehtml %>
	<% end %>
</ul>
<div style="display: none;" id="recycle_bin"></div>
<script type="text/javascript" src="<%= STATIC_URL_PREFIX %>/js/myfiles.min.js"></script>
<%+ foot %>
