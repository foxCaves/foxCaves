local EXTENSION_TO_MIMETYPE = {}
local MIMETYPE_TO_EXTENSIONS = {}

local function load_mimetypes()
    local fh = io.open('/usr/local/openresty/nginx/conf/mime.types', 'r')

    local semicolon = (';'):byte(1)
    local in_mimetypes = false
    local current_mimetype_defs = {}
    while true do
        local line = fh:read('*l')
        if not line then
            break
        end

        line = line:gsub('^%s+', ''):gsub('%s+$', ''):gsub('%s+', ' ')
        if line == 'types {' then
            in_mimetypes = true
        elseif line == '}' then
            in_mimetypes = false
        elseif in_mimetypes then
            for token in string.gmatch(line, '[^%s]+') do
                local had_semicolon = token:byte(#token) == semicolon
                if had_semicolon then
                    token = token:sub(1, #token - 1)
                end

                if token ~= '' then
                    table.insert(current_mimetype_defs, token)
                end

                if had_semicolon then
                    local mimetype = table.remove(current_mimetype_defs, 1)
                    if not MIMETYPE_TO_EXTENSIONS[mimetype] then
                        MIMETYPE_TO_EXTENSIONS[mimetype] = {}
                    end

                    for _, ext in pairs(current_mimetype_defs) do
                        EXTENSION_TO_MIMETYPE[ext] = mimetype
                        table.insert(MIMETYPE_TO_EXTENSIONS[mimetype], ext)
                    end
                    current_mimetype_defs = {}
                end
            end
        end
    end
    fh:close()
end
load_mimetypes()

local M = {}

require('foxcaves.module_helper').setmodenv()

function M.get_extensions_for(mimetype)
    return MIMETYPE_TO_EXTENSIONS[mimetype] or {}
end

function M.get_mimetype_for(extension)
    return EXTENSION_TO_MIMETYPE[extension] or 'application/octet-stream'
end

return M
