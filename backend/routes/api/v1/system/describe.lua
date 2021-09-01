local ROUTE_TREE = R.get_route_tree()
local next = next

local MODEL_TABLE = {}
local function load_model(m)
    local model = require("foxcaves.models." .. m)
    MODEL_TABLE[m] = {
        public = model.get_public_fields(),
        private = model.get_private_fields(),
    }
end
load_model("user")
load_model("file")
load_model("link")

local function recurse_route_tree(int)
    local outt = {}
    for _, route in next, int.children do
        local children = recurse_route_tree(route)
        if children then
            outt.children = outt.children or {}
            outt.children[route.url_part] = children
        end
    end
    for m, route in next, int.methods do
        if route.descriptor and not route.descriptor.hidden then
            outt.methods = outt.methods or {}
            outt.methods[m] = route.descriptor
        end
    end

    if outt.methods or outt.children then
        return outt
    end
end

R.register_route("/api/v1/system/describe", "GET", R.make_route_opts_anon({ empty_is_array = true }), function()
    local res = {
        routes = recurse_route_tree(ROUTE_TREE.children.api.children.v1),
        models = MODEL_TABLE,
    }
    return res
end)
