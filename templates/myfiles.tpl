<%+ head %>
<%+ account_type %>
<div id="uploader"></div>
<h2>Manage files (<a href="#" onclick="return refreshFiles();">Refresh</a>)</h2>
<table><tr><td><ul class="image_manage_ul" id="file_manage_div">
	<% for _,fileid in next, FILES do
		local file = file_get(fileid) %>
		<%+ filehtml %>
	<% end %>
</ul></td></tr></table>
<div style="display: none;" id="recycle_bin"></div>
<script type="text/javascript" src="<%= STATIC_URL_PREFIX %>/js/myfiles.min.js"></script>
<%+ foot %>
