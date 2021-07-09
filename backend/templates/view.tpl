<%+ head %>
	<h3>Viewing file: <span id="view-name">Loading...</span></h3>
	<div class="well well-small" style="text-align: left;">
		<form class="form-horizontal">
			<div class="control-group">
				<label class="control-label">Uploaded by</label>
				<div class="controls" id="view-owner" style="padding-top: 5px;">Loading...</div>
			</div>
			<div class="control-group">
				<label class="control-label">Uploaded on</label>
				<div class="controls" id="view-time" style="padding-top: 5px;">Loading...</div>
			</div>
			<div class="control-group">
				<label class="control-label">Size</label>
				<div class="controls" id="view-size" style="padding-top: 5px;">Loading...</div>
			</div>
			<div class="control-group">
				<label class="control-label" for="view-link">View link</label>
				<div class="controls">
					<input readonly="readonly" id="view-link" type="text" value="Loading..." />
				</div>
			</div>
			<div class="control-group">
				<label class="control-label" for="direct-link">Direct link</label>
				<div class="controls">
					<input readonly="readonly" id="direct-link" type="text" value="Loading.." />
				</div>
			</div>
			<div class="control-group">
				<label class="control-label" for="download-link">Download link</label>
				<div class="controls">
					<input readonly="readonly" id="download-link" type="text" value="Loading.." />
				</div>
			</div>
		</form>
	</div>
	<a href="#" id="download-button" class="btn btn-large btn-block btn-primary">Download file</a>
	<div id="preview-wrapper"><h5>Loading...</h5></div>
	<script type="text/javascript" src="/static/js/view.js"></script>
	<script type="text/javascript" src="/static/js/dancer.js"></script>
	<script type="text/javascript" src="/static/js/audiovis.js"></script>
<%+ foot %>
