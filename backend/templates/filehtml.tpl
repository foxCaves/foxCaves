<%
	local escaped_name = file.name
	local escaped_name_js = escaped_name:gsub("'", "\\'")
%>
<li draggable="true" id="file_<%= file.id %>" class="image_manage_main" style="background-image:url('<%= file.thumbnail_image %>')">
	<div class="image_manage_top" title="<%= G.os.date("%d.%m.%Y %H:%M", file.time) %> [<%= escaped_name %>]"><%= escaped_name %></div>
	<a href="/view/<%= file.id %>"></a>
	<div class="image_manage_bottom">
		<span>
			<a title="View" href="<%= file.view_url %>""><i class="icon-picture icon-white"></i> </a>
			<a title="Download" href="<%= file.download_url %>"><i class="icon-download icon-white"></i> </a>
			<div class="dropdown">
				<a title="Options" class="dropdown-toggle" data-toggle="dropdown" href=""><i class="icon-wrench icon-white"></i> </a>
				<ul class="dropdown-menu">
					<li><a class="rename">Rename</a></li>
					<li><a href="/live/<%= file.id %>">Edit</a></li>
<% if file.type == 1 and G.ngx.ctx.user.is_pro then %>
					<li class="dropdown-submenu">
						<a>Convert to</a>
						<ul class="dropdown-menu">
							<li><a>jpeg</a></li>
							<li><a>png</a></li>
							<li><a>gif</a></li>
							<li><a>bmp</a></li>
						</ul>
					</li>
					<% end %>
				</ul>
			</div>
			<a title="Delete" href="/api/v1/files/<%= file.id %>/delete?redirect=1"><i class="icon-remove icon-white"></i> </a>
		</span>
<%= G.ngx.ctx.format_size(file.size) %>
	</div>
</li>
