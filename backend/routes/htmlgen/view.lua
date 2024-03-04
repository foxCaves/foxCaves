local utils = require('foxcaves.utils')
local file_model = require('foxcaves.models.file')
local user_model = require('foxcaves.models.user')
local htmlgen = require('foxcaves.htmlgen')
local ngx = ngx

--[[
    <meta property="og:title" content="foxCaves file - {FILENAME}" />
    <meta property="og:site_name" content="foxCaves"/>
    <meta property="og:description" content="Viewing file {FILENAME} ({SIZE}) uploaded by {USER} on {DATE}" />
    <meta property="og:image" content="Link to your logo" />
]]

R.register_route('/view/{file}', 'GET', R.make_route_opts_anon(), function(route_vars)
    local file = file_model.get_by_id(route_vars.file)
    if not file then
        return htmlgen.get_index_html()
    end
    if not file:can_view(ngx.ctx.user) then
        return htmlgen.get_index_html()
    end

    local owner = user_model.get_by_id(file.owner)

    return htmlgen.generate_index_html('foxCaves file - ' .. file.filename,
        'Viewing file ' .. file.filename .. ' uploaded by ' .. owner.name, file.thumbnail_url)
end)
