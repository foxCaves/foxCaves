<% if not G.ngx.var.http_X_Is_Js_Request then %>
<!DOCTYPE html>
<html>
	<head>
		<link rel="stylesheet" type="text/css" href="/static/css/bootstrap.css" />
		<link rel="stylesheet" type="text/css" href="/static/css/bootstrap-progressbar.css" />
		<link rel="stylesheet" type="text/css" href="/static/css/main.css" />
		<link rel="stylesheet" type="text/css" href="/static/css/<%= ((G.ngx.ctx.user and G.ngx.ctx.user.style) or "purple_fox") %>.css" />
		<link rel="stylesheet" type="text/css" href="/static/css/prettify.css" />

		<script type="text/javascript">window.SHORT_URL="<%= SHORT_URL %>";</script>
		<script src="//cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js" type="text/javascript"></script>
		<script src="//cdnjs.cloudflare.com/ajax/libs/raven.js/3.26.2/console/raven.min.js" type="text/javascript"></script>
		<script type="text/javascript">Raven.config('https://5d99e8f38f4c48e8b9f2803cba13caad@o804863.ingest.sentry.io/5803116').install();</script>
		<script src="/static/js/init.js" type="text/javascript"></script>
		<title><%= MAINTITLE %> - foxCaves</title>
	</head>
	<body data-spy="scroll" data-target=".bs-docs-sidebar">
		<div class="navbar navbar-fixed-top">
			<div class="navbar-inner">
				<div class="container">
					<a class="brand" href="/">foxCaves</a>
					<div class="nav-collapse">
						<ul class="nav" id="nav-main">
							<li data-menu-id="1"><a href="/">Home</a></li>
							<% if G.ngx.ctx.user then %>
								<li data-menu-id="2"><a href="/myfiles">My files</a></li>
								<li data-menu-id="3"><a href="/mylinks">My links</a></li>
								<li data-menu-id="4"><a href="/myaccount">My account</a></li>
							<% else %>
								<li data-menu-id="2"><a href="/login">Login</a></li>
								<li data-menu-id="3"><a href="/register">Register</a></li>
							<% end %>
							<%= ADDLINKS %>
						</ul>
						<ul class="nav pull-right">
<% if G.ngx.ctx.user then
local usedbytes = G.ngx.ctx.user.usedbytes
local totalbytes = G.ngx.ctx.user.totalbytes
local format_size = G.ngx.ctx.format_size
local usedperc = G.math.ceil((usedbytes / totalbytes) * 100) %>
							<li>
								<div class="progress" style="width: 200px; top: 10px; margin-right: 10px;">
									<script type="text/javascript">const TOTALBYTES = <%= G.tostring(totalbytes) %>;</script>
									<div class="bar bar-success" style="width: 100%;"></div>
									<div class="bar bar-danger" id="used_bytes_bar" style="width: <%= usedperc %>%;"></div>
									<div style="float: left; position: relative; width: 100%; text-align: center; color: white;">
										<span id="used_bytes_text"><%= format_size(usedbytes) %></span> / <%= format_size(totalbytes) %>
									</div>
								</div>
							</li>
<% end %>
							<li class="dropdown">
								<a class="dropdown-toggle" data-toggle="dropdown">Welcome, <% if G.ngx.ctx.user then %><%= G.ngx.ctx.escape_html(G.ngx.ctx.user.username) %><% if G.ngx.ctx.user.is_pro then %> <span class="badge badge-level badge-pro">Pro</span><% end %><% else %>Guest<% end %> <b class="caret"></b></a>
								<ul class="dropdown-menu">
<% if G.ngx.ctx.user then %>
									<li><a href="/myfiles">My files</a></li>
									<li><a href="/myaccount">My account</a></li>
									<li class="divider"></li>
									<li><a href="/cam">Camera Snapshot</a></li>
									<!--<li><a href="/gopro">Go pro</a></li>-->
									<li class="divider"></li>
									<li><a href="/login?logout=1">Logout</a></li>
<% else %>
									<li><a href="/login">Login</a></li>
									<li><a href="/register">Register</a></li>
<% end %>
								</ul>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
		<div class="container" id="main-container">
<% end %>
			<br />
			<%= MESSAGE %>
