<label class="control-label">CAPTCHA</label>
<div class="controls">
	<!-- keyCAPTCHA -->
	<input type="hidden" name="capcode" id="capcode" value="false" />
	<% local sessionid = G.randstr(13) .. '-4.0.0.001'
	local privatekey = 'euNpikfAahXQuTcYCbtUIJhEo' %>
	<script type='text/javascript'>
		var s_s_c_user_id = '35989';
		var s_s_c_session_id = '<%= sessionid %>';
		var s_s_c_captcha_field_id = 'capcode';
		var s_s_c_submit_button_id = 'postbut';
		var s_s_c_web_server_sign = '<%= G.ngx.md5(sessionid .. G.ngx.var.remote_addr .. privatekey) %>';
		var s_s_c_web_server_sign2 = '<%= G.ngx.md5(sessionid .. privatekey) %>';
	</script>
	<script type='text/javascript' language='JavaScript' src='https://backs.keycaptcha.com/swfs/cap.js'></script>
</div>

