<br /><br />
<% if not G.ngx.var.http_X_Is_Js_Request then %>
		</div>
		<div class="navbar navbar-fixed-bottom">
			<div class="navbar-inner">
				<div class="container">
					<div class="nav-collapse">
						<ul class="nav">
							<li>
								<a href="/legal/terms_of_service">Terms of Service</a>
							</li>
							<li>
								<a href="/legal/privacy_policy">Privacy Policy</a>
							</li>
						</ul>
						<ul class="nav pull-right">
							<li>
								<a>foxCaves &copy; 2021 (<%# ngx.ctx.get_version():sub(1,7) %>)</a>
							</li>
							<li class="dropdown">
								<a href="#" class="dropdown-toggle" data-toggle="dropdown">Style</a>
								<ul class="dropdown-menu">
									<li><a href="/myaccount?setstyle=purple_fox">Purple Fox</a></li>
									<li><a href="/myaccount?setstyle=red_fox">Red Fox</a></li>
									<li><a href="/myaccount?setstyle=arctic_fox">Arctic Fox</a></li>
								</ul>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
		<script type="text/javascript">var PUSH_CHANNEL="<% if G.ngx.ctx.user then %><%= G.ngx.ctx.user.id %>_<%= G.ngx.ctx.user.pushchan %><% end %>";</script>
		<script src="//cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/2.3.2/js/bootstrap.min.js" type="text/javascript"></script>
		<script src="//cdnjs.cloudflare.com/ajax/libs/prettify/r298/prettify.min.js" type="text/javascript"></script>
		<script src="//cdnjs.cloudflare.com/ajax/libs/prettify/r298/lang-lua.min.js" type="text/javascript"></script>
		<script src="/static/js/main.js" type="text/javascript"></script>
	</body>
</html>
<!-- GIT rev <%# ngx.ctx.get_version() %> -->
<% else %>
|{
	"filecount": "<%= filecount %>",
	"usercount": "<%= usercount %>",
	"pushchan": "<% if G.ngx.ctx.user then %><%= G.ngx.ctx.user.id %>_<%= G.ngx.ctx.user.pushchan %><% end %>",
	"active_nav": "<%= G.ngx.ctx.active_nav_entry %>",
	"title": "<%= MAINTITLE %> - foxCaves"
}
<% end %>
