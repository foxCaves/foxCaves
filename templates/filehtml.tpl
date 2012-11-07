<%
	local file = file_get(fileid)
	local escaped_name = file.name
	local escaped_name_js = escaped_name:gsub("'", "\\'")
%>
<li draggable="true" id="file_<%= fileid %>" data-file-id="<%= fileid %>" data-file-extension="<%= file.extension %>">
	<div style="background-image: url('<% if file.type == 1 then %>https://fox.gy/thumbs/<%= file.thumbnail %><% elseif G.lfs.attributes("static/img/thumbs/ext_"..file.extension..".png", "size") then %><%= STATIC_URL_PREFIX %>/img/thumbs/ext_<%= file.extension %>.png<% else %><%= STATIC_URL_PREFIX %>/img/thumbs/nothumb.png<% end %>')" class="image_manage_main">
		<div class="image_manage_top" title="<%= G.os.date("%d.%m.%Y %H:%M", file.time) %> [<%= escaped_name %>]"><span><%= escaped_name %></span></div>
		<div class="image_manage_bottom">
			<span style="position: relative; float: right;">
				<a title="View" href="/view/<%= fileid %>"><i class="icon-picture icon-white"></i> </a>
				<a title="Download" href="https://fox.gy/d<%= fileid %><%= file.extension %>"><i class="icon-download icon-white"></i> </a>
				<% if file.type == 1 and G.ngx.ctx.user.is_pro then %>
				<div class="dropdown">
					<a title="Options" class="dropdown-toggle" data-toggle="dropdown" href=""><i class="icon-wrench icon-white"></i> </a>
					<ul class="dropdown-menu">
						<li><a class="rename" href="#">Rename</a></li>
						<li><a onclick="handleBase64Request(window.event);" href="#">Get Base64</a></li>
						<li><a href="/live/<%= fileid %>">Edit</a></li>
						<li class="dropdown-submenu">
							<a href="#">Convert to</a>
							<ul class="dropdown-menu">
								<li><a href="#">jpeg</a></li>
								<li><a href="#">png</a></li>
								<li><a href="#">gif</a></li>
								<li><a href="#">bmp</a></li>
							</ul>
						</li>
					</ul>
				</div>
				<% end %>
				<a href="#" title="Delete" onclick="return deleteFile('<%= fileid %>','<%= escaped_name_js %>');" href="/myfiles?delete=<%= fileid %>"><i class="icon-remove icon-white"></i> </a>
			</span>
			<%= G.ngx.ctx.format_size(file.size) %>
		</div>
		<a href="/view/<%= fileid %>"><span class="whole_div_link"></span></a>
	</div>
</li>	