<%+ head %>
<% for _,item in pairs(ITEMS) do %>
<form action="https://<%= PAYPAL_URL %>/webscr" method="post">
        <input type="hidden" name="cmd" value="_xclick">

        <input type="hidden" name="business" value="<%= PAYPAL_EMAIL %>">
        <input type="hidden" name="currency_code" value="USD">
        <input type="hidden" name="cancel_return" value="https://foxcav.es/gopro?cancel=1">
        <input type="hidden" name="return" value="https://foxcav.es/gopro?paid=1">
        <input type="hidden" name="notify_url" value="https://foxcav.es/internal/paypal_notify?userid=<%= G.ngx.ctx.user.id %>">
        <input type="hidden" name="item_name" value="<%= item.name %>">
        <input type="hidden" name="item_number" value="<%= item.id %>">
        <input type="hidden" name="invoice" value="<%= G.ngx.ctx.user.sessionid %>">
        <input type="hidden" name="amount" value="<%= item.cost %>">

        <input type="hidden" name="lc" value="US">

        <input type="submit" name="submit" alt="" value="Continue to PayPal">
</form>
<% end %>
<%+ foot %>