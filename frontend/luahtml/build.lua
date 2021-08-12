local lfs = require("lfs")

print("Building...")

dofile("template.lua")

local DISTDIR = "../dist"

local function storeTemplate(name)
    local template = evalTemplate(name)
    local fh = io.open(DISTDIR .. "/" .. name, "w")
    fh:write(template)
    fh:close()
end

os.execute("mkdir -p '" .. DISTDIR .. "'")

local function scanTemplateDirInt(dir, basedirlen)
    for file in lfs.dir(dir) do
        local first = file:sub(1, 1)
        if first ~= "." and first ~= "_" then
            local absfile = dir .. "/" .. file
            local attributes = lfs.attributes(absfile)
            local relfile = absfile:sub(basedirlen)
            if attributes.mode == "file" then
                storeTemplate(relfile)
            elseif attributes.mode == "directory" then
                os.execute("mkdir '" .. DISTDIR .. "/" .. relfile .. "'")
                scanTemplateDirInt(absfile, basedirlen)
            end
        end
    end
end
local function scanTemplateDir(dir)
    scanTemplateDirInt(dir, dir:len() + 2)
end
scanTemplateDir("templates")

print("Done!")
