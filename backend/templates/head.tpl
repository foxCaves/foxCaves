<!DOCTYPE html>
<html>
	<head>
		<link rel="stylesheet" type="text/css" href="/static/css/bootstrap.css" />
		<link rel="stylesheet" type="text/css" href="/static/css/bootstrap-progressbar.css" />
		<link rel="stylesheet" type="text/css" href="/static/css/main.css" />
		<link rel="stylesheet" type="text/css" href="/static/css/purple_fox.css" />
		<link rel="stylesheet" type="text/css" href="/static/css/prettify.css" />

		<script type="text/javascript">window.SHORT_URL="<%= SHORT_URL %>";</script>
		<script src="//cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js" type="text/javascript"></script>
		<script src="https://browser.sentry-cdn.com/6.6.0/bundle.min.js" integrity="sha384-vPBC54nCGwq3pbZ+Pz+wRJ/AakVC5QupQkiRoGc7OuSGE9NDfsvOKeHVvx0GUSYp" crossorigin="anonymous"></script>
		<script type="text/javascript">Sentry.init({ dsn: 'https://5d99e8f38f4c48e8b9f2803cba13caad@o804863.ingest.sentry.io/5803116', release: '<%# ngx.ctx.get_version() %>' });</script>
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
							<% if G.ngx.ctx.user then %>
								<li data-menu-id="2"><a href="/myfiles">My files</a></li>
								<li data-menu-id="3"><a href="/mylinks">My links</a></li>
							<% else %>
								<li data-menu-id="2"><a href="/login">Login</a></li>
								<li data-menu-id="3"><a href="/register">Register</a></li>
							<% end %>
							<%= ADDLINKS %>
						</ul>
						<ul class="nav pull-right">
<% if G.ngx.ctx.user then %>
							<li>
								<div class="progress" style="width: 200px; top: 10px; margin-right: 10px;">
									<div class="bar bar-success" style="width: 100%;"></div>
									<div class="bar bar-danger" id="used_bytes_bar" style="width: 0%;"></div>
									<div style="float: left; position: relative; width: 100%; text-align: center; color: white;">
										<span id="used_bytes_text">?</span> / <span id="total_bytes_text">?</span>
									</div>
								</div>
							</li>
<% end %>
							<li class="dropdown">
								<a class="dropdown-toggle" data-toggle="dropdown">Welcome, <span id="username_text">User</span> <b class="caret"></b></a>
								<ul class="dropdown-menu">
<% if G.ngx.ctx.user then %>
									<li><a href="/myaccount">My account</a></li>
									<!--<li><a href="/gopro">Go pro</a></li>-->
									<!--<li class="divider"></li>
									<li><a href="/cam">Camera Snapshot</a></li>-->
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
			<br />
			<%= MESSAGE %>
