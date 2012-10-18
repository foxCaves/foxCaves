<%+ head %>
<%+ account_type %>
<div class="container well well-small">
	<h4>Which benefits does a pro account have?</h4>
	<ul>
		<li>1GB upload limit instead of 200MB</li>
		<li>No advertisments, ever, not on your uploads (for others) and not on any page you view</li>
		<li>The warm and fuzzy feeling of supporting this website to cope with the hosting costs</li>
	</ul>
</div>
<% for itemid,item in pairs(ITEMS) do %>
<div class="container well well-small">
	<h3 style="float: right;">
		<form action="https://www.paypal.com/webscr" method="post">
			<input type="hidden" name="cmd" value="_xclick">

			<input type="hidden" name="business" value="<%= G.PAYPAL_EMAIL %>">
			<input type="hidden" name="currency_code" value="USD">
			<input type="hidden" name="cancel_return" value="https://foxcav.es/gopro?cancel=1">
			<input type="hidden" name="return" value="https://foxcav.es/gopro?paid=1">
			<input type="hidden" name="notify_url" value="https://foxcav.es/internal/paypal_notify?userid=<%= G.ngx.ctx.user.id %>">
			<input type="hidden" name="item_name" value="foxCaves: <%= item.title %>">
			<input type="hidden" name="item_number" value="<%= itemid %>">
			<input type="hidden" name="invoice" value="<%= INVOICEID %>">
			<input type="hidden" name="amount" value="<%= item.price %>">

			<input type="hidden" name="lc" value="US">

			<input class="btn btn-large btn-warning" type="submit" name="submit" alt="" value="Pay with PayPal">
		</form>
	</h3>
	<h3><%= item.title %> [<%= item.price %>$]</h3>
	</h4><%= item.description %><h4>
</div>
<% end %>
<%+ foot %>