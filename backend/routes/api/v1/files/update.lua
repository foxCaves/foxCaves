local utils = require("foxcaves.utils")
local file_model = require("foxcaves.models.file")
local ngx = ngx

R.register_route("/api/v1/files/{id}", "PATCH", R.make_route_opts(), function(route_vars)
    local file = file_model.get_by_id(route_vars.id)
    if not file then
        return utils.api_error("File not found", 404)
    end
	if file.user ~= ngx.ctx.user.id then
		return utils.api_error("Not your file", 403)
	end

    local args = utils.get_post_args()

    if args.name then
        local newname = args.name
        local extcheck = "." .. file.extension
        if newname:sub((newname:len() + 1) - extcheck:len()) ~= extcheck then
            return utils.api_error("Extension mismatch")
        end
        file.name = newname
    end

    file:save()
    return file
end)
