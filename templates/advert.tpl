<% if (not HIDE_ADS) and ((not G.ngx.ctx.user) or G.ngx.ctx.user.pro_expiry < G.ngx.time()) then %>
<div class="container well well-small advert">
	<script type="text/javascript">google_ad_client = "ca-pub-2830556372256039";google_ad_slot = "4353167953";google_ad_width = 728;google_ad_height = 90;</script>
	<script type="text/javascript" src="https://pagead2.googlesyndication.com/pagead/show_ads.js"></script>
</div>
<% end %>
