<div class="container well well-small">
	<%
		local pro_expiry = G.ngx.ctx.user.pro_expiry
		local cur_time = G.ngx.time()
		if pro_expiry >= cur_time then
	%>
		You currently have a <span class="badge badge-level badge-pro">Pro</span> account valid until <%= G.os.date("%d.%m.%Y %H:%M", pro_expiry) %><% if not HIDE_GOPRO_LINKS then %> <a href="/gopro">Extend pro</a><% end %>
	<% else %>
		You currently have a <span class="badge badge-level badge-basic">Basic</span> account<% if not HIDE_GOPRO_LINKS then %> <a href="/gopro">Go pro</a><% end %>
	<% end %>
</div>
