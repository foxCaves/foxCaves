<%+ head %>
<%+ account_type %>
<div id="uploader"></div>
<h2>Manage files (<a href="" onclick="return refreshFiles();">Refresh</a>)</h2>
<table><tr><td><ul class="image_manage_ul" id="file_manage_div">
	<% for _,file in pairs(FILES) do %>
		<%+ filehtml %>
	<% end %>
</ul></td></tr></table>
<!--<div id="recycle_bin"></div>-->
<script type="text/javascript" src="/static/js/uploader.min.js?v=13"></script>
<%+ foot %>
