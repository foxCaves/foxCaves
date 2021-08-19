local utils = require("foxcaves.utils")
local File = require("foxcaves.models.file")
local ngx = ngx

R.register_route("/api/v1/files/{id}", "PATCH", R.make_route_opts(), function(route_vars)
    local file = File.GetByID(route_vars.id)
    if not file then
        return utils.api_error("File not found", 404)
    end
	if file.user ~= ngx.ctx.user.id then
		return utils.api_error("Not your file", 403)
	end

    local args = utils.get_post_args()

    if args.name then
        local newname = args.name
        if newname:sub((newname:len() + 1) - file.extension:len()) ~= file.extension then
            return utils.api_error("Extension mismatch")
        end
        file.name = newname
    end

    file:Save()
    return file
end)
