<%+ head %>
<h2>Register</h2>
<form action="" method="post" class="form-horizontal">
	<legend>Please enter your requested user details</legend>
	<div class="control-group">
		<label class="control-label">Username</label>
		<div class="controls">
			<input type="text" name="username" value="<%= G.ngx.ctx.escape_html(USERNAME) %>" />
		</div>
	</div>
	<div class="control-group">
		<label class="control-label">Password</label>
		<div class="controls">
			<input type="password" name="password" value="" />
		</div>
	</div>
	<div class="control-group">
		<label class="control-label">Confirm password</label>
		<div class="controls">
			<input type="password" name="password_confirm" value="" />
		</div>
	</div>
	<div class="control-group">
		<label class="control-label">E-Mail</label>
		<div class="controls">
			<input type="text" name="email" value="<%= G.ngx.ctx.escape_html(EMAIL) %>" />
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
