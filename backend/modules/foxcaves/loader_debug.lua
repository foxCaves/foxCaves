local utils = require('foxcaves.utils')
local router = require('foxcaves.router')
local ngx = ngx
local xpcall = xpcall
local table = table
local math = math
local io = io
local debug = debug
local string = string
local type = type
local tostring = tostring

local html_escape_table = {
    ['&'] = '&amp;',
    ['<'] = '&lt;',
    ['>'] = '&gt;',
}

local html_unescape_table = {}
local html_replacement_expr = ''

(function()
    for raw, escaped in next, html_escape_table do
        html_unescape_table[escaped] = raw
        html_replacement_expr = html_replacement_expr .. raw
    end

    html_replacement_expr = '[' .. html_replacement_expr .. ']'
end)()

ngx.log(ngx.ERR, html_replacement_expr)

local M = {}
require('foxcaves.module_helper').setmodenv()

local function escape_html(str)
    if not str or type(str) ~= 'string' then
        return str
    end
    str = str:gsub(html_replacement_expr, html_escape_table)
    return str
end

local function make_table_recurse(var, done, depth)
    depth = depth or 0
    local t = type(var)

    if depth > 1 then
        return escape_html(tostring(var))
    end

    if t == 'table' then
        if not done then
            done = {}
        end
        if not done[var] then
            done[var] = true
            local ret =
                {
                    depth == 0 and '' or escape_html(tostring(var)),
                    '<table class="table table-striped"><thead><tr><th scope="row">Name</th><th scope="row">Type</th><th scope="row">Value</th></tr></thead><tbody>',
                }
            for k, v in utils.sorted_pairs(var) do
                table.insert(ret, '<tr><td>' .. escape_html(tostring(k)) .. '</td><td>' .. escape_html(type(v)) .. '</td><td>')
                table.insert(ret, make_table_recurse(v, done, depth + 1))
                table.insert(ret, '</td></tr>')
            end
            table.insert(ret, '</tbody></table>')
            return table.concat(ret, '')
        end

        return tostring(var)
    elseif t == 'function' then
        return escape_html(tostring(var))
    else
        return escape_html(tostring(var):sub(1, 1024))
    end
end

local function get_function_code(info)
    local curr = info.currentline
    local startline = info.linedefined or -1 --function start
    local endline = info.lastlinedefined or -1 --function end
    local minline = math.max(curr - 5, 1) --start of capture
    local maxline = curr + 5 --end of capture
    if startline < 1 then
        startline = 1
    end

    if minline < startline then
        minline = startline
    end
    if maxline > endline then
        maxline = endline
    end

    if endline ~= -1 then
        local out =
            {
                "<h4 class='card-title'>Code</h4><div class='card-body'><pre class='prettyprint lang-lua'><ol class='linenums'>",
            }
        local source = info.short_src
        if source:sub(1, 9) == '[string "' then
            source = source:sub(10, -3)
        end
        local fh = io.open(source, 'r')
        if fh then
            local funcStart
            local iter = fh:lines()
            for i = 1, minline - 1 do
                if (i == startline) then
                    funcStart = iter()
                else
                    iter()
                end
            end
            if (minline ~= startline) then
                table.insert(out, '<li value="' .. startline .. '">')
                table.insert(out, escape_html(funcStart))
                table.insert(out, "<span class='nocode'>\n...</span></li>")
            end
            for i = minline, maxline do
                if (curr == i) then
                    table.insert(out, '<li class="errorline" value="' .. i .. '">')
                else
                    table.insert(out, '<li value="' .. i .. '">')
                end
                table.insert(out, escape_html(iter()))
                if i < maxline then
                    table.insert(out, '</li>')
                end
            end
            if maxline ~= endline then
                local funcEnd
                for _ = maxline + 1, endline do
                    funcStart = iter()
                    if funcStart then
                        funcEnd = funcStart
                    else
                        break
                    end
                end
                table.insert(
                    out,
                    "<span class='nocode'>\n...</span></li><li value=\"" .. endline .. '">' .. escape_html(funcEnd) .. '</li>'
                )
            else
                table.insert(out, '</li>')
            end
            fh:close()
        else
            return 'Failed to read source'
        end
        table.insert(out, '</ol></pre></div>')
        return table.concat(out, '')
    end
    return ''
end

local function get_locals(level)
    if debug.getlocal(level + 1, 1) then
        local out = { "<h4 class='card-title'>Locals</h4><div class='card-text'>" }
        local tbl = {}
        for i = 1, 100 do
            local k, v = debug.getlocal(level + 1, i)
            if not k then
                break
            end
            tbl[k] = v
        end
        table.insert(out, make_table_recurse(tbl))
        table.insert(out, '</div>')
        return table.concat(out, '')
    end
    return ''
end

local function get_upvalues(func)
    if func and debug.getupvalue(func, 1) then
        local out = { "<h4 class='card-title'>Up values</h4><div class='card-text'>" }
        local tbl = {}
        for i = 1, 100 do
            local k, v = debug.getupvalue(func, i)
            if not k then
                break
            end
            tbl[k] = v
        end
        table.insert(out, make_table_recurse(tbl))
        table.insert(out, '</div>')
        return table.concat(out, '')
    end
    return ''
end

local dbg_trace_hdr =
    [[
    <html><head>
    <script type="text/javascript"
        src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.2.3/js/bootstrap.min.js" crossorigin="anonymous"></script>
    <script
        src="https://cdnjs.cloudflare.com/ajax/libs/prettify/r298/prettify.min.js"
        type="text/javascript" crossorigin="anonymous"></script>
    <script
        src="https://cdnjs.cloudflare.com/ajax/libs/prettify/r298/lang-lua.min.js"
        type="text/javascript" crossorigin="anonymous"></script>
    <link rel="stylesheet" type="text/css"
        href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.2.3/css/bootstrap.min.css" crossorigin="anonymous" />
    <link rel="stylesheet" type="text/css"
        href="https://cdnjs.cloudflare.com/ajax/libs/bootswatch/5.2.3/vapor/bootstrap.min.css" crossorigin="anonymous" />
    <link rel="stylesheet" type="text/css"
        href="https://jmblog.github.io/color-themes-for-google-code-prettify/themes/atelier-sulphurpool-dark.min.css" crossorigin="anonymous" />
    <style>
        pre.prettyprint { border: 0px !important; }
        .errorline { background-color: #330000; }
        .linenums { list-style: decimal inside; padding-left: 0; }
    </style>
    <title>Lua error - foxCaves</title>
    </head><body onload='prettyPrint();'><div class='container'>
]]

local function debug_trace(err)
    local out =
        {
            dbg_trace_hdr,
            "<div class='card border-primary mb-3'><div class='card-header'>Basic info</div><div class='card-body'>",
            string.format(
                [[<table class="table table-striped"><tbody>
                    <tr><th scope="col">Error</th><td>%s</td></tr>
                    <tr><th scope="col">UserID</th><td>%s</td></tr>
                    <tr><th scope="col">IP</th><td>%s</td></tr>
                    <tr><th scope="col">URL</th><td>%s</td></tr>]],
                escape_html(err),
                escape_html(ngx.ctx.user and ngx.ctx.user.id or 'N/A'),
                escape_html(ngx.var.remote_addr),
                escape_html(ngx.var.request_uri)
            ),
            '</tbody></table></div></div>',
        }

    local cur
    for level = 2, 100 do
        cur = debug.getinfo(level)

        if not cur then
            break
        end

        local src_file = cur.short_src
        if src_file:sub(1, 9) == '[string "' then
            src_file = src_file:sub(10, -3)
        end

        table.insert(
            out,
            "<div class='card border-primary mb-3'><div class='card-header'>Level " .. tostring(
                level
            ) .. "</div><div class='card-body'>"
        )

        table.insert(
            out,
            "<h4 class='card-title'>Info</h4><div class='card-text'><ul><li>Where: " .. escape_html(src_file) .. '</li>'
        )
        if cur.currentline ~= -1 then
            table.insert(out, '<li>Line: ' .. cur.currentline .. '</li>')
        end
        table.insert(
            out,
            '<li>What: ' .. (cur.name and "In function '" .. escape_html(cur.name) .. "'" or 'In main chunk') .. '</li></ul></div>'
        )

        table.insert(out, get_locals(level))
        table.insert(out, get_upvalues(cur.func))
        table.insert(out, get_function_code(cur))

        table.insert(out, '</div></div>')
    end

    table.insert(out, '</div></body></html>')
    return table.concat(out, '')
end

function M.run()
    local isok, err = xpcall(router.execute, debug_trace)
    ngx.req.discard_body()
    if not isok then
        ngx.status = 500
        ngx.header['Cache-Control'] = 'no-cache, no-store'
        ngx.header['Content-Type'] = 'text/html'
        ngx.print(err)
        ngx.log(ngx.ERR, 'Lua error: ' .. err)
    end
    utils.__on_shutdown()
    ngx.eof()
end

return M
