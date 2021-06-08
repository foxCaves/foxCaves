<div class="well well-small">
<% if G.ngx.ctx.user.is_pro then %>
		You currently have a <span class="badge badge-level badge-pro">Pro</span> account valid until <%= G.os.date("%d.%m.%Y %H:%M", G.ngx.ctx.user.pro_expiry) %><% if false and not HIDE_GOPRO_LINKS then %> <a href="/gopro">Extend pro</a><% end %>
<% else %>
		You currently have a <span class="badge badge-level badge-basic">Basic</span> account<% if false and not HIDE_GOPRO_LINKS then %> <a href="/gopro">Go pro</a><% end %>
<% end %>
</div>
