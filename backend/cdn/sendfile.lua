ctx_init()

local function send_file(disposition_type)
	local fileid = ngx.var.fileid
	local file = file_get_public(fileid)

	if (not file) or file.extension:sub(2):lower() ~= ngx.var.extension:lower() then
		ngx.status = 404
		ngx.print("File not found")
		return
	end

	ngx.header["Content-Dispotition"] = disposition_type .. "; filename=" .. file.name

	ngx.req.set_uri("/rawget/" .. fileid .. "/file" .. file.extension, true)
end

if ngx.var.action == "f" then
	send_file("inline")
else
	ngx.header["Content-Type"] = "application/octet-stream"
	send_file("attachment")
end
