<%
local fcshared = G.ngx.shared.foxcaves
local filecount = fcshared:get("filecount")
local usercount = fcshared:get("usercount")
if (not filecount) or (not usercount) then
	local database = G.ngx.ctx.database
	if not filecount then
		filecount = database:query("SELECT COUNT(fileid) AS c FROM files")[1].c
		fcshared:set("filecount", filecount, 60)
	end
	if not usercount then
		usercount = database:query("SELECT COUNT(id) AS c FROM users")[1].c
		fcshared:set("usercount", usercount, 60)
	end
end
%>
		</div>
		<div class="navbar navbar-fixed-bottom navbar-inverse">
			<div class="navbar-inner">
				<div class="container">
					<ul class="nav">
						<li>
							<a>Request took <%= G.math.ceil((G.socket.gettime() - G.ngx.ctx.req_starttime) * 100000) / 100 %>ms</a>
						</li>
					</ul>
					<ul class="nav pull-right">
						<li>
							<a>Currently powering <%= filecount %> files and <%= usercount %> users</a>
						</li>
					</ul>
				</div>
			</div>
		</div>
		<script src="https://d3rith5u07eivj.cloudfront.net/static/js/bootstrap.min.js" type="text/javascript"></script>
		<script src="https://d3rith5u07eivj.cloudfront.net/static/js/prettify.min.js" type="text/javascript"></script>
		<script src="https://d3rith5u07eivj.cloudfront.net/static/js/main.min.js?v=6" type="text/javascript"></script>
	</body>
</html>
