<% if not G.ngx.var.http_X_Is_Js_Request then %>
<!DOCTYPE html>
<html>
	<head>
		<link rel="stylesheet" type="text/css" href="<%= STATIC_URL_PREFIX %>/css/bootstrap.css" />
		<link rel="stylesheet" type="text/css" href="<%= STATIC_URL_PREFIX %>/css/bootstrap-progressbar.css" />
		<link rel="stylesheet" type="text/css" href="<%= STATIC_URL_PREFIX %>/css/main.css" />
		<link rel="stylesheet" type="text/css" href="<%= STATIC_URL_PREFIX %>/css/<%= ((G.ngx.ctx.user and G.ngx.ctx.user.style) or "purple_fox") %>.css" />
		<link rel="stylesheet" type="text/css" href="<%= STATIC_URL_PREFIX %>/css/prettify.css" />

		<script src="//cdnjs.cloudflare.com/ajax/libs/jquery/1.9.0/jquery.min.js" type="text/javascript"></script>
		<script src="<%= STATIC_URL_PREFIX %>/js/init.min.js" type="text/javascript"></script>
		<script type="text/javascript">var _gaq=_gaq||[];_gaq.push(['_setAccount','UA-9434636-6']);_gaq.push(['_setDomainName','foxcav.es']);_gaq.push(['_trackPageview']);(function(){var ga=document.createElement('script');ga.type='text/javascript';ga.async=true;ga.src=('https:'==document.location.protocol?'https://ssl':'http://www')+'.google-analytics.com/ga.js';var s=document.getElementsByTagName('script')[0];s.parentNode.insertBefore(ga,s);})();</script>
		<title><%= MAINTITLE %> - foxCaves</title>
	</head>
	<body data-spy="scroll" data-target=".bs-docs-sidebar">
		<div class="navbar navbar-fixed-top">
			<div class="navbar-inner">
				<div class="container">
					<a class="brand" href="/">foxCaves</a>
					<div class="nav-collapse">
						<ul class="nav" id="nav-main">
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
									<script type="text/javascript">var TOTALBYTES = <%= G.tostring(totalbytes) %>;</script>
									<div class="bar bar-success" style="width: 100%;"></div>
									<div class="bar bar-danger" id="used_bytes_bar" style="width: <%= usedperc %>%;"></div>
									<div style="float: left; position: relative; width: 100%; text-align: center; color: white;">
										<span id="used_bytes_text"><%= format_size(usedbytes) %></span> / <%= format_size(totalbytes) %>
									</div>
								</div>
							</li>
<% end %>
							<li class="dropdown">
								<a href="#" class="dropdown-toggle" data-toggle="dropdown">Welcome, <% if G.ngx.ctx.user then %><%= G.ngx.ctx.escape_html(G.ngx.ctx.user.username) %><% if G.ngx.ctx.user.is_pro then %> <span class="badge badge-level badge-pro">Pro</span><% end %><% else %>Guest<% end %> <b class="caret"></b></a>
								<ul class="dropdown-menu">
<% if G.ngx.ctx.user then %>
									<li><a href="/myfiles">My files</a></li>
									<li><a href="/myaccount">My account</a></li>
									<li class="divider"></li>
									<li><a href="/foxscreen">Get foxScreen</a></li>
									<li class="divider"></li>
									<li><a href="/gopro">Go pro</a></li>
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
				<div id="head-util-container" style="margin: auto; display:none;"><input type="button" value="Close" onclick="headUtil.hide();" /></div>
			</div>
		</div>
		<div class="container" id="main-container">
<% end %>
			<br />
			<%= MESSAGE %>
