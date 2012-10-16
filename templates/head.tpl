<!DOCTYPE html>
<html>
	<head>
		<link rel="stylesheet" type="text/css" href="https://d3rith5u07eivj.cloudfront.net/static/css/bootstrap.min.css" />
		<link rel="stylesheet" type="text/css" href="https://d3rith5u07eivj.cloudfront.net/static/css/bootstrap-progressbar.min.css" />
	        <link rel="stylesheet" type="text/css" href="https://d3rith5u07eivj.cloudfront.net/static/css/main.min.css?v=3" />
	        <link rel="stylesheet" type="text/css" href="https://d3rith5u07eivj.cloudfront.net/static/css/prettify.min.css" />

		<title><%= MAINTITLE %> - foxCaves</title>

		<script type="text/javascript">var _gaq=_gaq||[];_gaq.push(['_setAccount','UA-9434636-6']);_gaq.push(['_setDomainName','foxcav.es']);_gaq.push(['_trackPageview']);(function(){var ga=document.createElement('script');ga.type='text/javascript';ga.async=true;ga.src=('https:'==document.location.protocol?'https://ssl':'http://www')+'.google-analytics.com/ga.js';var s=document.getElementsByTagName('script')[0];s.parentNode.insertBefore(ga,s);})();</script>
	</head>
    <body data-spy="scroll" data-target=".bs-docs-sidebar">
		<div class="navbar navbar-inverse navbar-fixed-top">
			<div class="navbar-inner">
				<div class="container">
					<a class="brand" href="/">foxCaves</a>
					<ul class="nav">
						<%= ADDLINKS %>
					</ul>
					<ul class="nav pull-right">
<% if G.ngx.ctx.user then
local usedbytes = G.tonumber(G.ngx.ctx.user.usedbytes)
local totalbytes = G.tonumber(G.ngx.ctx.user.totalbytes) + G.tonumber(G.ngx.ctx.user.bonusbytes)
local format_size = G.ngx.ctx.format_size
local usedperc = G.math.ceil((usedbytes / totalbytes) * 100) %>
<li>
	<div class="progress" style="width: 200px; top: 10px; margin-right: 10px;">
		<div class="bar bar-success" style="width: 100%;"></div>
		<div class="bar bar-danger" style="width: <%= usedperc %>%;"></div>
		<div style="float: left; position: relative; width: 100%; text-align: center; color: white;">
			<%= format_size(usedbytes) %> / <%= format_size(totalbytes) %>
		</div>
	</div>
</li>
<% end %>
						<li class="dropdown">
							<a href="" class="dropdown-toggle" data-toggle="dropdown">Welcome, <% if G.ngx.ctx.user then %><%= G.ngx.ctx.escape_html(G.ngx.ctx.user.username) %><% if G.ngx.ctx.user.pro_expiry >= G.ngx.time() then %> <span class="badge badge-info badge-advert">Pro</span><% end %><% else %>Guest<% end %> <b class="caret"></b></a>
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
		</div>
		<div class="container">
			<center><%+ advert %></center>
			<br />
			<%= MESSAGE %>
