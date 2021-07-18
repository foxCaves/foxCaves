<%+ head %>
<h2><%= MAINTITLE %></h2>
<form action="" method="post" class="form-horizontal">
	<legend>Please enter your username and E-Mail</legend>
	<div class="control-group">
		<label class="control-label" for="username">Username</label>
		<div class="controls">
			<input type="text" name="username" id="username" value="<%= G.ngx.ctx.escape_html(USERNAME) %>" />
		</div>
	</div>
	<div class="control-group">
		<label class="control-label" for="email">E-Mail</label>
		<div class="controls">
			<input type="email" name="email" id="email" value="<%= G.ngx.ctx.escape_html(EMAIL) %>" />
		</div>
	</div>

	<div class="control-group">
		<div class="controls">
			<input type="submit" class="btn" name="send" value="Send E-Mail" id="postbut" />
		</div>
	</div>
</form>
<%+ foot %>
