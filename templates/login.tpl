<%+ head %>
<h2>Login</h2>
<form action="/login" method="post" class="form-horizontal">
	<legend>Please enter your details to login</legend>
	<div class="control-group">
		<label class="control-label" for="username">Username</label>
		<div class="controls">
			<input type="text" name="username" id="username" value="<%= G.ngx.ctx.escape_html(USERNAME) %>" autofocus="autofocus" />
		</div>
	</div>
	<div class="control-group">
		<label class="control-label" for="password">Password</label>
		<div class="controls">
			<input type="password" name="password" id="password" />
		</div>
	</div>
	<div class="control-group">
		<div class="controls">
			<label class="checkbox" for="id">
				<input type="checkbox" name="remember" id="remember" value="yes" /><label for="remember"> Remember me</label>
			</label>
			<a href="/email/forgotpwd">Forgot your password?</a><br /><br />
			<input type="submit" class="btn" name="login" value="Login" />
		</div>
	</div>
</form>
<%+ foot %>
