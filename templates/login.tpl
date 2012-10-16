<%+ head %>
<h2>Login</h2>
<form action="/login" method="post" class="form-horizontal">
	<legend>Please enter your details to login</legend>
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
		<div class="controls">
			<label class="checkbox">
				<input type="checkbox" value="yes" name="remember" /> Remember me
			</label>
			<a href="/email/forgotpwd">Forgot your password?</a><br /><br />
			<input type="submit" class="btn" name="login" value="Login" />
		</div>
	</div>
</form>
<%+ foot %>
