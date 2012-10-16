<%+ head %>
<% local invoiceid = G.randstr(64) %>
<% for k,item in pairs(ITEMS) do %>
<div class="container">
	<h3><%= item.title %></h3> <%= item.price %> $(USD)
	</h4><%= item.description %><h4>
	<form action="https://www.sandbox.paypal.com/webscr" method="post">
			<input type="hidden" name="cmd" value="_xclick">

			<input type="hidden" name="business" value="<%= G.PAYPAL_EMAIL %>">
			<input type="hidden" name="currency_code" value="USD">
			<input type="hidden" name="cancel_return" value="https://foxcav.es/gopro?cancel=1">
			<input type="hidden" name="return" value="https://foxcav.es/gopro?paid=1">
			<input type="hidden" name="notify_url" value="https://foxcav.es/internal/paypal_notify?userid=<%= G.ngx.ctx.user.id %>">
			<input type="hidden" name="item_name" value="<%= item.title %>">
			<input type="hidden" name="item_number" value="<%= k %>">
			<input type="hidden" name="invoice" value="<%= invoiceid %>">
			<input type="hidden" name="amount" value="<%= item.price %>">

			<input type="hidden" name="lc" value="US">

			<input type="submit" name="submit" alt="" value="Continue to PayPal">
	</form>
</div>
<% end %>
<%+ foot %>