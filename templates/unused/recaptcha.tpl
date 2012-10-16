<label class="control-label">CAPTCHA</label>
<div class="controls">
	<!-- reCAPTCHA -->
	<script type="text/javascript" src="https://www.google.com/recaptcha/api/challenge?k=6Lc45NYSAAAAALcBfu-f24As5Fbni-JMGuVJmHhX&error=<%= CAPTCHA_ERROR %>"></script>
	<noscript>
		<iframe src="https://www.google.com/recaptcha/api/noscript?k=6Lc45NYSAAAAALcBfu-f24As5Fbni-JMGuVJmHhX&error=<%= CAPTCHA_ERROR %>" height="300" width="500" frameborder="0"></iframe><br>
		<textarea name="recaptcha_challenge_field" rows="3" cols="40"></textarea>
		<input type="hidden" name="recaptcha_response_field" value="manual_challenge">
	</noscript>
</div>
