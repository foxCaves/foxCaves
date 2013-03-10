<%
	local escaped_name = file.name
	local escaped_name_js = escaped_name:gsub("'", "\\'")
%>
<li draggable="true" id="file_<%= fileid %>" data-file-id="<%= fileid %>" data-file-extension="<%= file.extension %>" class="image_manage_main" style="background-image: url('<% if file.type == 1 and file.thumbnail and file.thumbnail ~= "" then %>https://d16l38yicn0lym.cloudfront.net/thumbs/<%= fileid %><%= file.thumbnail %><% elseif G.lfs.attributes("static/img/thumbs/ext_" .. file.extension .. ".png", "size") then %><%= STATIC_URL_PREFIX %>/img/thumbs/ext_<%= file.extension %>.png<% else %><%= STATIC_URL_PREFIX %>/img/thumbs/nothumb.png<% end %>')">
	<div class="image_manage_top" title="<%= G.os.date("%d.%m.%Y %H:%M", file.time) %> [<%= escaped_name %>]"><span><%= escaped_name %></span></div>
	<a href="/view/<%= fileid %>"></a>
	<div class="image_manage_bottom">
		<span style="position: relative; float: right;">
			<a title="View" href="/view/<%= fileid %>"><i class="icon-picture icon-white"></i> </a>
			<a title="Download" href="https://d16l38yicn0lym.cloudfront.net/d<%= fileid %><%= file.extension %>"><i class="icon-download icon-white"></i> </a>
			<div class="dropdown">
				<a title="Options" class="dropdown-toggle" data-toggle="dropdown" href=""><i class="icon-wrench icon-white"></i> </a>
				<ul class="dropdown-menu">
					<li><a class="rename" href="#">Rename</a></li>
					<li><a href="/live/<%= fileid %>">Edit</a></li>
<% if file.type == 1 and G.ngx.ctx.user.is_pro then %>
					<li class="dropdown-submenu">
						<a href="#">Convert to</a>
						<ul class="dropdown-menu">
							<li><a href="#">jpeg</a></li>
							<li><a href="#">png</a></li>
							<li><a href="#">gif</a></li>
							<li><a href="#">bmp</a></li>
						</ul>
					</li>
					<% end %>
				</ul>
			</div>

			<a href="#" title="Delete" onclick="return deleteFile('<%= fileid %>','<%= escaped_name_js %>');" href="/myfiles?delete=<%= fileid %>"><i class="icon-remove icon-white"></i> </a>
		</span>
<%= G.ngx.ctx.format_size(file.size) %>
	</div>
</li>	