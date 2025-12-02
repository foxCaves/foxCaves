local file_model = require('foxcaves.models.file')
local user_model = require('foxcaves.models.user')
local htmlgen = require('foxcaves.htmlgen')
local ngx = ngx

R.register_route('/view/{file}', 'GET', R.make_route_opts_anon(), function(route_vars)
    local file = file_model.get_by_id(route_vars.file)
    if (not file) or (not file:can_view(ngx.ctx.user)) then
        htmlgen.render_index_html()
        return
    end

    local file_data = file:get_public()

    local owner = user_model.get_by_id(file_data.owner)

    htmlgen.render_index_html(
        'foxCaves file - ' .. file_data.name,
        'Viewing file ' .. file_data.name .. ' uploaded by ' .. owner.username,
        file_data.thumbnail_url
    )
end)
