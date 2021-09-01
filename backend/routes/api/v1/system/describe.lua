local ROUTE_TABLE = R.get_route_table()
local next = next

local TYPE_TABLE = {
    ["string"] = {
        type = "string",
        description = "An arbitrary string",
    },
    ["float"] = {
        type = "number",
        description = "A floating-point number",
    },
    ["integer"] = {
        type = "number",
        description = "An integer number",
    },
    ["boolean"] = {
        type = "boolean",
        description = "A boolean value",
    },
    ["uuid"] = {
        type = "string",
        description = "A UUID in string form",
    },
    ["timestamp"] = {
        type = "string",
        description = "A timestamp in ISO-8601 format",
    },
    ["object"] = {
        type = "object",
        description = "An arbitrary object, containing given fields",
        fields = {},
    },
    ["raw"] = {
        type = "raw",
        description = "A raw value, not encoded at all",
    },
    ["array"] = {
        type = "array",
        description = "An array of arbitrary values, described by items",
        items = {},
    },
}
local function load_model(m)
    local model = require("foxcaves.models." .. m)
    TYPE_TABLE[m .. ".public"] = {
        type = "object",
        fields = model.get_public_fields()
    }
    TYPE_TABLE[m .. ".private"] = {
        type = "object",
        fields = model.get_private_fields()
    }
end
load_model("user")
load_model("file")
load_model("link")

local function describe_api()
    local res = {
        routes = {},
        types = TYPE_TABLE,
    }

    for url, methods in next, ROUTE_TABLE do
        for method, route in next, methods do
            if route.descriptor and not route.descriptor.hidden then
                if not res.routes[url] then
                    res.routes[url] = {}
                end
                res.routes[url][method] = route.descriptor
            end
        end
    end

    return res
end

local api_description_cache = nil

R.register_route("/api/v1/system/describe", "GET", R.make_route_opts_anon({ empty_is_array = true }), function()
    if not api_description_cache then
        api_description_cache = describe_api()
    end
    return api_description_cache
end)
