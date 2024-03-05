local path = require('path')

local ngx = ngx

local index_html = ''
local index_html_pre_metadata = ''
local index_html_post_metadata = ''

local html_escape_table = {
    ['&'] = '&amp;',
    ['<'] = '&lt;',
    ['>'] = '&gt;'
}

local html_replacement_expr = ''

(function()
    for raw in next, html_escape_table do
        html_replacement_expr = html_replacement_expr .. raw
    end

    html_replacement_expr = '[' .. html_replacement_expr .. ']'

    local fh = io.open(path.abs(LUA_ROOT .. '/../html') .. '/static/index.html', 'r')
    index_html = fh:read('*a')
    fh:close()

    local idx = index_html:find('</head>')
    index_html_pre_metadata = index_html:sub(1, idx - 1)
    index_html_post_metadata = index_html:sub(idx)
end)()

local tostring = tostring
local type = type

local M = {}
require('foxcaves.module_helper').setmodenv()

function M.get_index_html()
    return index_html
end

function M.generate_index_html(title, description, image)
    if not (title or description or image) then
        return index_html
    end

    if not title then
        title = 'foxCaves'
    end
    if not description then
        description = 'foxCaves'
    end
    if not image then
        image = 'https://foxcav.es/static/img/logo.jpg'
    end

    return index_html_pre_metadata .. [[
        <meta property="og:title" content="]] .. title .. [[" />
        <meta property="og:description" content="]] .. description .. [[" />
        <meta property="og:image" content="]] .. image .. [[" />
    ]] .. index_html_post_metadata
end

function M.render_index_html(title, description, image)
    ngx.header['Content-Type'] = 'text/html'
    ngx.say(M.generate_index_html(title, description, image))
    ngx.eof()
end

function M.escape_html(str)
    if not str or type(str) ~= 'string' then
        str = tostring(str)
    end
    str = str:gsub(html_replacement_expr, html_escape_table)
    return str
end

return M
