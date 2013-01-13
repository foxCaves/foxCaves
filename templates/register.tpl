<%+ head %>
<h2>Register</h2>
<form action="" method="post" class="form-horizontal">
	<legend>Please enter your requested user details</legend>
	<div class="control-group">
		<label class="control-label" for="username">Username</label>
		<div class="controls">
			<input type="text" name="username" id="username" value="<%= G.ngx.ctx.escape_html(USERNAME) %>" />
		</div>
	</div>
	<div class="control-group">
		<label class="control-label" for="password">Password</label>
		<div class="controls">
			<input type="password" name="password" id="password" value="" />
		</div>
	</div>
	<div class="control-group">
		<label class="control-label" for="passwordconf">Confirm password</label>
		<div class="controls">
			<input type="password" name="password_confirm" id="passwordconf" value="" />
		</div>
	</div>
	<div class="control-group">
		<label class="control-label" for="email">E-Mail</label>
		<div class="controls">
			<input type="text" name="email" id="emails" value="<%= G.ngx.ctx.escape_html(EMAIL) %>" />
		</div>
	</div>

	<div class="control-group">
		<%= CAPTCHA %>
	</div>

	<div class="control-group">
		<div class="controls">
			<input type="submit" class="btn" name="register" value="Register" id="postbut" />
		</div>
	</div>
</form>
<%+ foot %>
