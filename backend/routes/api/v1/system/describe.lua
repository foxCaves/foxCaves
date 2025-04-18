local ROUTE_TABLE = R.get_table()
local next = next

local function describe_api()
    local res = {
        routes = {},
        authorizations = {
            anonymous = 'Anyone or no one',
            self = 'Must be the user for which data is being requested',
            active = 'Must be a user with user.active = 1',
            owner = 'Must be the owner of the resource (resource.owner == user.id)',
            author = 'Must be the author of the resource (resource.author == user.id)',
            editor = 'Must be the editor of the resource (resource.editor == user.id)',
            admin = 'Must be an admin (admins can do anything, so this just exists to document admin-only routes)',
        },
        types = {
            string = {
                type = 'string',
                description = 'An arbitrary string',
            },
            float = {
                type = 'number',
                description = 'A floating-point number',
            },
            integer = {
                type = 'number',
                description = 'An integer number',
            },
            boolean = {
                type = 'boolean',
                description = 'A boolean value',
            },
            uuid = {
                type = 'string',
                description = 'A UUID in string form',
            },
            timestamp = {
                type = 'string',
                description = 'A timestamp in ISO-8601 format',
            },
            object = {
                type = 'object',
                description = 'An arbitrary object, containing given fields',
                fields = {},
            },
            raw = {
                type = 'raw',
                description = 'A raw value, not encoded at all',
            },
            array = {
                type = 'array',
                description = 'An array of arbitrary values, described by item_type',
                item_type = 'object',
            },
        },
    }

    for _, m in pairs({ 'user', 'file', 'link', 'news' }) do
        local model = require('foxcaves.models.' .. m)
        res.types[m .. '.public'] = {
            type = 'object',
            fields = model.get_public_fields(),
        }
        res.types[m .. '.private'] = {
            type = 'object',
            fields = model.get_private_fields(),
        }
    end

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
R.register_route('/api/v1/system/describe', 'GET', R.make_route_opts_anon(), function()
    if not api_description_cache then
        api_description_cache = describe_api()
    end
    return api_description_cache
end)
