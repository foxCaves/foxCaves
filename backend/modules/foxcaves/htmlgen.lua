local config = require('foxcaves.config')
local consts = require('foxcaves.consts')

local ngx = ngx
local tostring = tostring
local type = type

local index_html = ''
local index_html_pre_metadata = ''
local index_html_post_metadata = ''

local html_escape_table = {
    ['&'] = '&amp;',
    ['<'] = '&lt;',
    ['>'] = '&gt;',
    ['"'] = '&quot;',
}

local html_replacement_expr = ''

(function()
    for raw in next, html_escape_table do
        html_replacement_expr = html_replacement_expr .. raw
    end

    html_replacement_expr = '[' .. html_replacement_expr .. ']'

    local fh = io.open(consts.FRONTEND_ROOT .. '/index.html', 'r')
    index_html = fh:read('*a')
    fh:close()

    local idx = index_html:find('</head>')
    index_html_pre_metadata = index_html:sub(1, idx - 1)
    index_html_post_metadata = index_html:sub(idx)
end)()

local M = {}
require('foxcaves.module_helper').setmodenv()

local function escape_html(str)
    if not str or type(str) ~= 'string' then
        str = tostring(str)
    end
    str = str:gsub(html_replacement_expr, html_escape_table)
    return str
end
M.escape_html = escape_html

local FIXED_METADATA =
    [[
    <link rel="dns-prefetch" href="]] .. escape_html(
        config.http.cdn_url
    ) .. [[" />
    <meta property="og:site_name" content="foxCaves" />
    <meta name="twitter:card" content="summary_large_image">
]]

function M.get_index_html()
    return index_html
end

local function generate_index_html(title, description, image, site_type)
    if not title then
        title = 'foxCaves'
    end
    if not description then
        description = 'foxCaves'
    end
    if not image then
        image = config.http.app_url .. '/static/img/logo.jpg'
    end
    if not site_type then
        site_type = 'website'
    end

    return index_html_pre_metadata .. FIXED_METADATA .. [[
        <meta property="og:title" content="]] .. escape_html(
        title
    ) .. [[" />
        <meta property="og:description" content="]] .. escape_html(
        description
    ) .. [[" />
        <meta property="og:image" content="]] .. escape_html(
        image
    ) .. [[" />
        <meta property="og:type" content="]] .. escape_html(
        site_type
    ) .. [[" />
    ]] .. index_html_post_metadata
end
M.generate_index_html = generate_index_html

function M.render_index_html(title, description, image)
    ngx.header['Content-Type'] = 'text/html'
    ngx.say(generate_index_html(title, description, image))
    ngx.eof()
end

return M
