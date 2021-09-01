local utils = require("foxcaves.utils")
local link_model = require("foxcaves.models.link")
local ngx = ngx

R.register_route("/api/v1/links", "POST", R.make_route_opts(), function()
    if not ngx.ctx.user:can_perform_write() then
        return utils.api_error("You cannot create links", 403)
    end

    local link = link_model.new()
    link:set_owner(ngx.ctx.user)

    local args = utils.get_post_args()
    local url = args.url or ""

    if url == "" then
        return utils.api_error("No URL")
    end

    if not link:set_url(args.url) then
        return utils.api_error("Invalid URL")
    end

    link:save()

    return link:get_private()
end, {
    description = "Creates a link",
    request = {
        body = {
            type = "object",
            required = true,
            fields = {
                url = {
                    type = "string",
                    description = "The URL the link should point to",
                    required = true,
                },
            },
        },
    },
    response = {
        body = {
            type = "link.private",
        },
    },
})
