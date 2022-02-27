local utils = require("foxcaves.utils")
local expiry_utils = require("foxcaves.expiry_utils")
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

    expiry_utils.parse_expiry(args, link)

    link:save()

    return link:get_private()
end, {
    description = "Creates a link",
    authorization = {"active"},
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
                expires_at = {
                    type = "string",
                    description = "The expiry of the link",
                    required = false,
                },
                expires_in = {
                    type = "number",
                    description = "The expiry of the link",
                    required = false,
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
