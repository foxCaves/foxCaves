<br /><br />
<%
local fcshared = G.ngx.shared.foxcaves
local filecount = 0 or fcshared:get("filecount")
local usercount = 0 or fcshared:get("usercount")
if (not filecount) or (not usercount) then
	local database = G.ngx.ctx.database
	if not filecount then
		filecount = database:query("SELECT COUNT(fileid) AS c FROM files")[1].c
		fcshared:set("filecount", filecount, 60)
	end
	if not usercount then
		usercount = database:query("SELECT COUNT(id) AS c FROM users")[1].c
		fcshared:set("usercount", usercount, 60)
	end
end
if not G.ngx.var.http_X_Is_Js_Request then %>
		</div>
		<div class="navbar navbar-fixed-bottom">
			<div class="navbar-inner">
				<div class="container">
					<div class="nav-collapse">
						<ul class="nav">
							<li>
								<a>Request took <span id="reqtime"><%= G.math.ceil((G.socket.gettime() - G.ngx.ctx.req_starttime) * 100000) / 100 %>ms</span></a>
							</li>
						</ul>
						<ul class="nav pull-right">
							<li>
								<a>Currently powering <span id="filecount"><%= filecount %></span> files and <span id="usercount"><%= usercount %></span> users</a>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
		<script type="text/javascript">var PUSH_CHANNEL = "<% if G.ngx.ctx.user then %><%= G.ngx.ctx.user.id %>_<%= G.ngx.ctx.user.pushchan %><% end %>";</script>
		<script src="https://fox.gy/static/js/bootstrap.min.js" type="text/javascript"></script>
		<script src="https://fox.gy/static/js/prettify.min.js" type="text/javascript"></script>
		<script src="https://fox.gy/static/js/main.min.js" type="text/javascript"></script>
	</body>
</html>
<% else %>
|{
	"reqtime": "<%= G.math.ceil((G.socket.gettime() - G.ngx.ctx.req_starttime) * 100000) / 100 %>ms",
	"filecount": "<%= filecount %>",
	"usercount": "<%= usercount %>",
	"pushchan": "<% if G.ngx.ctx.user then %><%= G.ngx.ctx.user.id %>_<%= G.ngx.ctx.user.pushchan %><% end %>",
	"active_nav": "<%= G.ngx.ctx.active_nav_entry %>",
	"title": "<%= MAINTITLE %> - foxCaves"
}
<% end %>
