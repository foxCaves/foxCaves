<br /><br />
<%
local filecount = 0
local usercount = 0
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
								<a>foxCaves &copy; Doridian 2012</a>
								<!--<a>Currently powering <span id="filecount"><%= filecount %></span> files and <span id="usercount"><%= usercount %></span> users</a>-->
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
