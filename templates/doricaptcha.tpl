<label class="control-label">
	<%= QUESTION %>
</label>
<div class="controls">
<% if ANSWERS then %>
	<select name="captcha_result">
<% for _,answer in next, ANSWERS do %>
		<option><%= answer %></option>
<% end %>
	</select>
<% else %>
	<input type="text" name="captcha_result" />
<% end %>
	<input type="hidden" name="captcha_challenge" value="<%= CHALLENGE %>" />
</div>