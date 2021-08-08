<%+ includes/_head %>
<h2><%= MAINTITLE %></h2>
<form id="email_form" method="post" class="form-horizontal">
	<legend>Please enter your username and E-Mail</legend>
	<div class="control-group">
		<label class="control-label" for="username">Username</label>
		<div class="controls">
			<input type="text" name="username" id="username" value="" />
		</div>
	</div>
	<div class="control-group">
		<label class="control-label" for="email">E-Mail</label>
		<div class="controls">
			<input type="email" name="email" id="email" value="" />
		</div>
	</div>
	<div class="control-group">
		<div class="controls">
			<input type="hidden" name="emailaction" value="<%= ACTION %>" />
			<input type="button" onclick="submitEmailFormSimple();" class="btn" name="send" value="Send E-Mail" id="postbut" />
		</div>
	</div>
</form>
<script type="text/javascript" src="/static/js/email.js"></script>
<%+ includes/_foot %>
